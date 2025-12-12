from datetime import datetime
from typing import Any, Optional

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
            elif response.status == 403:
                logger.error(f"Permission denied to update project {project_id}.")
                raise PermissionDeniedError(f"Permission denied for project ID {project_id}.")
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




# Board Response Models

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
    members: list[BoardProjectMember]
    column_order: list[str]

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
    tasks: list[Any]
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
    columns: list[BoardColumn]


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
                logger.info(f"Project board for {project_id} retrieved successfully.")
                return ProjectBoardResponse.model_validate(data)
            elif response.status == 401:
                logger.error("Authentication failed while retrieving project board.")
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                logger.error(f"Project {project_id} not found.")
                raise NotFoundError(f"Project with ID {project_id} not found.")
            elif response.status == 403:
                logger.error(f"Permission denied to access project board {project_id}.")
                raise PermissionDeniedError(f"Permission denied for project ID {project_id}.")
            elif response.status == 400:
                error_message = await response.text()
                logger.error(f"Failed to retrieve project board: {error_message}")
                raise BadRequestError(
                    f"Retrieval failed with status {response.status}: {error_message}"
                )
            else:
                error_message = await response.text()
                logger.error(f"Failed to retrieve project board: {error_message}")
                raise InternalServerError(
                    f"Retrieval failed with status {response.status}: {error_message}"
                )





   


class ProjectAddMemberData(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    workspace_id: str
    owner_id: str
    members: list[ProjectMemberDetailed]
    status: str
    column_order: list[str]
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


class ProjectAddMemberResponse(BaseModel):
    success: bool
    message: str
    data: ProjectAddMemberData
    newly_added_users: list[NewlyAddedUser]

    class Config:
        populate_by_name = True

    def __init__(self, **data):
        if "newlyAddedUsers" in data:
            data["newly_added_users"] = data.pop("newlyAddedUsers")
        super().__init__(**data)


async def add_project_member(project_id: str, member_email: list[str], token: str) -> ProjectAddMemberResponse:
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
                logger.info(f"Members added to project {project_id} successfully.")
                return ProjectAddMemberResponse.model_validate(data)
            elif response.status == 401:
                logger.error("Authentication failed while adding project members.")
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                logger.error(f"Project {project_id} not found.")
                raise NotFoundError(f"Project with ID {project_id} not found.")
            elif response.status == 400:
                error_message = await response.text()
                logger.error(f"Failed to add project members: {error_message}")
                raise BadRequestError(f"Addition failed with status {response.status}: {error_message}")
            elif response.status == 403:
                logger.error(f"Permission denied to add members to project {project_id}.")
                raise PermissionDeniedError(f"Permission denied for project ID {project_id}.")
            else:
                error_message = await response.text()
                logger.error(f"Failed to add project members: {error_message}")
                raise InternalServerError(f"Addition failed with status {response.status}: {error_message}")




class ColumnData(BaseModel):
    id: str
    title: str
    project_id: str
    task_order: list[str]
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


class ProjectColumnsCreatedResponse(BaseModel):
    success: bool
    message: str
    data: ColumnData


async def create_project_columns(project_id: str, column_title: str, token: str) -> list[ProjectColumnsCreatedResponse]:
    url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/projects/{project_id}/columns"
    headers = {
        "accept": "*/*",
        "Authorization": f"Bearer {token}",
    }
    params = {"title": column_title}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, params=params) as response:
            if response.status == 200:
                data = await response.json()
                logger.info(f"Column created in project {project_id} successfully.")
                return [ProjectColumnsCreatedResponse.model_validate(col) for col in data.get("data", [])]
            elif response.status == 401:
                logger.error("Authentication failed while creating project column.")
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                logger.error(f"Project {project_id} not found.")
                raise NotFoundError(f"Project with ID {project_id} not found.")
            elif response.status == 400:
                error_message = await response.text()
                logger.error(f"Failed to create project column: {error_message}")
                raise BadRequestError(f"Creation failed with status {response.status}: {error_message}")
            elif response.status == 403:
                logger.error(f"Permission denied to create column in project {project_id}.")
                raise PermissionDeniedError(f"Permission denied for project ID {project_id}.")
            else:
                error_message = await response.text()
                logger.error(f"Failed to create project column: {error_message}")
                raise InternalServerError(f"Creation failed with status {response.status}: {error_message}")