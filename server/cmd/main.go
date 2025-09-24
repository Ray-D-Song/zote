package main

import (
	"io/fs"
	"log"
	"net/http"

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
	fileServer := http.FileServer(http.FS(webDist))
	root := http.NewServeMux()
	root.Handle("/api/v1", api)
	root.Handle("/", fileServer)
	log.Println("listen http://localhost:18080")
	log.Fatal(http.ListenAndServe(":18080", root))
}
