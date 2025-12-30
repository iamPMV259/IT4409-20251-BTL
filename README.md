
# Project Management System (Kanban)

Dự án gồm 4 phần chạy theo pipeline:

1. `database-mongo` (MongoDB)
2. `backend-nodejs` (Express API + Socket.IO)
3. `backend-py` (FastAPI API + WebSocket relay)
4. `frontend` (React + Vite)

Mục tiêu: cung cấp hệ thống quản lý dự án dạng Kanban (workspace → project → columns → tasks) kèm realtime cập nhật qua WebSocket.

## Kiến trúc tổng quan

- MongoDB lưu dữ liệu.
- Backend Node.js cung cấp API (và phát event realtime qua Socket.IO).
- Backend Python cung cấp API cho frontend và mở WebSocket endpoint (`/ws/projects/{project_id}`); backend này đồng thời kết nối sang Socket.IO của Node.js để relay sự kiện realtime cho các client WebSocket.
- Frontend gọi REST API và kết nối WebSocket để cập nhật realtime.

## Cấu trúc thư mục

- `database-mongo/`: docker-compose để chạy MongoDB.
- `backend-nodejs/`: Express API + Swagger + Socket.IO.
- `backend-py/`: FastAPI API + WebSocket relay + cấu hình YAML.
- `frontend/`: React UI chạy bằng Vite.

## Cổng mặc định

- MongoDB: `27057` (host) → `27017` (container)
- Node.js API: `8346`
- Python API: `8345`
- Frontend dev: `3000`

## Hướng dẫn chạy (luồng chính)

### 1) Chạy MongoDB

Xem hướng dẫn chi tiết ở [database-mongo/README.md](database-mongo/README.md).

Tóm tắt:

```bash
cd database-mongo
docker compose up -d
```

### 2) Chạy backend Node.js

Xem hướng dẫn chi tiết ở [backend-nodejs/README.md](backend-nodejs/README.md).

Tóm tắt:

```bash
cd backend-nodejs
npm install
npm run dev
```

### 3) Chạy backend Python

Xem hướng dẫn chi tiết ở [backend-py/README.md](backend-py/README.md).

Tóm tắt:

```bash
cd backend-py
docker compose up --build -d
```

### 4) Chạy frontend

Xem hướng dẫn chi tiết ở [frontend/README.md](frontend/README.md).

Tóm tắt:

```bash
cd frontend
npm install
npm run dev
```

## Kiểm tra nhanh sau khi chạy

- Node.js Swagger: `http://localhost:8346/api-docs`
- Python Swagger: `http://localhost:8345/docs`
- Frontend: `http://localhost:3000`

