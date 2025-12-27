"""
Workspace Schemas
Pydantic models for workspace API requests and responses
"""

from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, Field


class WorkspaceMemberResponse(BaseModel):
    """Schema for workspace member information"""
    userId: UUID = Field(..., description="User's unique identifier")
    role: str = Field(..., description="User's role in workspace (owner/admin/member)")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "userId": "123e4567-e89b-12d3-a456-426614174000",
                "role": "owner"
            }
        }


class WorkspaceCreate(BaseModel):
    """Schema for creating a new workspace"""
    name: str = Field(..., min_length=1, max_length=100, description="Workspace name")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "My Team Workspace"
            }
        }


class WorkspaceResponse(BaseModel):
    """Schema for workspace response"""
    id: UUID = Field(..., description="Workspace unique identifier")
    name: str = Field(..., description="Workspace name")
    ownerId: UUID = Field(..., description="Workspace owner's user ID")
    members: List[WorkspaceMemberResponse] = Field(default_factory=list, description="List of workspace members")
    createdAt: datetime = Field(..., description="Workspace creation timestamp")
    updatedAt: datetime = Field(..., description="Workspace last update timestamp")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174001",
                "name": "My Team Workspace",
                "ownerId": "123e4567-e89b-12d3-a456-426614174000",
                "members": [
                    {
                        "userId": "123e4567-e89b-12d3-a456-426614174000",
                        "role": "owner"
                    }
                ],
                "createdAt": "2025-01-15T10:30:00Z",
                "updatedAt": "2025-01-15T10:30:00Z"
            }
        }


class WorkspaceUpdate(BaseModel):
    """Schema for updating workspace"""
    name: str | None = Field(None, min_length=1, max_length=100, description="Workspace name")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Updated Workspace Name"
            }
        }