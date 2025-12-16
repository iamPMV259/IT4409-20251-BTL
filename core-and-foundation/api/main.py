# api/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import đầy đủ các router
from api.router import authentication, columns, projects, tasks, workspaces
from api.websocket import (
    count_active_connections,
    count_total_rooms,
    count_total_users,
    start_socketio_client,
    stop_socketio_client,
)

# Import router websocket và các hàm lifecycle
from api.websocket import router as ws_router
from clients import Clients
from configs import get_logger

mongo_clients = Clients().get_mongo_client()
logger = get_logger("api-main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up API application...")
    
    # 1. Khởi tạo MongoDB
    await mongo_clients.initialize()
    
    # 2. Khởi tạo kết nối Socket tới Node.js (Chạy ngầm)
    # Lưu ý: Nếu Node.js chưa bật, nó sẽ log lỗi nhưng không crash app.
    # Cơ chế reconnect ở websocket.py sẽ xử lý sau.
    await start_socketio_client()
    
    yield
    
    # Cleanup
    logger.info("Shutting down API application...")
    await stop_socketio_client()
    await mongo_clients.close()


app = FastAPI(
    title="API for Project Management System",
    description="This API allows managing projects, tasks, and users.",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    middleware_class=CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(authentication.router, prefix="/api/v1")
app.include_router(workspaces.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(columns.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(ws_router) # Không cần prefix, đường dẫn gốc là /ws/...


@app.get(path="/", summary="Health Check", tags=["Health"])
async def root():
    return {
        "message": "Project Management API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "api": "running",
        "database": "connected",
        "websocket": {
            "active_connections": await count_active_connections(),
            "total_users": await count_total_users(),
            "total_rooms": await count_total_rooms()
        }
    }

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app="api.main:app",
        host="0.0.0.0",
        port=8345,
        reload=True,
    )