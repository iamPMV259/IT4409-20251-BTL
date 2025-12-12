from datetime import datetime
from typing import Optional

import aiohttp
from pydantic import BaseModel, field_validator

from configs import get_logger, nodejs_backend_config
from hooks.http_errors import (
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    NotFoundError,
)
from utils import base64_to_uuid

logger = get_logger("nodejs-backend-workspaces")


class ProjectMember(BaseModel):
    user_id: str
    role: str

    @field_validator("user_id", mode="before")
    @classmethod
    def convert_user_id(cls, v):
        if v and not cls._is_uuid(v):
            return base64_to_uuid(v)
        return v

    @staticmethod
    def _is_uuid(value: str) -> bool:
        import re
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        return bool(uuid_pattern.match(value))

    class Config:
        populate_by_name = True
        
    def __init__(self, **data):
        if "userId" in data:
            data["user_id"] = data.pop("userId")
        super().__init__(**data)


class TaskStats(BaseModel):
    open: int
    closed: int


class ProjectData(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    workspace_id: str
    owner_id: str
    members: list[ProjectMember]
    status: str
    column_order: list[str]
    task_stats: TaskStats
    created_at: datetime
    updated_at: datetime

    @field_validator("id", "workspace_id", "owner_id", mode="before")
    @classmethod
    def convert_ids(cls, v):
        if v and not cls._is_uuid(v):
            return base64_to_uuid(v)
        return v

    @staticmethod
    def _is_uuid(value: str) -> bool:
        import re
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        return bool(uuid_pattern.match(value))

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


class InitialColumn(BaseModel):
    id: str
    title: str
    project_id: str
    task_order: list[str]
    created_at: datetime
    updated_at: datetime

    @field_validator("id", "project_id", mode="before")
    @classmethod
    def convert_ids(cls, v):
        if v and not cls._is_uuid(v):
            return base64_to_uuid(v)
        return v

    @staticmethod
    def _is_uuid(value: str) -> bool:
        import re
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        return bool(uuid_pattern.match(value))

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


class ProjectCreatedResponse(BaseModel):
    success: bool
    message: str
    data: ProjectData
    initial_columns: list[InitialColumn]

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "initalColumns" in data:
            data["initial_columns"] = data.pop("initalColumns")
        super().__init__(**data)


class OwnerInfo(BaseModel):
    id: str
    name: str
    avatar_url: Optional[str] = None

    @field_validator("id", mode="before")
    @classmethod
    def convert_id(cls, v):
        if v and not cls._is_uuid(v):
            return base64_to_uuid(v)
        return v

    @staticmethod
    def _is_uuid(value: str) -> bool:
        import re
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        return bool(uuid_pattern.match(value))

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "_id" in data:
            data["id"] = data.pop("_id")
        if "avatarUrl" in data:
            data["avatar_url"] = data.pop("avatarUrl")
        super().__init__(**data)


class ProjectGetData(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    workspace_id: str
    owner: OwnerInfo
    members: list[ProjectMember]
    status: str
    task_stats: TaskStats
    created_at: datetime
    deadline: Optional[datetime] = None
    updated_at: datetime

    @field_validator("id", "workspace_id", mode="before")
    @classmethod
    def convert_ids(cls, v):
        if v and not cls._is_uuid(v):
            return base64_to_uuid(v)
        return v

    @staticmethod
    def _is_uuid(value: str) -> bool:
        import re
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        return bool(uuid_pattern.match(value))

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


class ProjectGetResponse(BaseModel):
    success: bool
    count: int
    data: list[ProjectGetData]


class ProjectCreateRequest(BaseModel):
    name: str
    description: str
    deadline: Optional[datetime] = None


async def create_project(workspace_id: str, project_data: ProjectCreateRequest, token: str) -> ProjectCreatedResponse:
    url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/workspaces/{workspace_id}/projects"
    headers = {
        "accept": "*/*",
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = project_data.model_dump()

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers) as response:
            if response.status == 201:
                data = await response.json()
                logger.info(f"Project created successfully in workspace {workspace_id}.")
                return ProjectCreatedResponse.model_validate(data)
            elif response.status == 401:
                logger.error("Authentication failed while creating project.")
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                logger.error(f"Workspace {workspace_id} not found.")
                raise NotFoundError(f"Workspace with ID {workspace_id} not found.")
            elif response.status == 400:
                error_message = await response.text()
                logger.error(f"Failed to create project: {error_message}")
                raise BadRequestError(f"Creation failed with status {response.status}: {error_message}")
            else:
                error_message = await response.text()
                logger.error(f"Failed to create project: {error_message}")
                raise InternalServerError(f"Creation failed with status {response.status}: {error_message}")



class ProjectGetResponse(BaseModel):
    success: bool
    count: int
    data: list[ProjectGetData]



async def get_projects(workspace_id: str, token: str) -> ProjectGetResponse:
    url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/workspaces/{workspace_id}/projects"
    headers = {
        "accept": "*/*",
        "Authorization": f"Bearer {token}",
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                logger.info(f"Projects retrieved successfully from workspace {workspace_id}.")
                return ProjectGetResponse.model_validate(data)
            elif response.status == 401:
                logger.error("Authentication failed while retrieving projects.")
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                logger.error(f"Workspace {workspace_id} not found.")
                raise NotFoundError(f"Workspace with ID {workspace_id} not found.")
            else:
                error_message = await response.text()
                logger.error(f"Failed to retrieve projects: {error_message}")
                raise InternalServerError(f"Retrieval failed with status {response.status}: {error_message}")


