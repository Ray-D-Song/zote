GO_BUILD = go build

TARGET = bin/server

SRCS = server/cmd/main.go

build:
	cd server && $(GO_BUILD) -o ../$(TARGET) cmd/main.go

dev-server:
	cd server && $(GO_BUILD) -o ../$(TARGET) cmd/main.go && ../bin/server | jq -C .

dev-web:
	cd web && pnpm dev

.PHONY: clean
clean:
	rm -f $(TARGET)
