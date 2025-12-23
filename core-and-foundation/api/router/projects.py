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
    ProjectColumnCreatedResponse,
    ProjectDeleteResponse,
    ProjectDetailResponse,
    ProjectUpdateRequest,
    ProjectUpdateResponse,
    add_project_member,
    create_project_columns,
    delete_project,
    get_project,
    get_project_board,
    update_project,
)
from mongo.schemas import Labels, Projects, Users
from utils.task_models import (
    LabelAdd,
    LabelCreate,
    LabelResponse,
    TaskCreate,
    TaskResponse,
)

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get(
    path="/{project_id}",
    response_model=ProjectDetailResponse,
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
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    bearer_token = auth_header[len("Bearer "):]
    
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




@router.get(
    path="/{project_id}/board",
    response_model=ProjectBoardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get project board",
    description="Get the Kanban board details including columns and tasks"
)
async def api_get_project_board(
    project_id: str,
    current_user: Annotated[Users, Depends(get_current_user)],
    request: Request,
):
    r"""
    **Get project board by its ID**
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    bearer_token = auth_header[len("Bearer "):]

    try:
        return await get_project_board(
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
    response_model=ProjectUpdateResponse, 
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
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
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
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    bearer_token = auth_header[len("Bearer "):]
    
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
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    bearer_token = auth_header[len("Bearer "):]
    
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
    response_model=ProjectColumnCreatedResponse,
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
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
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



from uuid import UUID


@router.post(
    path="/{project_id}/labels",
    response_model=list[LabelResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create some new labels in the project",
    description="Create some new labels within the specified project"
)
async def api_create_label(
    project_id: UUID,
    label_list: list[LabelCreate],
    current_user: Annotated[Users, Depends(get_current_user)],
):
    r"""
    **Create some new labels in the project**
    **Args:**
        - `project_id`: The UUID of the project where labels will be created
        - `label_list`: A list of LabelCreate objects containing label details
            - `text`: The text of the label
            - `color`: (Optional) The color of the label in hex code
    """

    project = await Projects.get(project_id)
    if project is None:
        raise NotFoundError("Project not found")

    project_members = [member.userId for member in project.members]
    if current_user.id not in project_members:
        raise PermissionDeniedError("You do not have permission to create labels in this project")

    created_labels = []
    for label_data in label_list:
        label = Labels(
            projectId=project_id,
            text=label_data.text,
            color=label_data.color if label_data.color else None
        )
        await label.insert()
        created_labels.append(LabelResponse(
            id=str(label.id),
            projectId=str(label.projectId),
            text=label.text,
            color=label.color
        ))

    return created_labels


@router.get(
    path="/{project_id}/labels",
    response_model=list[LabelResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all labels in the project",
    description="Retrieve all labels associated with the specified project"
)
async def api_get_labels(
    project_id: UUID,
    current_user: Annotated[Users, Depends(get_current_user)],
):
    r"""
    **Get all labels in the project**
    **Args:**
        - `project_id`: The UUID of the project to retrieve labels from
    """

    project = await Projects.get(project_id)
    if project is None:
        raise NotFoundError("Project not found")

    project_members = [member.userId for member in project.members]
    if current_user.id not in project_members:
        raise PermissionDeniedError("You do not have permission to view labels in this project")

    labels = await Labels.find(Labels.projectId == project_id).to_list()
    label_responses = [
        LabelResponse(
            id=str(label.id),
            projectId=str(label.projectId),
            text=label.text,
            color=label.color
        )
        for label in labels
    ]

    return label_responses



        