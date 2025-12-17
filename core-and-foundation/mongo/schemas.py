import time
from datetime import datetime, timezone
from uuid import UUID, uuid4

from beanie import Document, Indexed
from pydantic import BaseModel, EmailStr, Field


class Users(Document):
    id: UUID = Field(default_factory=uuid4, alias="_id")
    name: str
    email: Indexed(EmailStr, unique=True)
    passwordHash: str
    avatarUrl: str | None = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        validate_on_save = True


class WorkspaceMember(BaseModel):
    """Member information for workspace"""
    userId: UUID
    role: str = Field(default="member")  # 'owner', 'admin', 'member'

class Workspaces(Document):
    id: UUID = Field(default_factory=uuid4, alias="_id")
    name: str
    ownerId: UUID
    members: list[WorkspaceMember] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "workspaces"
        validate_on_save = True


class ProjectMember(BaseModel):
    """Member information for project"""
    userId: UUID
    role: str = Field(default="member")  # 'owner', 'admin', 'member'

class Projects(Document):
    id: UUID = Field(default_factory=uuid4, alias="_id")
    name: str
    description: str | None = None
    workspaceId: UUID
    ownerId: UUID
    members: list[ProjectMember] = Field(default_factory=list)
    status: str = Field(default="active")  # 'active', 'on-hold', 'completed'
    deadline: datetime | None = None
    columnOrder: list[UUID] = Field(default_factory=list)  # Order of columns by their IDs
    taskStats: dict[str, int] = Field(
        default_factory=lambda: {"open": 0, "closed": 0}
    )
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "projects"
        validate_on_save = True
        indexes = [
            "workspaceId",
        ]


class Columns(Document):
    id: UUID = Field(default_factory=uuid4, alias="_id")
    title: str
    projectId: UUID
    taskOrder: list[UUID] = Field(default_factory=list)  # Order of tasks by their IDs
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "columns"
        validate_on_save = True
        indexes = [
            "projectId",
        ]

class ChecklistItem(BaseModel):
    """Individual checklist item within a task"""
    text: str
    checked: bool = Field(default=False)

class Tasks(Document):
    id: UUID = Field(default_factory=uuid4, alias="_id")
    title: str
    description: str | None = None
    projectId: UUID
    columnId: UUID
    creatorId: UUID
    assignees: list[UUID] = Field(default_factory=list)
    dueDate: datetime | None = None
    labels: list[UUID] = Field(default_factory=list)
    checklists: list[ChecklistItem] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "tasks"
        validate_on_save = True
        indexes = [
            "projectId",
            "columnId",
            "dueDate",
            "assignees",
        ]

class Labels(Document):
    id: UUID = Field(default_factory=uuid4, alias="_id")
    projectId: UUID
    text: str
    color: str | None = Field(None, description="Label color (hex code)")

    class Settings:
        name = "labels"
        validate_on_save = True
        indexes = [
            "projectId",
        ]


class Comments(Document):
    id: UUID = Field(default_factory=uuid4, alias="_id")
    taskId: UUID
    userId: UUID
    content: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "comments"
        validate_on_save = True
        indexes = [
            "taskId",
        ]

class Activities(Document):
    id: UUID = Field(default_factory=uuid4, alias="_id")
    projectId: UUID
    taskId: UUID
    userId: UUID
    action: str  # e.g. "created task", "updated task", "added comment"
    details: dict[str, str] = Field(default_factory=dict)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "activities"
        validate_on_save = True
        indexes = [
            "projectId",
            "taskId",
            "createdAt",
        ]


DocumentModels = [
    Users,
    Workspaces,
    Projects,
    Columns,
    Tasks,
    Labels,
    Comments,
    Activities,]