
# backend-nodejs (Express + MongoDB + Socket.IO)

Backend này cung cấp API quản lý dự án (Kanban) và realtime event qua Socket.IO.

## Yêu cầu

- Node.js >= 18 (khuyến nghị LTS)
- MongoDB đang chạy (xem `database-mongo/`)

## Cấu hình `.env`

Backend sẽ tự tìm `.env` theo thứ tự:

1. Root repo: `./.env`
2. Thư mục backend-nodejs: `./backend-nodejs/.env`
3. Thư mục src: `./backend-nodejs/src/.env`

Khuyến nghị: đặt ở `backend-nodejs/.env`.

Tạo nhanh từ file mẫu:

```bash
cd backend-nodejs
cp src/.env.example .env
```

Ví dụ nội dung:

```dotenv
PORT=8346
NODE_ENV=development

# Lưu ý: MONGO_URI là base uri, db name được ghép thêm từ MONGO_DB_NAME
MONGO_URI=mongodb://mongodb:mongodb@localhost:27057/
MONGO_DB_NAME=project_management

JWT_SECRET="your-secret-key"
JWT_EXPIRE=30d
JWT_ALGORITHM=HS256
```

## Cài đặt

```bash
cd backend-nodejs
npm install
```

## Chạy dev

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
- Root: `http://localhost:8346/`

## Vai trò trong luồng chạy

Backend Python sẽ kết nối sang Socket.IO của backend này (theo `backend-py/app-config.yaml`) để relay event realtime cho frontend.

