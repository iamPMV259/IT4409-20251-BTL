Tasks API – Test Report

Date: December 7, 2025
Module: Task Management + Real-time Events
Status: ✅ All Task Endpoints Working Correctly

✅ 1. Create Task
POST /api/v1/columns/:columnId/tasks
Request
{
  "title": "Build Dashboard UI",
  "description": "Create Figma layout and React components",
  "assignees": ["443272eb-b050-46ce-88eb-c56bc2ddce11"],
  "labels": []
}

Response (201 Created)
{
  "id": "d6a0df08-d53f-4ea2-a2f6-95023aa7cc9e",
  "title": "Build Dashboard UI",
  "description": "Create Figma layout and React components",
  "projectId": "b1d79206-85c5-4199-ac46-e496e2fee1ad",
  "columnId": "888f79ad-b313-4410-a6a8-3a33d386a690",
  "assignees": ["443272eb-b050-46ce-88eb-c56bc2ddce11"],
  "labels": [],
  "createdAt": "2025-12-07T10:33:01.417Z",
  "updatedAt": "2025-12-07T10:33:01.417Z"
}

Realtime Event Fired
server:task_created


Status: ✅ Task created successfully.

✅ 2. Get Task Details
GET /api/v1/tasks/:taskId
Response (200 OK)
{
  "id": "d6a0df08-d53f-4ea2-a2f6-95023aa7cc9e",
  "title": "Build Dashboard UI",
  "description": "Create Figma layout",
  "projectId": "b1d79206-85c5-4199-ac46-e496e2fee1ad",
  "columnId": "888f79ad-b313-4410-a6a8-3a33d386a690",
  "assignees": ["443272eb-b050-46ce-88eb-c56bc2ddce11"],
  "labels": [],
  "checklists": [],
  "createdAt": "2025-12-07T10:33:01.417Z",
  "updatedAt": "2025-12-07T10:33:01.417Z"
}


Status: ✅ Working.

✅ 3. Update Task
PATCH /api/v1/tasks/:taskId
Request
{
  "title": "Dashboard UI v2",
  "description": "Updated description"
}

Response (200 OK)
{
  "id": "d6a0df08-d53f-4ea2-a2f6-95023aa7cc9e",
  "title": "Dashboard UI v2",
  "description": "Updated description",
  "columnId": "888f79ad-b313-4410-a6a8-3a33d386a690",
  "updatedAt": "2025-12-07T10:41:22.050Z"
}

Realtime Event Fired
server:task_updated


Status: ✅ Task updated correctly.

✅ 4. Move Task (Drag & Drop)
PATCH /api/v1/tasks/:taskId/move
Request
{
  "targetColumnId": "7d04a6d1-794c-444f-96b8-e2a1a99c2d16",
  "position": 0
}

Response (200 OK)
{
  "id": "d6a0df08-d53f-4ea2-a2f6-95023aa7cc9e",
  "columnId": "7d04a6d1-794c-444f-96b8-e2a1a99c2d16",
  "updatedAt": "2025-12-07T10:47:21.998Z"
}

Realtime Event Fired
{
  "event": "server:task_moved",
  "payload": {
    "taskId": "d6a0df08-d53f-4ea2-a2f6-95023aa7cc9e",
    "sourceColumnId": "888f79ad-b313-4410-a6a8-3a33d386a690",
    "destColumnId": "7d04a6d1-794c-444f-96b8-e2a1a99c2d16",
    "newPosition": 0
  }
}


Status: ✅ Drag-and-drop working.

✅ 5. Delete Task
DELETE /api/v1/tasks/:taskId
Response (204 No Content)
(no body)

Realtime Event Fired
{
  "event": "server:task_deleted",
  "payload": {
    "taskId": "d6a0df08-d53f-4ea2-a2f6-95023aa7cc9e",
    "columnId": "7d04a6d1-794c-444f-96b8-e2a1a99c2d16"
  }
}


Status: ✅ Task deleted and event broadcasted.

✅ 6. Add Comment
POST /api/v1/tasks/:taskId/comments
Request
{
  "content": "Looks great! Please refine mobile layout."
}

Response (201 Created)
{
  "id": "e24311ee-8545-4f28-92c8-fc36b2e88843",
  "taskId": "d6a0df08-d53f-4ea2-a2f6-95023aa7cc9e",
  "content": "Looks great! Please refine mobile layout.",
  "userId": "46c45aa3-9951-43fa-bd0a-bd864226ec6f",
  "createdAt": "2025-12-07T10:52:31.884Z"
}

Realtime Event Fired
server:comment_added


Status: ✅ Comment added and real-time pushed.

✅ 7. Checklist – Add Item
POST /api/v1/tasks/:taskId/checklist-items
Request
{
  "text": "Build responsive layout"
}

Response
{
  "text": "Build responsive layout",
  "checked": false
}


Status: ✅ Checklist item created.

🎯 Summary – Tasks API Overview
| Endpoint                 | Status | Realtime Event       |
| ------------------------ | ------ | -------------------- |
| POST /columns/:id/tasks  | ✅      | server:task_created  |
| GET /tasks/:id           | ✅      | —                    |
| PATCH /tasks/:id         | ✅      | server:task_updated  |
| PATCH /tasks/:id/move    | ✅      | server:task_moved    |
| DELETE /tasks/:id        | ✅      | server:task_deleted  |
| POST /tasks/:id/comments | ✅      | server:comment_added |
| Checklist APIs           | ✅      | server:task_updated  |

🚀 Overall Status: Tasks Module READY for Integration

