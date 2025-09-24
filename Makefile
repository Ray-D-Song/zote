GO_BUILD = go build

TARGET = bin/server

SRCS = server/cmd/main.go

build:
	cd server && $(GO_BUILD) -o ../$(TARGET) cmd/main.go

.PHONY: clean
clean:
	rm -f $(TARGET)
