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
from migrate_nodejs_backend.projects import (
    ProjectAddMemberResponse,
    ProjectBoardResponse,
    ProjectColumnsCreatedResponse,
    ProjectDeleteResponse,
    ProjectGetResponse,
    ProjectUpdateRequest,
    add_project_member,
    create_project_columns,
    delete_project,
    get_project,
    get_project_board,
    update_project,
)
from mongo.schemas import Users

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get(
    path="/{project_id}",
    response_model=ProjectGetResponse,
    status_code=status.HTTP_200_OK,
    summary="Get project details",
    description="Get details of a specific project by its ID"
)
async def api_get_project(
    project_id: str,
    current_user: Annotated[Users, Depends(get_current_user)],
    request: Request,
):
    r"""
    **Get project details by its ID**
    
    **Args:**
        `project_id`: ID of the project to retrieve
        (Requires authentication via Bearer token)
    **Returns:**
        `ProjectGetResponse` with project details
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    # Login to Node.js backend to get token
    bearer_token = auth_header[len("Bearer "):]
    
    # Call the migrate_nodejs_backend function to get the project details
    try:
        return await get_project(
            project_id=project_id,
            token=bearer_token
        )
    except AuthenticationError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except BadRequestError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except InternalServerError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch(
    path="/{project_id}",
    response_model=ProjectGetResponse,
    status_code=status.HTTP_200_OK,
    summary="Update project details",
    description="Update the details of a specific project by its ID"
)
async def api_update_project(
    project_id: str,
    update_data: ProjectUpdateRequest,
    current_user: Annotated[Users, Depends(get_current_user)],
    request: Request,
):
    r"""
    **Update project details by its ID**
    
    **Args:**
    - **project_id**: ID of the project to update
    - **update_data**: Data to update the project
        `name`: New name of the project (optional)
        `description`: New description of the project (optional)
        `status`: New status of the project (optional)
        `deadline`: New deadline of the project (optional, ISO 8601 format)
    
        (Requires authentication via Bearer token)
    **Returns:**
        `ProjectGetResponse` with updated project details

    """

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    # Login to Node.js backend to get token
    bearer_token = auth_header[len("Bearer "):]

    try:
        return await update_project(
            project_id=project_id,
            update_data=update_data,
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


@router.delete(
    path="/{project_id}",
    response_model=ProjectDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a project",
    description="Delete a specific project by its ID"
)
async def api_delete_project(
    project_id: str,
    current_user: Annotated[Users, Depends(get_current_user)],
    request: Request,
):
    r"""
    **Delete a project by its ID**
    
    **Args:**
        `project_id`: ID of the project to delete
        (Requires authentication via Bearer token)
    **Returns:**
        `ProjectDeleteResponse` indicating success or failure
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    # Login to Node.js backend to get token
    bearer_token = auth_header[len("Bearer "):]
    
    # Call the migrate_nodejs_backend function to delete the project
    try:
        return await delete_project(
            project_id=project_id,
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



@router.post(
    path="/{project_id}/members",
    response_model=ProjectAddMemberResponse,
    status_code=status.HTTP_200_OK,
    summary="Add member to project",
    description="Add a member to a specific project by its ID"
)
async def api_add_project_member(
    project_id: str,
    member_email: list[str],
    current_user: Annotated[Users, Depends(get_current_user)],
    request: Request,
):
    r"""
    **Add a member to a project by its ID**
    
    **Args:**
    - **project_id**: ID of the project to add the member to
    - **member_email**: Email of the member to add to the project
    
        (Requires authentication via Bearer token)
    **Returns:**
        `ProjectAddMemberResponse` indicating success or failure
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    # Login to Node.js backend to get token
    bearer_token = auth_header[len("Bearer "):]
    
    # Call the migrate_nodejs_backend function to add the project member
    try:
        return await add_project_member(
            project_id=project_id,
            member_email=member_email,
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



@router.post(
    path="/{project_id}/columns",
    response_model=ProjectColumnsCreatedResponse,
    status_code=status.HTTP_200_OK,
    summary="Create default columns for project",
    description="Create default columns (To Do, In Progress, Done) for a specific project by its ID"
)
async def api_create_project_columns(
    project_id: str,
    column_title: str,
    current_user: Annotated[Users, Depends(get_current_user)],
    request: Request,
):
    r"""
    **Create default columns for a project by its ID**
    
    **Args:**
        `project_id`: ID of the project to create default columns for
        `column_title`: Title of the column to create
        (Requires authentication via Bearer token)
    **Returns:**
        `ProjectColumnsCreatedResponse` indicating success or failure
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    # Login to Node.js backend to get token
    bearer_token = auth_header[len("Bearer "):]

    try:
        return await create_project_columns(
            project_id=project_id,
            column_title=column_title,
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