from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from websocket import ws_manager
from api.dependencies import get_current_user
from mongo.schemas import Workspaces
from hooks.http_errors import PermissionDeniedError

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/workspace/{workspace_id}")
async def workspace_websocket(websocket: WebSocket, workspace_id: str):
    """
    WebSocket with token authentication.

    Client must connect using:
    ws://host/ws/workspace/{id}?token=ACCESS_TOKEN
    """

    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return

    # Parse user
    try:
        user = await get_current_user(token)
    except:
        await websocket.close(code=4401)
        return

    # Check workspace access
    workspace = await Workspaces.get(workspace_id)
    if not workspace:
        await websocket.close(code=4404)
        return

    #check xem user có thuộc workspace hay ko
    from api.dependencies import check_workspace_access
    if not check_workspace_access(user, workspace):
        await websocket.close(code=4403)
        return

    # Connect user
    await ws_manager.connect(workspace_id, websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(workspace_id, websocket)
