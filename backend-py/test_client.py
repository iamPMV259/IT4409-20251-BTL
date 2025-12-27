import asyncio
import json

import socketio

SERVER_URL = 'http://131.153.239.187:8346'
PROJECT_ID = "e6c36618-2e67-4429-9ade-1c3879f0f42d"

sio = socketio.AsyncClient(logger=False, engineio_logger=False)

@sio.event
async def connect():
    print(f"[CONNECTED] Đã kết nối tới {SERVER_URL}")
    print(f"[ACTION] Đang gửi yêu cầu join_project vào room: {PROJECT_ID}...")
    await sio.emit('join_project', PROJECT_ID)

@sio.event
async def disconnect():
    print("[DISCONNECTED] Mất kết nối tới server.")


@sio.on('server:project_updated')
async def on_project_updated(data):
    print("\n[EVENT] server:project_updated")
    print(json.dumps(data, indent=2, ensure_ascii=False))

@sio.on('server:column_created')
async def on_column_created(data):
    print("\n[EVENT] server:column_created")
    print(json.dumps(data, indent=2, ensure_ascii=False))

@sio.on('server:column_updated')
async def on_column_updated(data):
    print("\n[EVENT] server:column_updated")
    print(json.dumps(data, indent=2, ensure_ascii=False))

@sio.on('server:column_deleted')
async def on_column_deleted(data):
    print("\n[EVENT] server:column_deleted")
    print(json.dumps(data, indent=2, ensure_ascii=False))

async def main():
    try:
        print(f"Đang thử kết nối tới {SERVER_URL}...")
        await sio.connect(SERVER_URL, transports=['websocket', 'polling'])
        
        await sio.wait()
    except Exception as e:
        print(f"Lỗi kết nối: {e}")
        print("Gợi ý: Kiểm tra xem server Node.js đã npm start chưa?")

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nĐã dừng client test.")