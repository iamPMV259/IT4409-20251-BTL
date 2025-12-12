from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.router import authentication, columns, projects, tasks, workspaces
from clients import Clients
from configs import get_logger
from websocket.router import router as ws_router
from websockket import manager
from websockket import router as websocket_router

mongo_clients = Clients().get_mongo_client()
logger = get_logger("api-main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up API application...")
    await mongo_clients.initialize()
    yield
    logger.info("Shutting down API application...")
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


app.include_router(authentication.router, prefix="/api/v1")
app.include_router(workspaces.router, prefix="/api/v1")
app.include_router(websocket_router, prefix="/api/v1", tags=["WebSocket"])
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(columns.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(ws_router)


@app.get(path="/", summary="Health Check", tags=["Health"])
async def root():
    """
    Root endpoint - API health check
    """
    return {
        "message": "Project Management API",
        "status": "running",
        "version": "1.0.0",
        "modules": [
            "Module 1: Authentication & User Management",
            "Module 2: Workspace Management",
            "Module 3: Tasks Management"
        ],
        "docs": "/docs",
        "developer": "Phung Minh Vu - 20235252"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "api": "running",
        "database": "connected",
        "websocket": {
            "active_connections": manager.get_connection_count(),
            "total_users": len(manager.user_connections),
            "total_rooms": len(manager.project_rooms)
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