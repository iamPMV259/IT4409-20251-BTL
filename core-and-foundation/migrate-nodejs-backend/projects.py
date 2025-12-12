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
    deadline: Optional[datetime] = None
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
            elif response.status == 403:
                logger.error(f"Permission denied to access project {project_id}.")
                raise PermissionDeniedError(f"Permission denied for project ID {project_id}.")
            elif response.status == 400:
                error_message = await response.text()
                logger.error(f"Failed to retrieve project: {error_message}")
                raise BadRequestError(
                    f"Retrieval failed with status {response.status}: {error_message}"
                )
            else:
                error_message = await response.text()
                logger.error(f"Failed to retrieve project: {error_message}")
                raise InternalServerError(
                    f"Retrieval failed with status {response.status}: {error_message}"
                )



class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None  # 'active', 'on-hold', 'completed'


async def update_project(project_id: str, update_data: ProjectUpdateRequest, token: str):
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
                return ProjectGetResponse.model_validate(data)
            elif response.status == 401:
                logger.error("Authentication failed while updating project.")
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                logger.error(f"Project {project_id} not found.")
                raise NotFoundError(f"Project with ID {project_id} not found.")
            elif response.status == 400:
                error_message = await response.text()
                logger.error(f"Failed to update project: {error_message}")
                raise BadRequestError(f"Update failed with status {response.status}: {error_message}")
            else:
                error_message = await response.text()
                logger.error(f"Failed to update project: {error_message}")
                raise InternalServerError(f"Update failed with status {response.status}: {error_message}")



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
                data = await response.json()
                return ProjectDeleteResponse.model_validate(data)
            elif response.status == 401:
                logger.error("Authentication failed while deleting project.")
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                logger.error(f"Project {project_id} not found.")
                raise NotFoundError(f"Project with ID {project_id} not found.")
            elif response.status == 403:
                logger.error(f"Permission denied to delete project {project_id}.")
                raise PermissionDeniedError(f"Permission denied for project ID {project_id}.")
            elif response.status == 400:
                error_message = await response.text()
                logger.error(f"Failed to delete project: {error_message}")
                raise BadRequestError(
                    f"Deletion failed with status {response.status}: {error_message}"
                )
            else:
                error_message = await response.text()
                logger.error(f"Failed to delete project: {error_message}")
                raise InternalServerError(
                    f"Deletion failed with status {response.status}: {error_message}"
                )