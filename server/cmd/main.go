package main

import (
	"io/fs"
	"log"
	"net/http"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/ray-d-song/zote/server/internal/static"
)

func main() {
	api := http.NewServeMux()
	api.HandleFunc("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})
	webDist, err := fs.Sub(static.WebDist, "web-dist")
	if err != nil {
		log.Fatalf("Server fail to start: %v", err)
	}
	// Use gzipped file server for better large file handling
	fileServer := gziphandler.GzipHandler(http.FileServer(http.FS(webDist)))
	root := http.NewServeMux()
	root.Handle("/api/v1/", api)
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
