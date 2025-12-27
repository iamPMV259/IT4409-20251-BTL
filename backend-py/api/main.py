# api/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.router import authentication, columns, projects, search, tasks, workspaces
from api.websocket import (
    count_active_connections,
    count_total_rooms,
    count_total_users,
    start_socketio_client,
    stop_socketio_client,
)
from api.websocket import router as ws_router
from clients import Clients
from configs import get_logger

mongo_clients = Clients().get_mongo_client()
logger = get_logger("api-main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up API application...")
    
    await mongo_clients.initialize()
    
    await start_socketio_client()
    
    yield
    
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
app.include_router(search.router, prefix="/api/v1")
app.include_router(ws_router)


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