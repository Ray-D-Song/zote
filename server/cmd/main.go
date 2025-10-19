package main

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"log/slog"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/ray-d-song/zote/server/internal/static"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var (
	db           *gorm.DB
	initErr      error
	appConfig    = &AppConfig{}
	slogInstance *slog.Logger
	logFile      *os.File
	sessionName  = "zote-session"
	sessionStore *sessions.CookieStore
	authKey      = make([]byte, 32)
	encryptKey   = make([]byte, 32)
)

type M = map[string]any

type Logger struct {
}

func (l *Logger) Info(msg string, kv ...any) {
	slogInstance.LogAttrs(context.Background(), slog.LevelInfo, msg, kvToAttrs(kv)...)
}

func (l *Logger) Warn(msg string, kv ...any) {
	slogInstance.LogAttrs(context.Background(), slog.LevelWarn, msg, kvToAttrs(kv)...)
}

func (l *Logger) Error(msg string, err error, kv ...any) {
	stack := captureStack(3)
	attrs := kvToAttrs(kv)
	attrs = append(attrs, slog.String("error", err.Error()), slog.String("stack", stack))
	slogInstance.LogAttrs(context.Background(), slog.LevelError, msg, kvToAttrs(kv)...)
}

type HttpServer struct {
	server  *http.Server
	apiMux  *http.ServeMux
	rootMux *http.ServeMux
}

func (h *HttpServer) Init() {
	h.rootMux = http.NewServeMux()
	h.apiMux = http.NewServeMux()
	h.apiMux.Handle("/api/v1", h.rootMux)
	h.server = &http.Server{
		Handler:        preMiddleware(h.apiMux),
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   120 * time.Second, // Longer for large file downloads
		IdleTimeout:    120 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1MB
	}
}
func (h *HttpServer) Start(port int) error {
	if port < 0 || port > 65535 {
		return errors.New("http server start error: port out of range(0-65535)")
	}
	h.server.Addr = ":" + strconv.Itoa(port)
	webDist, err := fs.Sub(static.WebDist, "web-dist")
	if err != nil {
		log.Fatalf("Server fail to start: %v", err)
	}
	// Use gzipped file server for better large file handling
	fileServer := gziphandler.GzipHandler(http.FileServer(http.FS(webDist)))
	h.rootMux.Handle("/", fileServer)

	logger.Info(fmt.Sprintf("Server start on port: %d", port))
	log.Fatal(h.server.ListenAndServe())

	return nil
}
func (h *HttpServer) Add(method string, path string, handler func(w http.ResponseWriter, r *http.Request)) {
	pattern := fmt.Sprintf("%s %s", method, path)
	h.apiMux.HandleFunc(pattern, handler)
}
func (h *HttpServer) All(path string, handler func(w http.ResponseWriter, r *http.Request)) {
	h.apiMux.HandleFunc(path, handler)
}
func (h *HttpServer) Get(path string, handler func(w http.ResponseWriter, r *http.Request)) {
	h.Add("GET", path, handler)
}
func (h *HttpServer) Post(path string, handler func(w http.ResponseWriter, r *http.Request)) {
	h.Add("POST", path, handler)
}

func NewHttpServer() *HttpServer {
	return &HttpServer{}
}

var logger = &Logger{}

type AppConfig struct {
	DBPath         string
	SignupsAllowed bool
}

type User struct {
	gorm.Model
	Name     string `json:"name"`
	Username string `json:"username"`
	Password string `json:"-"`
	Email    string `json:"email"`
}

type File struct {
	gorm.Model
	Name string `json:"name"`
	Path string `json:"path"`
	Size int64  `json:"size"`
}

type QuickNote struct {
	gorm.Model
	Title   string `json:"name"`
	Path    string `json:"path"`
	Content string `json:"content"`
}

func init() {
	initLogger()
	if _, err := rand.Read(authKey); err != nil {
		log.Fatalf("generate auth key: %v", err)
	}
	if _, err := rand.Read(encryptKey); err != nil {
		log.Fatalf("generate encrypt key: %v", err)
	}
	sessionStore = sessions.NewCookieStore(authKey, encryptKey)
	appConfig.DBPath, _ = os.LookupEnv("DB_PATH")
	if appConfig.DBPath == "" {
		appConfig.DBPath = "data.db"
	}
	signupsAllowed, _ := os.LookupEnv("SIGNUPS_ALLOWED")
	if signupsAllowed == "true" {
		appConfig.SignupsAllowed = true
	} else {
		appConfig.SignupsAllowed = false
	}
	db, initErr = gorm.Open(sqlite.Open(appConfig.DBPath))
	if initErr != nil {
		log.Panicln(initErr)
	}
	initErr = db.AutoMigrate(&User{}, &File{}, &QuickNote{})
	if initErr != nil {
		log.Panicln(initErr)
	}
}

func initLogger() {
	logFile, initErr = os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if initErr != nil {
		slog.Error("Create log file failed", "error", initErr)
		os.Exit(1)
	}
	mw := mulWriter{writers: []io.Writer{os.Stdout, logFile}}

	slogInstance = slog.New(slog.NewJSONHandler(mw, &slog.HandlerOptions{
		AddSource: true,
		Level:     slog.LevelDebug,
	}))

	logger.Info("Logger init success")
}

func RegisterAuthApi(h *HttpServer) {
	h.Post("/api/v1/login", func(w http.ResponseWriter, r *http.Request) {
		username := r.FormValue("username")
		password := r.FormValue("password")
		u := &User{}
		db.First(u, "username = ?", username)
		if !checkPwd(password, u.Password) {
			writeForbidden(w, "Username or password incorrect")
		}
		s, err := sessionStore.Get(r, sessionName)
		if err != nil {
			writeInternalError(w)
		}
		s.Values["username"] = username
		err = sessionStore.Save(r, w, s)
		writeOk(w)
	})

	h.Post("/api/v1/signup", func(w http.ResponseWriter, r *http.Request) {
		if !appConfig.SignupsAllowed {
			writeForbidden(w, "Signups are disabled")
			return
		}

		username := strings.TrimSpace(r.FormValue("username"))
		password := r.FormValue("password")
		switch {
		case username == "":
			writeJSON(w, http.StatusBadRequest, M{"status": "error", "msg": "Username required"})
			return
		case len(password) < 6:
			writeJSON(w, http.StatusBadRequest, M{"status": "error", "msg": "Password too weak, at least 6 character"})
			return
		}
		err := db.Transaction(func(tx *gorm.DB) error {
			var exist uint

			if err := db.Model(&User{}).Select("id").Where("username = ?", username).Limit(1).Scan(&exist).Error; err != nil {
				return err
			}
			if exist > 0 {
				return gorm.ErrDuplicatedKey
			}
			hash, err := hashPwd(password)
			if err != nil {
				return fmt.Errorf("hashPwd: %w", err)
			}
			return tx.Create(&User{Username: username, Password: hash}).Error
		})

		switch {
		case errors.Is(err, gorm.ErrDuplicatedKey):
			writeJSON(w, http.StatusConflict, M{"status": "error", "msg": "User already exists"})
		case err != nil:
			logger.Error("signup error", err)
			writeInternalError(w)
		default:
			writeJSON(w, http.StatusOK, M{"status": "ok"})
		}

	})
}

func RegisterQuickNoteApi(h *HttpServer) {
	h.Post("/quick-note/update", func(w http.ResponseWriter, r *http.Request) {
		var qn QuickNote
		err := json.NewDecoder(r.Body).Decode(&qn)
		defer r.Body.Close()
		if err != nil {
			logger.Error("Json decode quick note error", err)
			writeInternalError(w)
		}
	})
}

func main() {
	h := NewHttpServer()
	h.Init()

	h.All("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})
	RegisterAuthApi(h)
	RegisterQuickNoteApi(h)

	h.Start(18080)
	defer logFile.Close()
}

func preMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		uid := uuid.New()
		logger.Info("request start", "req_id", uid, "method", r.Method, "path", r.URL.Path, "remote", r.RemoteAddr)
		next.ServeHTTP(w, r)
		logger.Info("request finish", "req_id", uid, "path", r.URL.Path, "took", time.Since(start).Milliseconds())
	})

}

func kvToAttrs(kv []any) []slog.Attr {
	var attrs []slog.Attr
	for i := 0; i < len(kv); i += 2 {
		k, ok := kv[i].(string)
		if !ok {
			slog.Default().Warn("Invalid log key type", slog.Any("key", k))
		}
		attrs = append(attrs, slog.Any(k, kv[i+1]))
	}
	return attrs
}

type mulWriter struct {
	writers []io.Writer
}

func (m mulWriter) Write(p []byte) (n int, err error) {
	for _, w := range m.writers {
		w.Write(p)
	}
	return len(p), nil
}

func captureStack(skip int) string {
	var pcs [32]uintptr
	n := runtime.Callers(skip, pcs[:])

	var sb strings.Builder
	frames := runtime.CallersFrames(pcs[:n])

	for {
		frame, more := frames.Next()
		fmt.Fprintf(&sb, "%s\n\t%s:%d\n", frame.Function, frame.File, frame.Line)
		if !more {
			break
		}
	}

	return sb.String()
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeInternalError(w http.ResponseWriter) {
	writeJSON(w, http.StatusInternalServerError, M{"status": "error", "msg": "Internal error"})
}

func writeOk(w http.ResponseWriter) {
	writeJSON(w, http.StatusOK, M{"status": "ok"})
}

func writeForbidden(w http.ResponseWriter, msg string) {
	writeJSON(w, http.StatusForbidden, M{"status": "error", "msg": msg})
}

func hashPwd(pwd string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func checkPwd(pwd string, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(pwd), []byte(hash))
	if err != nil {
		return false
	}
	return true
}
