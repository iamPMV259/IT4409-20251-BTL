import asyncio
import json
from typing import Dict, List

from fastapi import WebSocket

from configs import get_logger

logger = get_logger("websocket-manager")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: str):
        """
        Chấp nhận kết nối và đưa Client vào Room (Project) tương ứng.
        """
        await websocket.accept()
        
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        
        self.active_connections[project_id].append(websocket)
        logger.info(f"🔌 Client connected to Project: {project_id}. Total: {len(self.active_connections[project_id])}")

    def disconnect(self, websocket: WebSocket, project_id: str):
        """
        Xóa kết nối khi Client rời đi hoặc mất mạng.
        """
        if project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)
                logger.info(f"❌ Client disconnected from Project: {project_id}")
            
            # Dọn dẹp key nếu room trống để tiết kiệm RAM
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]

    async def broadcast_to_project(self, project_id: str, event_type: str, data: dict):
        """
        Hàm quan trọng nhất: Gửi data cho TẤT CẢ client đang xem Project đó.
        Dùng hàm này để gọi từ các API khác (Create Column, Move Task, etc.)
        """
        if project_id not in self.active_connections:
            return # Không có ai đang xem project này thì không cần gửi

        payload = {
            "event": event_type,
            "data": data
        }
        
        # Chuyển payload thành JSON string
        message_json = json.dumps(payload, default=str) # default=str để xử lý UUID/Datetime

        # Gửi bất đồng bộ cho tất cả user trong room
        to_remove = []
        for connection in self.active_connections[project_id]:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.warning(f"⚠️ Error sending to client: {e}")
                to_remove.append(connection)
        
        # Cleanup các kết nối chết (nếu có)
        for dead_conn in to_remove:
            self.disconnect(dead_conn, project_id)

# Tạo một instance global để dùng chung cho cả App
ws_manager = ConnectionManager()