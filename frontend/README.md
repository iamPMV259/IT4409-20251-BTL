
# Frontend (React + Vite)

Frontend chạy bằng Vite, mặc định dev server ở `http://localhost:3000`.

## Yêu cầu

- Node.js >= 18 (khuyến nghị LTS)

## Cài đặt

```bash
cd frontend
npm install
```

## Cấu hình kết nối backend

Tất cả cấu hình đều được load từ file `.env`. Copy file mẫu:

```bash
cp .env.example .env
```

Các biến môi trường:

```dotenv
# Host của backend (localhost hoặc IP server)
VITE_HOST=localhost
# Port của backend Python
VITE_PORT=8345
# Base endpoint của API
VITE_BASE_ENDPOINT=api/v1
# Protocol cho HTTP (http hoặc https)
VITE_HTTP_PROTOCOL=http
# Protocol cho WebSocket (ws hoặc wss)
VITE_WS_PROTOCOL=ws
```

### REST API

- **Dev**: gọi `/${BASE_ENDPOINT}` (mặc định `/api/v1`) và **proxy qua Vite** tới backend.
- **Build/Production**: gọi trực tiếp `http://{VITE_HOST}:{VITE_PORT}/{VITE_BASE_ENDPOINT}`.

### WebSocket

WebSocket URL được build từ env: `{VITE_WS_PROTOCOL}://{VITE_HOST}:{VITE_PORT}/ws/projects/{project_id}`

## Chạy dev

```bash
cd frontend
npm run dev
```

Mặc định Vite chạy ở:

- `http://localhost:3000`

## Build

```bash
cd frontend
npm run build
```

Preview bản build:

```bash
npx vite preview
```

## Deploy lên Vercel

Khi deploy lên Vercel, cần cấu hình:

1. Thêm các biến môi trường trong Vercel Dashboard (Settings > Environment Variables)
2. Sửa `vercel.json` với domain backend thực tế

## Thứ tự chạy toàn hệ thống (khuyến nghị)

1. MongoDB
2. Backend Node.js (port `8346`)
3. Backend Python (port `8345`)
4. Frontend (port `3000`)

