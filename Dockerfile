FROM golang:1.22-alpine AS builder
RUN apk add --no-cache gcc musl-dev sqlite-dev
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o /learnflow ./cmd/server

FROM alpine:3.19
RUN apk add --no-cache sqlite-libs ca-certificates
WORKDIR /app
COPY --from=builder /learnflow .
COPY --from=builder /app/web/static ./web/static
COPY --from=builder /app/index.html ./index.html
EXPOSE 3001
ENV PORT=3001
ENV ENVIRONMENT=production
CMD ["./learnflow"]
