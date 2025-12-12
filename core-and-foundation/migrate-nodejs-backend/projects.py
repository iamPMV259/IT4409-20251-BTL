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

logger = get_logger("nodejs-backend-projects")


def _is_uuid(value: str) -> bool:
    import re

    uuid_pattern = re.compile(
        r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
        re.IGNORECASE,
    )
    return bool(uuid_pattern.match(value))


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
    members: list[ProjectMemberDetailed]
    status: str
    column_order: list[str]
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


class ProjectGetResponse(BaseModel):
    success: bool
    data: ProjectDetailData


async def get_project(project_id: str, token: str) -> ProjectGetResponse:
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
                return ProjectGetResponse.model_validate(data)
            elif response.status == 401:
                logger.error("Authentication failed while retrieving project.")
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                logger.error(f"Project {project_id} not found.")
                raise NotFoundError(f"Project with ID {project_id} not found.")
            else:
                error_message = await response.text()
                logger.error(f"Failed to retrieve project: {error_message}")
                raise InternalServerError(
                    f"Retrieval failed with status {response.status}: {error_message}"
                )
