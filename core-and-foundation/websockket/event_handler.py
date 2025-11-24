import json
from typing import Any

from fastapi import WebSocket

from configs import get_logger
from websockket.connection_manager import manager

logger = get_logger(__name__)



class WebSocketEventHandler:


    def __init__(self):
        self.handlers = {
            "client:join_project_room": self.handle_join_project_room,
            "client:leave_project_room": self.handle_leave_project_room,
            "ping": self.handle_ping,
        }

    async def handle_message(self, websocket: WebSocket, message: str) -> None:
        
        try:
            data = json.loads(message)
            event_type = data.get("type")
            event_data = data.get("data", {})
            
            if not event_type:
                await self.send_error(websocket, "Missing event type")
                return
            
            
            handler = self.handlers.get(event_type)
            if handler:
                await handler(websocket, event_data)
            else:
                logger.warning(f"Unknown event type: {event_type}")
                await self.send_error(websocket, f"Unknown event type: {event_type}")
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON message: {e}")
            await self.send_error(websocket, "Invalid JSON format")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send_error(websocket, f"Internal error: {str(e)}")
    
    async def handle_join_project_room(self, websocket: WebSocket, data: dict[str, Any]) -> None:
       
        project_id = data.get("project_id")
        
        if not project_id:
            await self.send_error(websocket, "Missing project_id")
            return
        
        # TODO: Validate project_id exists in database
        # TODO: Check user has permission to access this project
        
        
        success = await manager.join_project_room(websocket, str(project_id))
        
        if success:
            _ = await manager.send_personal_message(
                websocket,
                {
                    "type": "room:joined",
                    "data": {
                        "project_id": project_id,
                        "room_size": manager.get_room_size(str(project_id)),
                        "room_users": list(manager.get_room_users(str(project_id)))
                    }
                }
            )
        else:
            await self.send_error(websocket, "Failed to join project room")
    
    async def handle_leave_project_room(self, websocket: WebSocket, data: dict[str, Any]) -> None:
        
        project_id = data.get("project_id")
        
        if not project_id:
            await self.send_error(websocket, "Missing project_id")
            return
        
        success = await manager.leave_project_room(websocket, str(project_id))
        
        if success:
            _ = await manager.send_personal_message(
                websocket,
                {
                    "type": "room:left",
                    "data": {
                        "project_id": project_id
                    }
                }
            )
        else:
            await self.send_error(websocket, "Failed to leave project room")
    
    async def handle_ping(self, websocket: WebSocket, data: dict[str, Any]) -> None:
        
        _ = await manager.send_personal_message(
            websocket,
            {
                "type": "pong",
                "data": {}
            }
        )
    
    async def send_error(self, websocket: WebSocket, error_message: str) -> None:
        
        _ = await manager.send_personal_message(
            websocket,
            {
                "type": "error",
                "data": {
                    "message": error_message
                }
            }
        )


event_handler = WebSocketEventHandler()