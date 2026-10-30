FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/speedtest ./cmd/server

# Alpine keeps a tiny shell + wget for Docker HEALTHCHECK compatibility
FROM alpine:3.20
RUN adduser -D -H -u 10001 speedcheck \
  && apk add --no-cache ca-certificates wget
WORKDIR /
COPY --from=build /out/speedtest /speedtest
EXPOSE 18443
USER speedcheck
ENTRYPOINT ["/speedtest"]
