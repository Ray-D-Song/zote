package main

import (
	"context"
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
)

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
	server *http.Server
}

func (h *HttpServer) Init() {
	h.server = &http.Server{
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
	logger.Info(fmt.Sprintf("Server running on port: %d", port))
	log.Fatal(h.server.ListenAndServe())

	return nil
}
func (h *HttpServer) Add(method string, path string, handler func(w http.ResponseWriter, r *http.Request)) {
	switch method {
	case "get":

	}
}
func (h *HttpServer) Get(path string, handler func(w http.ResponseWriter, r *http.Request)) {

}
func (h *HttpServer) Post(path string, handler func(w http.ResponseWriter, r *http.Request)) {

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

func init() {
	initLogger()
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
	initErr = db.AutoMigrate(&User{}, &File{})
	if initErr != nil {
		log.Panicln(initErr)
	}
}

func initLogger() {
	f, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		slog.Error("Create log file failed", err)
		os.Exit(1)
	}
	defer f.Close()
	mw := mulWriter{writers: []io.Writer{os.Stdout, f}}

	slogInstance = slog.New(slog.NewJSONHandler(mw, &slog.HandlerOptions{
		AddSource: true,
		Level:     slog.LevelDebug,
	}))

	logger.Info("Logger init success")
}

func main() {
	runServer()
}

func runServer() {

	root := http.NewServeMux()

	api := http.NewServeMux()
	api.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})
	api.HandleFunc("/api/v1/signup", func(w http.ResponseWriter, r *http.Request) {
		if !appConfig.SignupsAllowed {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusForbidden)
			_ = json.NewEncoder(w).Encode(map[string]any{})
		}
		w.Write([]byte(`{"status":"ok"}`))
	})
	root.Handle("/api/v1/", api)

	webDist, err := fs.Sub(static.WebDist, "web-dist")
	if err != nil {
		log.Fatalf("Server fail to start: %v", err)
	}
	// Use gzipped file server for better large file handling
	fileServer := gziphandler.GzipHandler(http.FileServer(http.FS(webDist)))
	root.Handle("/", fileServer)

	// Configure server with proper timeouts
	server := &http.Server{
		Addr:           ":18080",
		Handler:        preMiddleware(root),
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   120 * time.Second, // Longer for large file downloads
		IdleTimeout:    120 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1MB
	}

	logger.Info("Server running on port: 18080")
	log.Fatal(server.ListenAndServe())
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
