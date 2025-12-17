# api/websocket.py
import asyncio
import json

import socketio
from fastapi import APIRouter, Header, Query, WebSocket, WebSocketDisconnect

from configs import get_logger, nodejs_backend_config
from websocket.manager import ws_manager

logger = get_logger("websocket")

router = APIRouter(prefix="/ws", tags=["WebSocket"])

NODEJS_BACKEND_URL = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}"

# Tạo client socketio
sio = socketio.AsyncClient(logger=False, engineio_logger=False)

# --- HELPER FUNCTIONS ---

async def forward_event_to_clients(event: str, data: dict):
    payload = data.get("data", {})
    # Cố gắng lấy projectId từ nhiều nguồn khác nhau trong data
    # print(f"Received event {event} with data: {data}")
    # print(f"Payload data: {payload}")
    project_id = payload.get("projectId") or payload.get("project_id") or payload.get("_id")
    
    if project_id:
        # Bắn tin hiệu cho các client đang kết nối vào Python
        _ = asyncio.create_task(
            ws_manager.broadcast_to_project(
                str(project_id),
                event,
                payload
            )
        )
        logger.info(f"🔄 [RELAY] Forwarded {event} to project {project_id}")
    else:
        logger.warning(f"⚠️ Event {event} missing projectId; cannot forward.")

async def ensure_connection():
    """
    Hàm này đảm bảo kết nối tới Node.js. 
    Nếu chưa kết nối sẽ thử kết nối.
    """
    if not sio.connected:
        try:
            logger.info(f"⏳ Connecting to Node.js backend at {NODEJS_BACKEND_URL}...")
            await sio.connect(
                NODEJS_BACKEND_URL, 
                transports=['websocket', 'polling'], 
                wait_timeout=5
            )
            logger.info("✅ Connected to Node.js backend")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Node.js backend: {e}")

# --- SOCKET.IO EVENTS (FROM NODEJS) ---

@sio.on('server:project_updated')
async def on_project_updated(data):
    await forward_event_to_clients('server:project_updated', data)

@sio.on('server:column_created')
async def on_column_created(data):
    await forward_event_to_clients('server:column_created', data)

@sio.on('server:column_updated')
async def on_column_updated(data):
    await forward_event_to_clients('server:column_updated', data)

@sio.on('server:column_deleted')
async def on_column_deleted(data):
    await forward_event_to_clients('server:column_deleted', data)

# --- STARTUP / SHUTDOWN HANDLERS ---

async def start_socketio_client():
    """Được gọi từ main.py khi khởi động server"""
    await ensure_connection()

async def stop_socketio_client():
    """Được gọi từ main.py khi tắt server"""
    if sio.connected:
        await sio.disconnect()
        logger.info("🛑 Disconnected from Node.js backend")

# --- MAIN WEBSOCKET ENDPOINT ---

@router.websocket("/projects/{project_id}")
async def project_websocket_endpoint(
    websocket: WebSocket,
    project_id: str,
):
    # 1. Chấp nhận kết nối từ Frontend
    await ws_manager.connect(websocket, project_id)
    
    try:
        # 2. Gửi thông báo join thành công cho Client
        await websocket.send_json(
            {
                "event": "client:join_project_room",
                "data": {"project_id": project_id}
            }
        )
        logger.info(f"Client joined project room: {project_id}")

        # 3. [FIXED] Kiểm tra kết nối tới Node.js trước khi Emit
        # Nếu server Python khởi động trước Node.js, kết nối ban đầu sẽ fail.
        # Đoạn này sẽ tự động thử kết nối lại khi có user vào room.
        if not sio.connected:
            await ensure_connection()

        if sio.connected:
            await sio.emit('join_project', project_id)
            logger.info(f"👉 Subscribed Python client to Node.js room: {project_id}")
        else:
            logger.warning(f"⚠️ Cannot subscribe to Node.js room {project_id} - Backend disconnected")

        # 4. Vòng lặp lắng nghe tin nhắn từ Client (để giữ connection alive)
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received from client in project {project_id}: {data}")
    
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, project_id)
        logger.info(f"Client disconnected from project room: {project_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket for project {project_id}: {e}")
        ws_manager.disconnect(websocket, project_id)

# --- STATS FUNCTIONS ---

async def count_active_connections():
    return len(ws_manager.active_connections)

async def count_total_users():
    unique_users = set()
    for connections in ws_manager.active_connections.values():
        unique_users.update(connections)
    return len(unique_users)

async def count_total_rooms():
    return len(ws_manager.active_connections)