
# backend-py (FastAPI + MongoDB + WebSocket relay)

Backend này cung cấp REST API cho frontend và WebSocket endpoint để realtime.
Ngoài ra, backend này chạy một Socket.IO client để kết nối sang `backend-nodejs` và relay các event sang WebSocket của FastAPI.

## Yêu cầu

- Python `>=3.10,<3.11`
- MongoDB đang chạy (xem `database-mongo/`)
- Backend Node.js đang chạy (để realtime relay hoạt động)

## Cấu hình `app-config.yaml` và `.env`

Backend sẽ load cấu hình từ `app-config.yaml` và `.env`(ở root thư mục `backend-py`).

Nếu chưa có, tạo từ template:

```bash
cd backend-py
cp app-config-template.yaml app-config.yaml
cp .env.example .env
```

Ví dụ nội dung:

```yaml
mongo:
	uri: "mongodb://mongodb:mongodb@localhost:27057/"
	db_name: "project_management"

nodejs_backend:
	host: "localhost"
	port: "8346"
```

## Cài dependency

### Cách A: dùng uv (khuyến nghị)

```bash
cd backend-py
uv sync
```

### Cách B: venv + pip

```bash
cd backend-py
python3.10 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e .
```

## Chạy local/dev

```bash
cd backend-py
uvicorn api.main:app --host 0.0.0.0 --port 8345 --reload
```

## Chạy bằng Docker

Dockerfile chạy uvicorn ở port `8000`, và `docker-compose.yaml` map ra host port `8345`.

```bash
cd backend-py
docker compose up --build
```

## URL quan trọng

- Root: `http://localhost:8345/`
- Swagger UI: `http://localhost:8345/docs`
- Health: `http://localhost:8345/health`

## WebSocket

- Endpoint: `ws://localhost:8345/ws/projects/{project_id}?token={jwt}`

