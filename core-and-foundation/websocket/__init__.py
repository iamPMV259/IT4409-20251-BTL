"""
WebSocket module initializer.

This file exposes the global WebSocketManager instance (ws_manager)
so other modules can import it directly:

    from websocket import ws_manager
"""

from .manager import WebSocketManager

# Global WebSocket Manager instance
ws_manager = WebSocketManager()

__all__ = ["ws_manager", "WebSocketManager"]

