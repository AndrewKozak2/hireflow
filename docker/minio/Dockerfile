# Local MinIO for HireFlow, built from source.
# MinIO no longer publishes official images (minio/minio on Docker Hub, quay.io/minio/minio),
# so this compiles the latest release from github.com/minio/minio.
#
# Build:  docker build -t hireflow-minio docker/minio
# Used by docker/laptop/docker-compose.yml (service "minio").

FROM golang:1.25-alpine AS build
ENV CGO_ENABLED=0 GOTOOLCHAIN=auto
# HTTP/1.1 only: sum.golang.org kept dropping HTTP/2 streams on this network.
ENV GODEBUG=http2client=0
# Cache downloaded modules across builds so a retry doesn't start from zero.
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go install github.com/minio/minio@latest

FROM alpine:3.22
RUN apk add --no-cache ca-certificates
COPY --from=build /go/bin/minio /usr/bin/minio
EXPOSE 9000 9001
ENTRYPOINT ["minio"]
CMD ["server", "/data", "--console-address", ":9001"]
