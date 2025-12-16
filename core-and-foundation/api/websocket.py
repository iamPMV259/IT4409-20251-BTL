import asyncio
import json

import socketio
from fastapi import APIRouter, Header, Query, WebSocket, WebSocketDisconnect

from configs import get_logger
from websocket.manager import ws_manager

logger = get_logger("websocket")

router = APIRouter(prefix="/ws", tags=["WebSocket"])


NODEJS_BACKEND_URL = "http://localhost:8346"

sio = socketio.AsyncClient(logger=False, engineio_logger=False)


async def forward_event_to_clients(event: str, data: dict):
    payload = data.get("data", {})
    project_id = payload.get("projectId") or payload.get("project_id")
    if project_id:
        message = {
            "event": event,
            "data": payload
        }
        _ = asyncio.create_task(
            ws_manager.broadcast_to_project(
                str(project_id),
                event,
                payload
            )
        )
        logger.info(f"Forwarded event {event} to project {project_id} clients.")
    else:
        logger.warning(f"Event {event} missing projectId; cannot forward.")


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



async def start_socketio_client():
    try:
        if not sio.connected:
            await sio.connect(NODEJS_BACKEND_URL, transports=['websocket', 'polling'])
            logger.info(f"Connected to Node.js backend at {NODEJS_BACKEND_URL}")
    except Exception as e:
        logger.error(f"Failed to connect to Node.js backend: {e}")



async def stop_socketio_client():
    if sio.connected:
        await sio.disconnect()
        logger.info("Disconnected from Node.js backend")


@router.websocket("/projects/{project_id}")
async def project_websocket_endpoint(
    websocket: WebSocket,
    project_id: str,
):
    
    await ws_manager.connect(websocket, project_id)
    try:
        await websocket.send_json(
            {
                "event": "client:join_project_room",
                "data": {"project_id": project_id}
            }
        )
        logger.info(f"Client joined project room: {project_id}")

        if sio.connected:
            await sio.emit('join_project', project_id)

        while True:
            data = await websocket.receive_text()
            logger.info(f"Received from client in project {project_id}: {data}")
    
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, project_id)
        logger.info(f"Client disconnected from project room: {project_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket for project {project_id}: {e}")
        ws_manager.disconnect(websocket, project_id)


async def count_active_connections():
    return len(ws_manager.active_connections)

async def count_total_users():
    unique_users = set()
    for connections in ws_manager.active_connections.values():
        unique_users.update(connections)
    return len(unique_users)

async def count_total_rooms():
    return len(ws_manager.active_connections)

