from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status

from api.dependencies import get_current_user
from mongo.schemas import Users, WorkspaceMember, Workspaces
from utils.workspace_model import (
    WorkspaceCreate,
    WorkspaceMemberResponse,
    WorkspaceResponse,
)

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.get(
    path="",
    response_model=list[WorkspaceResponse],
    status_code=status.HTTP_200_OK,
    summary="Get user's workspaces",
    description="Get all workspaces where the current user is a member or owner"
)
async def get_workspaces(
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Get all workspaces for current user
    
    Returns a list of workspaces where the user is either:
    - The owner (ownerId matches user ID)
    - A member (user ID is in members list)
    
    Requires authentication via Bearer token
    """
    # Find workspaces where user is owner
    owned_workspaces = await Workspaces.find(
        Workspaces.ownerId == current_user.id
    ).to_list()
    
    # Find workspaces where user is a member
    all_workspaces = await Workspaces.find().to_list()
    member_workspaces = [
        ws for ws in all_workspaces
        if any(member.userId == current_user.id for member in ws.members)
        and ws.id not in [owned.id for owned in owned_workspaces]
    ]
    
    # Combine and convert to response models
    workspaces = owned_workspaces + member_workspaces
    
    return [
        WorkspaceResponse(
            id=ws.id,
            name=ws.name,
            ownerId=ws.ownerId,
            members=[
                WorkspaceMemberResponse(
                    userId=member.userId,
                    role=member.role
                )
                for member in ws.members
            ],
            createdAt=ws.createdAt,
            updatedAt=ws.updatedAt
        )
        for ws in workspaces
    ]


@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create workspace",
    description="Create a new workspace with the current user as owner"
)
async def create_workspace(
    workspace_data: WorkspaceCreate,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Create a new workspace
    
    - **name**: Workspace name
    
    The current user will automatically be set as the owner and added to members
    
    Requires authentication via Bearer token
    """
    # Create new workspace
    new_workspace = Workspaces(
        name=workspace_data.name,
        ownerId=current_user.id,
        members=[
            WorkspaceMember(
                userId=current_user.id,
                role="owner"
            )
        ]
    )
    
    # Save to database
    await new_workspace.insert()
    
    return WorkspaceResponse(
        id=new_workspace.id,
        name=new_workspace.name,
        ownerId=new_workspace.ownerId,
        members=[
            WorkspaceMemberResponse(
                userId=member.userId,
                role=member.role
            )
            for member in new_workspace.members
        ],
        createdAt=new_workspace.createdAt,
        updatedAt=new_workspace.updatedAt
    )