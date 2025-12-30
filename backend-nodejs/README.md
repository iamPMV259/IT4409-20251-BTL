
# Backend Node.js (Express + MongoDB + Socket.IO)

Backend này cung cấp API (và Socket.IO) chạy mặc định ở cổng `8346`.

## Yêu cầu

- Node.js >= 18 (khuyến nghị LTS)
- MongoDB (local hoặc remote)

## Cấu hình môi trường (.env)

Backend sẽ tự tìm file `.env` theo thứ tự:

1. Ở **root của repo**: `./.env`
2. Ở **thư mục backend-nodejs**: `./backend-nodejs/.env`
3. Ở **thư mục src**: `./backend-nodejs/src/.env`

Khuyến nghị: tạo `backend-nodejs/.env` (dễ quản lý nhất).

Bạn có thể copy mẫu:

```bash
cp src/.env.example .env
```

Các biến quan trọng:

```dotenv
# Port for the Express server
PORT=8346

# MongoDB (chỉ base URI, db name sẽ được ghép thêm từ MONGO_DB_NAME)
MONGO_URI=mongodb://<user>:<pass>@<host>:<port>/
MONGO_DB_NAME=project_management

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRE=30d
JWT_ALGORITHM=HS256
```

Lưu ý:

- `MONGO_URI` trong code sẽ được **ghép thêm** `/<MONGO_DB_NAME>`.
- `MONGO_URI` có thể có dấu `/` cuối, hệ thống sẽ tự xử lý.

## Cài đặt

```bash
cd backend-nodejs
npm install
```

## Chạy dev (hot reload)

```bash
cd backend-nodejs
npm run dev
```

## Chạy production

```bash
cd backend-nodejs
npm start
```

## URL quan trọng

- API base: `http://localhost:8346/api/v1`
- Swagger UI: `http://localhost:8346/api-docs`
- Health root: `http://localhost:8346/`

## Ghi chú về realtime

Backend này khởi tạo Socket.IO server (qua `SocketService`). Backend Python sẽ kết nối sang Node.js (theo `backend-py/app-config.yaml`) để relay event realtime.

