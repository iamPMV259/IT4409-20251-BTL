# Workspace API

## Cấu trúc

```
src/
├── config/
│   └── api.ts              # Cấu hình API endpoints
├── types/
│   └── workspace.ts        # TypeScript types
└── services/
    ├── index.ts            # Export services
    └── workspaceService.ts # Workspace API functions
```

## API Endpoints

### 1. GET /api/v1/workspaces
Lấy danh sách các workspace mà người dùng là thành viên.

**Sử dụng:**
```typescript
import { getWorkspaces } from '@/services';

const workspaces = await getWorkspaces();
```

### 2. POST /api/v1/workspaces
Tạo một workspace mới.

**Request body:**
```json
{
  "name": "Workspace Mới",
  "description": "Mô tả (optional)",
  "members": [...]
}
```

**Sử dụng:**
```typescript
import { createWorkspace } from '@/services';

const newWorkspace = await createWorkspace({
  name: "My Workspace",
  description: "Description here"
});
```

## Cấu hình

Tạo file `.env`:
```
VITE_API_BASE_URL=http://localhost:3000
```

## Types

Chi tiết các TypeScript types xem trong `src/types/workspace.ts`
