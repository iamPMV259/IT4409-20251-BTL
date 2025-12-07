from typing import Any

from configs import get_logger
from websockket.connection_manager import manager

logger = get_logger(__name__)


async def broadcast_project_update(
    project_id: str,
    update_type: str,
    data: dict[str, Any],
    exclude_user_id: str | None = None
) -> int:
    
    message = {
        "type": update_type,
        "data": data
    }
    
    if exclude_user_id:
        exclude_connections = manager.user_connections.get(exclude_user_id, set())
        
        sent_count = 0
        for connection in manager.project_rooms.get(str(project_id), set()).copy():
            if connection not in exclude_connections:
                success = await manager.send_personal_message(connection, message)
                if success:
                    sent_count += 1
        return sent_count
    else:
        return await manager.broadcast_to_room(str(project_id), message)


async def notify_user(user_id: str, notification_type: str, data: dict[str, Any]) -> int:
    
    message = {
        "type": notification_type,
        "data": data
    }
    
    return await manager.broadcast_to_user(user_id, message)


def get_online_users_in_project(project_id: str) -> list[str]:
    
    return list(manager.get_room_users(str(project_id)))


def is_user_online(user_id: str) -> bool:
    
    return user_id in manager.user_connections and len(manager.user_connections[user_id]) > 0


def get_user_connection_count(user_id: str) -> int:
    
    return len(manager.user_connections.get(user_id, set()))