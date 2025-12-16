from datetime import datetime
from typing import Any, List, Optional, Union

import aiohttp
from pydantic import BaseModel, field_validator

from configs import get_logger, nodejs_backend_config
from hooks.http_errors import (
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    NotFoundError,
    PermissionDeniedError,
)
from utils import base64_to_uuid

logger = get_logger("nodejs-backend-projects")


def _is_uuid(value: str) -> bool:
    import re
    uuid_pattern = re.compile(
        r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
        re.IGNORECASE,
    )
    return bool(uuid_pattern.match(value))


# --- COMMON MODELS ---

class TaskStats(BaseModel):
    open: int
    closed: int

class UserInfo(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None

    @field_validator("id", mode="before")
    @classmethod
    def convert_id(cls, v):
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "_id" in data:
            data["id"] = data.pop("_id")
        if "avatarUrl" in data:
            data["avatar_url"] = data.pop("avatarUrl")
        super().__init__(**data)

class OwnerInfo(BaseModel):
    id: str
    name: str
    avatar_url: Optional[str] = None

    @field_validator("id", mode="before")
    @classmethod
    def convert_id(cls, v):
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "_id" in data:
            data["id"] = data.pop("_id")
        if "avatarUrl" in data:
            data["avatar_url"] = data.pop("avatarUrl")
        super().__init__(**data)


# --- GET SINGLE PROJECT MODELS (FULLY POPULATED) ---

class ProjectMemberDetailed(BaseModel):
    user: UserInfo
    role: str

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "userId" in data:
            data["user"] = data.pop("userId")
        super().__init__(**data)


class ProjectDetailData(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    workspace_id: str
    owner: UserInfo
    members: List[ProjectMemberDetailed]
    status: str
    column_order: List[str]
    task_stats: TaskStats
    created_at: datetime
    updated_at: datetime

    @field_validator("id", "workspace_id", mode="before")
    @classmethod
    def convert_ids(cls, v):
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "_id" in data:
            data["id"] = data.pop("_id")
        if "workspaceId" in data:
            data["workspace_id"] = data.pop("workspaceId")
        if "ownerId" in data:
            data["owner"] = data.pop("ownerId")
        if "columnOrder" in data:
            data["column_order"] = data.pop("columnOrder")
        if "taskStats" in data:
            data["task_stats"] = data.pop("taskStats")
        if "createdAt" in data:
            data["created_at"] = data.pop("createdAt")
        if "updatedAt" in data:
            data["updated_at"] = data.pop("updatedAt")
        data.pop("__v", None)
        super().__init__(**data)


class ProjectDetailResponse(BaseModel): 
    success: bool
    data: ProjectDetailData


async def get_project(project_id: str, token: str) -> ProjectDetailResponse:
    url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/projects/{project_id}"
    headers = {
        "accept": "*/*",
        "Authorization": f"Bearer {token}",
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                logger.info(f"Project {project_id} retrieved successfully.")
                return ProjectDetailResponse.model_validate(data)
            elif response.status == 401:
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                raise NotFoundError(f"Project with ID {project_id} not found.")
            elif response.status == 403:
                raise PermissionDeniedError(f"Permission denied for project ID {project_id}.")
            elif response.status == 400:
                error_message = await response.text()
                raise BadRequestError(f"Retrieval failed: {error_message}")
            else:
                error_message = await response.text()
                raise InternalServerError(f"Retrieval failed: {error_message}")


# --- UPDATE PROJECT MODELS (PARTIALLY POPULATED) ---
# FIX: API Update của Node.js KHÔNG populate members, chỉ populate owner.
# Do đó cần model riêng chấp nhận members là { userId: "string", role: "string" }

class ProjectMemberSimple(BaseModel):
    user_id: str
    role: str

    @field_validator("user_id", mode="before")
    @classmethod
    def convert_user_id(cls, v):
        # Nếu lỡ Node populate object thì lấy ID, nếu là string thì giữ nguyên
        if isinstance(v, dict):
            return v.get("_id") or v.get("id")
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "userId" in data:
            data["user_id"] = data.pop("userId")
        super().__init__(**data)

class ProjectUpdateData(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    workspace_id: str
    owner: UserInfo # Node Update API CÓ populate owner
    members: List[ProjectMemberSimple] # Node Update API KHÔNG populate members (trả về userId string)
    status: str
    column_order: List[str]
    task_stats: TaskStats
    created_at: datetime
    updated_at: datetime

    @field_validator("id", "workspace_id", mode="before")
    @classmethod
    def convert_ids(cls, v):
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "_id" in data:
            data["id"] = data.pop("_id")
        if "workspaceId" in data:
            data["workspace_id"] = data.pop("workspaceId")
        if "ownerId" in data:
            data["owner"] = data.pop("ownerId")
        if "columnOrder" in data:
            data["column_order"] = data.pop("columnOrder")
        if "taskStats" in data:
            data["task_stats"] = data.pop("taskStats")
        if "createdAt" in data:
            data["created_at"] = data.pop("createdAt")
        if "updatedAt" in data:
            data["updated_at"] = data.pop("updatedAt")
        data.pop("__v", None)
        super().__init__(**data)

class ProjectUpdateResponse(BaseModel):
    success: bool
    data: ProjectUpdateData


class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None


async def update_project(project_id: str, update_data: ProjectUpdateRequest, token: str) -> ProjectUpdateResponse:
    url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/projects/{project_id}"
    headers = {
        "accept": "*/*",
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = update_data.model_dump(exclude_unset=True)
    async with aiohttp.ClientSession() as session:
        async with session.patch(url, json=payload, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                logger.info(f"Project {project_id} updated successfully.")
                # Sử dụng ProjectUpdateResponse thay vì ProjectDetailResponse
                return ProjectUpdateResponse.model_validate(data)
            elif response.status == 401:
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                raise NotFoundError(f"Project {project_id} not found.")
            elif response.status == 400:
                error_message = await response.text()
                raise BadRequestError(f"Update failed: {error_message}")
            elif response.status == 403:
                raise PermissionDeniedError(f"Permission denied.")
            else:
                error_message = await response.text()
                raise InternalServerError(f"Update failed: {error_message}")


# --- DELETE PROJECT ---

class ProjectDeleteResponse(BaseModel):
    success: bool
    message: str


async def delete_project(project_id: str, token: str) -> ProjectDeleteResponse:
    url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/projects/{project_id}"
    headers = {
        "accept": "*/*",
        "Authorization": f"Bearer {token}",
    }

    async with aiohttp.ClientSession() as session:
        async with session.delete(url, headers=headers) as response:
            if response.status in [204, 200]:
                logger.info(f"Project {project_id} deleted successfully.")
                try:
                    data = await response.json()
                except:
                    data = {"success": True, "message": "Project deleted"}
                return ProjectDeleteResponse.model_validate(data)
            elif response.status == 401:
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                raise NotFoundError(f"Project {project_id} not found.")
            elif response.status == 403:
                raise PermissionDeniedError(f"Permission denied.")
            else:
                error_message = await response.text()
                raise InternalServerError(f"Deletion failed: {error_message}")


# --- GET BOARD ---

class BoardProjectMember(BaseModel):
    user_id: str
    role: str

    @field_validator("user_id", mode="before")
    @classmethod
    def convert_user_id(cls, v):
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "userId" in data:
            data["user_id"] = data.pop("userId")
        super().__init__(**data)


class BoardProject(BaseModel):
    id: str
    name: str
    owner_id: str
    members: List[BoardProjectMember]
    column_order: List[str]

    @field_validator("id", "owner_id", mode="before")
    @classmethod
    def convert_ids(cls, v):
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "_id" in data:
            data["id"] = data.pop("_id")
        if "ownerId" in data:
            data["owner_id"] = data.pop("ownerId")
        if "columnOrder" in data:
            data["column_order"] = data.pop("columnOrder")
        super().__init__(**data)


class BoardColumn(BaseModel):
    id: str
    title: str
    project_id: str
    tasks: List[Any] 
    created_at: datetime
    updated_at: datetime

    @field_validator("id", "project_id", mode="before")
    @classmethod
    def convert_ids(cls, v):
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "_id" in data:
            data["id"] = data.pop("_id")
        if "projectId" in data:
            data["project_id"] = data.pop("projectId")
        if "createdAt" in data:
            data["created_at"] = data.pop("createdAt")
        if "updatedAt" in data:
            data["updated_at"] = data.pop("updatedAt")
        data.pop("__v", None)
        super().__init__(**data)


class BoardData(BaseModel):
    project: BoardProject
    columns: List[BoardColumn]


class ProjectBoardResponse(BaseModel):
    success: bool
    data: BoardData


async def get_project_board(project_id: str, token: str) -> ProjectBoardResponse:
    url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/projects/{project_id}/board"
    headers = {
        "accept": "*/*",
        "Authorization": f"Bearer {token}",
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                return ProjectBoardResponse.model_validate(data)
            elif response.status == 401:
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                raise NotFoundError(f"Project with ID {project_id} not found.")
            elif response.status == 403:
                raise PermissionDeniedError(f"Permission denied.")
            else:
                error_message = await response.text()
                raise InternalServerError(f"Retrieval failed: {error_message}")


# --- ADD MEMBER ---

class ProjectAddMemberData(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    workspace_id: str
    owner_id: str  
    members: List[ProjectMemberDetailed] 
    status: str
    column_order: List[str]
    task_stats: TaskStats
    created_at: datetime
    updated_at: datetime

    @field_validator("id", "workspace_id", "owner_id", mode="before")
    @classmethod
    def convert_ids(cls, v):
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "_id" in data:
            data["id"] = data.pop("_id")
        if "workspaceId" in data:
            data["workspace_id"] = data.pop("workspaceId")
        if "ownerId" in data:
            data["owner_id"] = data.pop("ownerId")
        if "columnOrder" in data:
            data["column_order"] = data.pop("columnOrder")
        if "taskStats" in data:
            data["task_stats"] = data.pop("taskStats")
        if "createdAt" in data:
            data["created_at"] = data.pop("createdAt")
        if "updatedAt" in data:
            data["updated_at"] = data.pop("updatedAt")
        data.pop("__v", None)
        super().__init__(**data)


class NewlyAddedUser(BaseModel):
    id: str
    name: str
    email: str

    @field_validator("id", mode="before")
    @classmethod
    def convert_id(cls, v):
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True
    
    def __init__(self, **data):
        if "_id" in data:
            data["id"] = data.pop("_id")
        super().__init__(**data)


class ProjectAddMemberResponse(BaseModel):
    success: bool
    message: str
    data: ProjectAddMemberData
    newly_added_users: List[NewlyAddedUser]

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "newlyAddedUsers" in data:
            data["newly_added_users"] = data.pop("newlyAddedUsers")
        super().__init__(**data)


async def add_project_member(project_id: str, member_email: List[str], token: str) -> ProjectAddMemberResponse:
    url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/projects/{project_id}/members"
    headers = {
        "accept": "*/*",
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {"newMemberEmails": member_email}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                return ProjectAddMemberResponse.model_validate(data)
            elif response.status == 401:
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                raise NotFoundError(f"Project not found or emails not found.")
            elif response.status == 403:
                raise PermissionDeniedError(f"Permission denied.")
            elif response.status == 400:
                error_message = await response.text()
                raise BadRequestError(f"Addition failed: {error_message}")
            else:
                error_message = await response.text()
                raise InternalServerError(f"Addition failed: {error_message}")


# --- CREATE COLUMN ---

class ColumnData(BaseModel):
    id: str
    title: str
    project_id: str
    task_order: List[str]
    created_at: datetime
    updated_at: datetime

    @field_validator("id", "project_id", mode="before")
    @classmethod
    def convert_ids(cls, v):
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "_id" in data:
            data["id"] = data.pop("_id")
        if "projectId" in data:
            data["project_id"] = data.pop("projectId")
        if "taskOrder" in data:
            data["task_order"] = data.pop("taskOrder")
        if "createdAt" in data:
            data["created_at"] = data.pop("createdAt")
        if "updatedAt" in data:
            data["updated_at"] = data.pop("updatedAt")
        data.pop("__v", None)
        super().__init__(**data)


class ProjectColumnCreatedResponse(BaseModel):
    success: bool
    message: str
    data: ColumnData 


async def create_project_columns(project_id: str, column_title: str, token: str) -> ProjectColumnCreatedResponse:
    url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/projects/{project_id}/columns"
    headers = {
        "accept": "*/*",
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {"title": column_title}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as response:
            if response.status == 201:
                data = await response.json()
                logger.info(f"Column created in project {project_id} successfully.")
                return ProjectColumnCreatedResponse.model_validate(data)
            elif response.status == 401:
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                raise NotFoundError(f"Project {project_id} not found.")
            elif response.status == 403:
                raise PermissionDeniedError(f"Permission denied.")
            elif response.status == 400:
                error_message = await response.text()
                raise BadRequestError(f"Creation failed: {error_message}")
            else:
                error_message = await response.text()
                raise InternalServerError(f"Creation failed: {error_message}")


# --- GET PROJECTS LIST ---

class ProjectMember(BaseModel):
    user_id: str
    role: str
    
    @field_validator("user_id", mode="before")
    @classmethod
    def convert_user_id(cls, v):
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True
    
    def __init__(self, **data):
        if "userId" in data:
            data["user_id"] = data.pop("userId")
        super().__init__(**data)


class ProjectGetData(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    workspace_id: str
    owner: OwnerInfo 
    members: List[ProjectMember] 
    status: str
    task_stats: TaskStats
    created_at: datetime
    deadline: Optional[datetime] = None
    updated_at: datetime

    @field_validator("id", "workspace_id", mode="before")
    @classmethod
    def convert_ids(cls, v):
        if v and not _is_uuid(v):
            return base64_to_uuid(v)
        return v

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "_id" in data:
            data["id"] = data.pop("_id")
        if "workspaceId" in data:
            data["workspace_id"] = data.pop("workspaceId")
        if "ownerId" in data:
            data["owner"] = data.pop("ownerId")
        if "taskStats" in data:
            data["task_stats"] = data.pop("taskStats")
        if "createdAt" in data:
            data["created_at"] = data.pop("createdAt")
        if "updatedAt" in data:
            data["updated_at"] = data.pop("updatedAt")
        data.pop("__v", None)
        super().__init__(**data)


class ProjectListResponse(BaseModel):
    success: bool
    count: int
    data: List[ProjectGetData]


async def get_projects(workspace_id: str, token: str) -> ProjectListResponse:
    url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/workspaces/{workspace_id}/projects"
    headers = {
        "accept": "*/*",
        "Authorization": f"Bearer {token}",
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                return ProjectListResponse.model_validate(data)
            elif response.status == 401:
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                raise NotFoundError(f"Workspace {workspace_id} not found.")
            else:
                error_message = await response.text()
                raise InternalServerError(f"Retrieval failed: {error_message}")