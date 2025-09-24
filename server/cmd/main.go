package main

import (
	"fmt"
	"log"
	"net/http"
)

func index(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Hello World")
}

func main() {
	http.HandleFunc("/", index)
	fmt.Println("Server is running on http://localhost:18080")
	err := http.ListenAndServe(":18080", nil)
	if err != nil {
		log.Fatalf("Server fail to start: %v", err)
	}
}
