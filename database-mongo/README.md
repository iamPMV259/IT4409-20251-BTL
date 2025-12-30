
# database-mongo

Thư mục này dùng để chạy MongoDB bằng Docker Compose cho toàn bộ hệ thống.

## Thành phần

- `docker-compose.yaml`: chạy container MongoDB và tạo volume để lưu dữ liệu.

## Yêu cầu

- Docker + Docker Compose

## Chạy MongoDB

```bash
cd database-mongo
docker compose up -d
```

Kiểm tra container:

```bash
docker ps | grep mongodb-project-management
```

## Thông tin kết nối

- Host port: `27057`
- Username: `mongodb`
- Password: `mongodb`

Connection string (khi backend chạy trên máy host):

```text
mongodb://mongodb:mongodb@localhost:27057/
```

Ghi chú:

- Backend Node.js sẽ ghép thêm `/<db_name>` dựa trên `MONGO_DB_NAME`.
- Backend Python dùng `mongo.uri` và `mongo.db_name` trong `backend-py/app-config.yaml`.

## Dừng và xoá dữ liệu

Dừng dịch vụ:

```bash
cd database-mongo
docker compose down
```

Xoá cả dữ liệu (volume):

```bash
cd database-mongo
docker compose down -v
```

