# FlowKit Cloudflare Tunnel Setup

Mục tiêu: expose **FlowKit API 8100** cho FE public gọi qua HTTPS Cloudflare, trong khi Chrome extension vẫn nối local `ws://127.0.0.1:9222` với backend Docker trên cùng máy.

## Kiến trúc

```txt
FE public / browser
  ↓ HTTPS
https://YOUR_FLOWKIT_API_DOMAIN
  ↓ Cloudflare Tunnel
cloudflared container
  ↓ Docker network
http://flowkit:8100
  ↓ local WS bridge
Chrome extension → ws://127.0.0.1:9222
```

Tunnel này chỉ expose API 8100. Không expose WS 9222.

## 1. Tạo tunnel token

Cloudflare Zero Trust → Networks → Tunnels → Create tunnel → Docker.

Copy token vào file `.env` ở repo root:

```env
CLOUDFLARE_TUNNEL_TOKEN=...
FLOWKIT_PUBLIC_API_URL=https://YOUR_FLOWKIT_API_DOMAIN
```

Không commit `.env`. Repo đã ignore `.env`.

## 2. Route public hostname

Trong Cloudflare tunnel dashboard, thêm public hostname:

```txt
Subdomain/domain: YOUR_FLOWKIT_API_DOMAIN
Service type: HTTP
Service URL: http://flowkit:8100
```

Ví dụ:

```txt
https://flowkit-api.example.com -> http://flowkit:8100
```

## 3. Start Docker

```bash
docker compose up -d
```

Kiểm tra:

```bash
docker compose ps
curl http://127.0.0.1:8100/health
```

Kiểm tra domain public:

```bash
curl https://YOUR_FLOWKIT_API_DOMAIN/health
```

Expect:

```json
{"status":"ok","extension_connected":true}
```

## 4. Cấu hình FE

Trong FlowKit Studio FE:

```txt
Settings → Backend Connection → API Base URL
```

Nhập:

```txt
https://YOUR_FLOWKIT_API_DOMAIN
```

Nếu FE cũng chạy HTTPS, dùng domain Cloudflare này để tránh mixed-content khi gọi `http://127.0.0.1:8100`.

## 5. Bảo mật

FlowKit API hiện không có auth built-in. Nên bật Cloudflare Access cho hostname API nếu domain public:

```txt
Cloudflare Zero Trust → Access → Applications → Add application
Application type: Self-hosted
Domain: YOUR_FLOWKIT_API_DOMAIN
Policy: chỉ email của bạn / nhóm của bạn
```

Không expose `9222` public. WS bridge extension chỉ nên local.

## 6. Troubleshooting

### `docker compose up` báo thiếu token

Tạo `.env` từ `.env.example`:

```bash
copy .env.example .env
```

rồi điền `CLOUDFLARE_TUNNEL_TOKEN`.

### Domain public trả 502/1033

- Kiểm tra `docker compose ps` có `flowkit-cloudflared` đang chạy.
- Kiểm tra route trong Cloudflare là `http://flowkit:8100`, không phải `http://127.0.0.1:8100`.
- Kiểm tra backend container healthy: `curl http://127.0.0.1:8100/health`.

### `/health` ok nhưng `extension_connected=false`

Mở Chrome có FlowKit extension trên cùng máy đang chạy Docker, rồi mở Google Flow để extension connect và capture token.
