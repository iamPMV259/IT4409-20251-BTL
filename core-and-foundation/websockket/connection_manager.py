import json
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import WebSocket, WebSocketDisconnect

from configs import get_logger

logger = get_logger(__name__)




class ConnectionManager:
    def __init__(self):
        self.active_connections: set[WebSocket] = set()
        
        self.user_connections: dict[str, set[WebSocket]] = {}
        
        self.project_rooms: dict[str, set[WebSocket]] = {}
        
        self.connection_info: dict[WebSocket, dict[str, Any]] = {}
        
        logger.info("ConnectionManager initialized")
    
    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        
        await websocket.accept()
        
        self.active_connections.add(websocket)
        
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)
        
        self.connection_info[websocket] = {
            "user_id": user_id,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "projects": set() 
        }
        
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
    
    async def disconnect(self, websocket: WebSocket) -> None:
       
        if websocket not in self.active_connections:
            return
        
        info = self.connection_info.get(websocket, {})
        user_id = info.get("user_id", "unknown")
        projects = info.get("projects", set())
        
        for project_id in projects:
            await self._leave_project_room(websocket, project_id)
        
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        self.active_connections.discard(websocket)
        
        if websocket in self.connection_info:
            del self.connection_info[websocket]
        
        logger.info(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")
    
    async def join_project_room(self, websocket: WebSocket, project_id: str) -> bool:
        
        if websocket not in self.active_connections:
            logger.warning(f"Cannot join room: websocket not in active connections")
            return False
        
        if project_id not in self.project_rooms:
            self.project_rooms[project_id] = set()
        
        self.project_rooms[project_id].add(websocket)
        
        if websocket in self.connection_info:
            self.connection_info[websocket]["projects"].add(project_id)
        
        user_id = self.connection_info.get(websocket, {}).get("user_id", "unknown")
        room_size = len(self.project_rooms[project_id])
        
        logger.info(f"User {user_id} joined project room {project_id}. Room size: {room_size}")
        
        _ = await self.broadcast_to_room(
            project_id,
            {
                "type": "room:member_joined",
                "data": {
                    "project_id": project_id,
                    "user_id": user_id,
                    "room_size": room_size,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            },
            exclude=websocket  
        )
        
        return True
    
    async def _leave_project_room(self, websocket: WebSocket, project_id: str) -> bool:
        
        if project_id not in self.project_rooms:
            return False
        
        self.project_rooms[project_id].discard(websocket)
        
        if not self.project_rooms[project_id]:
            del self.project_rooms[project_id]
            logger.info(f"Project room {project_id} deleted (empty)")
        
        if websocket in self.connection_info:
            self.connection_info[websocket]["projects"].discard(project_id)
        
        user_id = self.connection_info.get(websocket, {}).get("user_id", "unknown")
        room_size = len(self.project_rooms.get(project_id, set()))
        
        logger.info(f"User {user_id} left project room {project_id}. Room size: {room_size}")
        
        if project_id in self.project_rooms:
            _ = await self.broadcast_to_room(
                project_id,
                {
                    "type": "room:member_left",
                    "data": {
                        "project_id": project_id,
                        "user_id": user_id,
                        "room_size": room_size,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return True
    
    async def leave_project_room(self, websocket: WebSocket, project_id: str) -> bool:
        
        return await self._leave_project_room(websocket, project_id)
    
    async def broadcast_to_room(
        self, 
        project_id: str, 
        message: dict[str, Any],
        exclude: WebSocket | None = None
    ) -> int:
        
        if project_id not in self.project_rooms:
            logger.warning(f"Cannot broadcast: room {project_id} does not exist")
            return 0
        
        message_json = json.dumps(message)
        sent_count = 0
        failed_connections = []
        
        for connection in self.project_rooms[project_id].copy():
            if exclude and connection == exclude:
                continue
            
            try:
                await connection.send_text(message_json)
                sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send to connection: {e}")
                failed_connections.append(connection)
        
        for connection in failed_connections:
            await self.disconnect(connection)
        
        logger.debug(f"Broadcast to room {project_id}: {sent_count} sent, {len(failed_connections)} failed")
        return sent_count
    
    async def send_personal_message(self, websocket: WebSocket, message: dict[str, Any]) -> bool:
        
        try:
            message_json = json.dumps(message)
            await websocket.send_text(message_json)
            return True
        except Exception as e:
            logger.error(f"Failed to send personal message: {e}")
            await self.disconnect(websocket)
            return False
    
    async def broadcast_to_user(self, user_id: str, message: dict[str, Any]) -> int:
        
        if user_id not in self.user_connections:
            return 0
        
        message_json = json.dumps(message)
        sent_count = 0
        
        for connection in self.user_connections[user_id].copy():
            try:
                await connection.send_text(message_json)
                sent_count += 1
            except Exception as e:
                logger.error(f"Failed to send to user {user_id}: {e}")
                await self.disconnect(connection)
        
        return sent_count
    
    def get_room_size(self, project_id: str) -> int:
        
        return len(self.project_rooms.get(project_id, set()))
    
    def get_room_users(self, project_id: str) -> set[str]:
        
        if project_id not in self.project_rooms:
            return set()
        
        users = set()
        for connection in self.project_rooms[project_id]:
            if connection in self.connection_info:
                user_id = self.connection_info[connection].get("user_id")
                if user_id:
                    users.add(user_id)
        
        return users
    
    def get_connection_count(self) -> int:
        
        return len(self.active_connections)
    
    def get_stats(self) -> dict[str, Any]:
        
        return {
            "total_connections": len(self.active_connections),
            "total_users": len(self.user_connections),
            "total_rooms": len(self.project_rooms),
            "rooms": {
                project_id: {
                    "connections": len(connections),
                    "users": len(self.get_room_users(project_id))
                }
                for project_id, connections in self.project_rooms.items()
            }
        }


manager = ConnectionManager()