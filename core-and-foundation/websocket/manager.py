

from typing import Dict, List, Any
from fastapi import WebSocket


class WebSocketManager:
    """
    A simple manager to track clients in workspaces
    and broadcast events to them.
    """

    def __init__(self):
        # workspaceId -> list of WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, workspace_id: str, websocket: WebSocket):
        await websocket.accept()
        if workspace_id not in self.active_connections:
            self.active_connections[workspace_id] = []
        self.active_connections[workspace_id].append(websocket)

    def disconnect(self, workspace_id: str, websocket: WebSocket):
        if workspace_id in self.active_connections:
            if websocket in self.active_connections[workspace_id]:
                self.active_connections[workspace_id].remove(websocket)

    async def broadcast_to_workspace(self, workspace_id: str, event_name: str, data: Any):
        """
        Send message to all clients connected to the workspace.
        """
        if workspace_id not in self.active_connections:
            return

        message = {
            "event": event_name,
            "data": data
        }

        dead_connections = []

        for ws in self.active_connections[workspace_id]:
            try:
                await ws.send_json(message)
            except Exception:
                dead_connections.append(ws)

        # Remove dead connections
        for ws in dead_connections:
            self.disconnect(workspace_id, ws)


#  instance dùng để import trong API
ws_manager = WebSocketManager()
