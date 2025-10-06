package main

import (
	"context"
	"fmt"
	"io"
	"io/fs"
	"log"
	"log/slog"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/ray-d-song/zote/server/internal/static"
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

var logger = &Logger{}

type AppConfig struct {
	DBPath string
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
		Handler:        root,
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   120 * time.Second, // Longer for large file downloads
		IdleTimeout:    120 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1MB
	}

	log.Println("listen http://localhost:18080")
	log.Fatal(server.ListenAndServe())
}

func preMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

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
