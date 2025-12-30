
# Backend Python (FastAPI + MongoDB + WebSocket relay)

Backend này cung cấp REST API (FastAPI) và WebSocket endpoint. Mặc định chạy:

- Local/dev: `http://localhost:8345`
- Docker: container lắng nghe `8000`, map ra host `8345` (xem `docker-compose.yaml`).

Ngoài ra backend này còn chạy một Socket.IO client để kết nối sang backend Node.js nhằm relay các event realtime.

## Yêu cầu

- Python `>=3.10,<3.11`
- (Khuyến nghị) `uv` để cài dependency nhanh
- MongoDB (local hoặc remote)
- Node.js backend đang chạy (để realtime relay hoạt động đầy đủ)

## Cấu hình

File cấu hình chính: `app-config.yaml`.

Nếu chưa có, copy từ template:

```bash
cd backend-py
cp app-config-template.yaml app-config.yaml
```

Nội dung tối thiểu:

```yaml
mongo:
	uri: "mongodb://<user>:<pass>@<host>:<port>/"
	db_name: "project_management"

nodejs_backend:
	host: "localhost"
	port: "8346"
```

Ghi chú:

- `mongo.uri` là connection string MongoDB. Có thể dùng biến môi trường dạng `${VAR}` trong YAML.
- `nodejs_backend.host/port` là nơi backend Python sẽ connect tới Socket.IO server của Node.js.

## Cài dependency

### Cách A: dùng uv (khuyến nghị)

```bash
cd backend-py
uv sync
```

### Cách B: dùng venv + pip

```bash
cd backend-py
python3.10 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e .
```

## Chạy local/dev

Khuyến nghị chạy bằng uvicorn:

```bash
cd backend-py
uvicorn api.main:app --host 0.0.0.0 --port 8345 --reload
```

Hoặc chạy trực tiếp file (cũng dùng uvicorn, port `8345`):

```bash
cd backend-py
python api/main.py
```

## Chạy bằng Docker

```bash
cd backend-py
docker compose up --build
```

Sau khi chạy, truy cập API ở:

- `http://localhost:8345/`

Lưu ý khi chạy Docker:

- Trong container, app chạy ở port `8000` và được map ra host port `8345`.
- `app-config.yaml` phải có `mongo.uri` có thể truy cập từ container (ví dụ MongoDB remote hoặc MongoDB cùng network).

## URL quan trọng

- Swagger UI: `http://localhost:8345/docs`
- OpenAPI JSON: `http://localhost:8345/openapi.json`
- Health: `http://localhost:8345/health`

## WebSocket

- Endpoint: `ws://localhost:8345/ws/projects/{project_id}?token={jwt}`

Backend sẽ nhận event từ Node.js (Socket.IO) và broadcast cho các client WebSocket đang join theo `project_id`.

