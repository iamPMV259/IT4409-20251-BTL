

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    """Schema for user response (without password)"""
    id: UUID = Field(..., description="User's unique identifier")
    name: str = Field(..., description="User's full name")
    email: EmailStr = Field(..., description="User's email address")
    avatarUrl: Optional[str] = Field(None, description="URL to user's avatar image")
    createdAt: datetime = Field(..., description="User creation timestamp")
    updatedAt: datetime = Field(..., description="User last update timestamp")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "John Doe",
                "email": "john@example.com",
                "avatarUrl": "https://example.com/avatars/john.jpg",
                "createdAt": "2025-01-15T10:30:00Z",
                "updatedAt": "2025-01-15T10:30:00Z"
            }
        }


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="User's full name")
    avatarUrl: Optional[str] = Field(None, description="URL to user's avatar image")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Smith",
                "avatarUrl": "https://example.com/avatars/john-new.jpg"
            }
        }