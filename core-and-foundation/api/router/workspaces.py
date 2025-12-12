from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from api.dependencies import get_current_user
from hooks.http_errors import (
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    NotFoundError,
    PermissionDeniedError,
)
from migrate_nodejs_backend.workspaces import (
    ProjectCreatedResponse,
    ProjectCreateRequest,
    ProjectGetResponse,
    create_project,
    get_projects,
)
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


@router.post(
    path="/{workspace_id}/projects",
    response_model=ProjectCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create project in workspace",
    description="Create a new project within a specific workspace"
)
async def api_create_project(
    workspace_id: str,
    project_data: ProjectCreateRequest,
    current_user: Annotated[Users, Depends(get_current_user)],
    request: Request,
):
    r"""
    **Create a new project in a workspace**
    **Args:**
    - **workspace_id**: ID of the workspace to create the project in
    - **name**: Project name
    - **description**: Project description
    - **deadline**: (Optional) Project deadline datetime
    **Returns:**
    `ProjectCreatedResponse` with details of the created project
    
    Requires authentication via Bearer token
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    # Login to Node.js backend to get token
    bearer_token = auth_header[len("Bearer "):]
    
    # Call the migrate_nodejs_backend function to create the project
    try:
        return await create_project(
            workspace_id=workspace_id,
            project_data=project_data,
            token=bearer_token
        )
    except AuthenticationError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except BadRequestError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except InternalServerError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get(
    path="/{workspace_id}/projects",
    response_model=ProjectGetResponse,
    status_code=status.HTTP_200_OK,
    summary="Get projects in workspace",
    description="Get all projects within a specific workspace"
)
async def api_get_projects(
    workspace_id: str,
    current_user: Annotated[Users, Depends(get_current_user)],
    request: Request,
):
    r"""
    **Get all projects in a workspace**
    
    **Args:**
    - **workspace_id**: ID of the workspace to retrieve projects from
        (Requires authentication via Bearer token)

    **Returns:**
        `ProjectGetResponse` with list of projects
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    # Login to Node.js backend to get token
    bearer_token = auth_header[len("Bearer "):]
    
    # Call the migrate_nodejs_backend function to get the projects
    try:
        return await get_projects(
            workspace_id=workspace_id,
            token=bearer_token
        )
    except AuthenticationError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except BadRequestError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except InternalServerError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))