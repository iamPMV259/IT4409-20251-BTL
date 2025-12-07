from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

from configs import get_logger
from core.security import decode_access_token
from websockket.connection_manager import manager
from websockket.event_handler import event_handler

logger = get_logger(__name__)

router = APIRouter()


async def get_current_user_ws(
    token: str | None = Query(None, description="JWT access token")
) -> str:
    
    if not token:
        raise WebSocketDisconnect(code=4001, reason="Missing authentication token")
    
    try:
        user_id = decode_access_token(token)
        if not user_id:
            raise WebSocketDisconnect(code=4001, reason="Invalid token")
        return user_id
    except Exception as e:
        logger.error(f"WebSocket authentication failed: {e}")
        raise WebSocketDisconnect(code=4001, reason="Authentication failed")


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str = Depends(get_current_user_ws)
):
    
    await manager.connect(websocket, user_id)
    
    try:
        _ = await manager.send_personal_message(
            websocket,
            {
                "type": "connection:established",
                "data": {
                    "user_id": user_id,
                    "message": "Connected to WebSocket server"
                }
            }
        )
        
        while True:
            message = await websocket.receive_text()
            
            await event_handler.handle_message(websocket, message)
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
        await manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        await manager.disconnect(websocket)


@router.get("/ws/stats")
async def get_websocket_stats():
    
    return manager.get_stats()


@router.get("/ws/health")
async def websocket_health():
    
    stats = manager.get_stats()
    return {
        "status": "healthy",
        "total_connections": stats["total_connections"],
        "total_users": stats["total_users"],
        "total_rooms": stats["total_rooms"]
    }


