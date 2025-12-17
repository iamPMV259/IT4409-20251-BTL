from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

# TASK MODLES

class TaskCreate(BaseModel):
    """Schema for creating a new task"""
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: Optional[str] = Field(None, description="Task description")
    dueDate: Optional[datetime] = Field(None, description="Task due date")
    assignees: Optional[List[UUID]] = Field(default_factory=list, description="Initial assignees")
    labels: Optional[List[UUID]] = Field(default_factory=list, description="Initial labels")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Implement user authentication",
                "description": "Add JWT-based authentication system",
                "dueDate": "2024-12-20T10:00:00Z",
                "assignees": ["123e4567-e89b-12d3-a456-426614174000"],
                "labels": ["123e4567-e89b-12d3-a456-426614174001"]
            }
        }


class TaskUpdate(BaseModel):
    """Schema for updating a task"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="New task title")
    description: Optional[str] = Field(None, description="New task description")
    dueDate: Optional[datetime] = Field(None, description="New due date")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Implement OAuth authentication",
                "description": "Updated: Add OAuth 2.0 support",
                "dueDate": "2024-12-25T10:00:00Z"
            }
        }


class TaskMove(BaseModel):
    """Schema for moving a task (Drag & Drop)"""
    targetColumnId: UUID = Field(..., description="Target column ID")
    position: Optional[int] = Field(None, ge=0, description="New position in column (0-indexed)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "targetColumnId": "123e4567-e89b-12d3-a456-426614174002",
                "position": 10
            }
        }


class ChecklistItemSchema(BaseModel):
    """Schema for checklist item embedded in task"""
    text: str = Field(..., description="Checklist item text")
    checked: bool = Field(default=False, description="Whether item is checked")
    
    class Config:
        from_attributes = True


class TaskResponse(BaseModel):
    """Schema for task response"""
    id: UUID = Field(..., description="Task unique identifier")
    title: str = Field(..., description="Task title")
    description: Optional[str] = Field(None, description="Task description")
    projectId: UUID = Field(..., description="Project ID")
    columnId: UUID = Field(..., description="Column ID")
    creatorId: UUID = Field(..., description="Creator user ID")
    assignees: List[UUID] = Field(default_factory=list, description="Assigned user IDs")
    dueDate: Optional[datetime] = Field(None, description="Due date")
    labels: List[UUID] = Field(default_factory=list, description="Label IDs")
    checklists: List[ChecklistItemSchema] = Field(default_factory=list, description="Checklist items")
    createdAt: datetime = Field(..., description="Creation timestamp")
    updatedAt: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174003",
                "title": "Implement user authentication",
                "description": "Add JWT-based authentication system",
                "projectId": "123e4567-e89b-12d3-a456-426614174004",
                "columnId": "123e4567-e89b-12d3-a456-426614174005",
                "creatorId": "123e4567-e89b-12d3-a456-426614174000",
                "assignees": ["123e4567-e89b-12d3-a456-426614174000"],
                "dueDate": "2024-12-20T10:00:00Z",
                "labels": ["123e4567-e89b-12d3-a456-426614174001"],
                "checklists": [
                    {"text": "Set up JWT library", "checked": True},
                    {"text": "Create login endpoint", "checked": False}
                ],
                "createdAt": "2024-12-01T10:00:00Z",
                "updatedAt": "2024-12-05T15:30:00Z"
            }
        }


# ==================== ASSIGNEE MODELS ====================

class AssigneeAdd(BaseModel):
    """Schema for adding an assignee"""
    userId: UUID = Field(..., description="User ID to assign")
    
    class Config:
        json_schema_extra = {
            "example": {
                "userId": "123e4567-e89b-12d3-a456-426614174000"
            }
        }


# ==================== LABEL MODELS ====================

class LabelAdd(BaseModel):
    """Schema for adding a label"""
    labelId: UUID = Field(..., description="Label ID to add")
    
    class Config:
        json_schema_extra = {
            "example": {
                "labelId": "123e4567-e89b-12d3-a456-426614174001"
            }
        }

class LabelCreate(BaseModel):
    """Schema for creating a new label"""
    text: str = Field(..., min_length=1, max_length=100, description="Label text")
    color: str | None = Field(..., min_length=7, max_length=7, description="Label color (hex code)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "High Priority",
                "color": "#FF5733"
            }
        }

class LabelResponse(BaseModel):
    """Schema for label response"""
    id: str = Field(..., description="Label unique identifier")
    projectId: str = Field(..., description="Project ID")
    text: str = Field(..., description="Label text")
    color: str | None = Field(..., description="Label color (hex code)")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174001",
                "projectId": "123e4567-e89b-12d3-a456-426614174004",
                "text": "High Priority",
                "color": "#FF5733"
            }
        }


# ==================== COMMENT MODELS ====================

class CommentCreate(BaseModel):
    """Schema for creating a comment"""
    content: str = Field(..., min_length=1, max_length=2000, description="Comment content")
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "I've completed the initial implementation. Ready for review."
            }
        }


class CommentResponse(BaseModel):
    """Schema for comment response"""
    id: UUID = Field(..., description="Comment unique identifier")
    taskId: UUID = Field(..., description="Task ID")
    userId: UUID = Field(..., description="Author user ID")
    content: str = Field(..., description="Comment content")
    createdAt: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174006",
                "taskId": "123e4567-e89b-12d3-a456-426614174003",
                "userId": "123e4567-e89b-12d3-a456-426614174000",
                "content": "I've completed the initial implementation. Ready for review.",
                "createdAt": "2024-12-05T16:00:00Z"
            }
        }


# ==================== CHECKLIST MODELS ====================

class ChecklistItemCreate(BaseModel):
    """Schema for creating a checklist item"""
    text: str = Field(..., min_length=1, max_length=500, description="Checklist item text")
    checked: Optional[bool] = Field(False, description="Initial checked state")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "Write unit tests",
                "checked": False
            }
        }


class ChecklistItemUpdate(BaseModel):
    """Schema for updating a checklist item"""
    text: Optional[str] = Field(None, min_length=1, max_length=500, description="New text")
    checked: Optional[bool] = Field(None, description="New checked state")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "Write comprehensive unit tests",
                "checked": True
            }
        }


class ChecklistItemResponse(BaseModel):
    """Schema for checklist item response"""
    text: str = Field(..., description="Checklist item text")
    checked: bool = Field(..., description="Whether item is checked")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "text": "Write unit tests",
                "checked": True
            }
        }


# ==================== MY TASKS FILTER ====================

class MyTasksFilter(BaseModel):
    """Schema for filtering my tasks"""
    projectId: Optional[UUID] = Field(None, description="Filter by project")
    labelId: Optional[UUID] = Field(None, description="Filter by label")
    overdue: Optional[bool] = Field(None, description="Show only overdue tasks")
    thisWeek: Optional[bool] = Field(None, description="Show only tasks due this week")
    
    class Config:
        json_schema_extra = {
            "example": {
                "projectId": "123e4567-e89b-12d3-a456-426614174004",
                "labelId": "123e4567-e89b-12d3-a456-426614174001",
                "overdue": False,
                "thisWeek": True
            }
        }