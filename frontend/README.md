
# frontend (React + Vite)

Frontend UI của hệ thống quản lý dự án. Frontend gọi REST API và WebSocket từ backend Python.

## Yêu cầu

- Node.js >= 18 (khuyến nghị LTS)

## Cài đặt

```bash
cd frontend
npm install
```

## Cấu hình `.env`

Frontend **chỉ lấy địa chỉ backend từ `.env`**.

Tạo nhanh từ mẫu:

```bash
cd frontend
cp .env.example .env
```

Ví dụ `.env`:

```dotenv
VITE_HOST=localhost
VITE_PORT=8345
VITE_BASE_ENDPOINT=api/v1
VITE_HTTP_PROTOCOL=http
VITE_WS_PROTOCOL=ws
```

## Chạy dev

```bash
cd frontend
npm run dev
```

Mặc định Vite chạy ở `http://localhost:3000`.

## Build

```bash
cd frontend
npm run build
```

Preview bản build:

```bash
cd frontend
npx vite preview
```

## Vai trò trong luồng chạy

Chạy theo thứ tự:

1. MongoDB
2. backend-nodejs
3. backend-py
4. frontend

