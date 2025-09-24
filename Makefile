GO_BUILD = go build

TARGET = bin/server

SRCS = server/cmd/main.go

build:
	$(GO_BUILD) -o $(TARGET) $(SRCS)

.PHONY: clean
clean:
	rm -f $(TARGET)
