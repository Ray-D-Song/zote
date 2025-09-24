# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/web

# Copy frontend package files
COPY web/package.json web/yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy frontend source code
COPY web ./

# Build frontend (outputs to ../server/internal/static/web-dist)
RUN yarn build

# Stage 2: Build backend
FROM golang:1.24-alpine AS backend-builder

# Install make
RUN apk add --no-cache make

WORKDIR /app

# Copy go mod files
COPY server/go.mod ./server/

# Download go dependencies (go.sum will be created if needed)
RUN cd server && go mod download

# Copy entire project (including frontend build from previous stage)
COPY --from=frontend-builder /app ./
COPY server ./server/
COPY Makefile ./

# Build the Go application
RUN make build

# Stage 3: Runtime
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=backend-builder /app/bin/server .

# Expose port
EXPOSE 18080

# Run the binary
CMD ["./server"]