from datetime import datetime, timedelta, timezone
from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel

from api.dependencies import get_current_user
from mongo.schemas import Columns, Labels, Projects, Tasks, Users
from utils.task_models import LabelResponse, TaskResponse

router = APIRouter(prefix="/search", tags=["Search"])





class ProjectSearchResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    createdAt: datetime
    updatedAt: datetime
    status: str
    deadline: datetime | None = None
    workspaceId: str

@router.get(
    path="/projects/search",
    response_model=list[ProjectSearchResponse],
    status_code=status.HTTP_200_OK,
    summary="Search projects by name or description",
    description="Search for projects by their name or description that the current user is a member of"
)
async def search_projects(query: str, current_user: Annotated[Users, Depends(get_current_user)]):
    r"""
    **Search projects by name or description**
    **Args:**
        - `query`: The search query string
    """

    projects = await Projects.find_all().to_list()
    matching_projects: list[ProjectSearchResponse] = []

    for project in projects:
        if (query.lower() in project.name.lower() or
                (project.description and query.lower() in project.description.lower())):
            if any(member.userId == current_user.id for member in project.members):
                matching_projects.append(
                    ProjectSearchResponse(
                        id=str(project.id),
                        name=project.name,
                        description=project.description if project.description else None,
                        createdAt=project.createdAt,
                        updatedAt=project.updatedAt,
                        status=project.status,
                        deadline=project.deadline if project.deadline else None,
                        workspaceId=str(project.workspaceId)
                    )
                )

    return matching_projects
        
class LabelData(BaseModel):
    labelId: str
    text: str

class TaskSearchResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    createdAt: datetime
    updatedAt: datetime
    dueDate: datetime | None = None
    projectId: str
    projectName: str
    columnId: str
    columnName: str
    labels: list[LabelData]

@router.get(
    path="/tasks/search",
    response_model=list[TaskSearchResponse],
    status_code=status.HTTP_200_OK,
    summary="Search tasks by title or description",
    description="Search for tasks by their title or description that belong to projects the current user is a member of"    
)
async def search_tasks(query: str, current_user: Annotated[Users, Depends(get_current_user)]):
    r"""
    **Search tasks by title or description**
    **Args:**
        - `query`: The search query string
    """

    tasks = await Tasks.find_all().to_list()
    matching_tasks: list[TaskSearchResponse] = []

    for task in tasks:
        if (query.lower() in task.title.lower() or
                (task.description and query.lower() in task.description.lower())):
            project = await Projects.get(task.projectId)
            if project and any(member.userId == current_user.id for member in project.members):
                column = await Columns.find_one(Columns.id == task.columnId)
                labels_data: list[LabelData] = []
                for label_id in task.labels:
                    label = await Labels.find_one(Labels.id == label_id)
                    if label:
                        labels_data.append(LabelData(labelId=str(label.id), text=label.text))
                matching_tasks.append(
                    TaskSearchResponse(
                        id=str(task.id),
                        title=task.title,
                        description=task.description if task.description else None,
                        createdAt=task.createdAt,
                        updatedAt=task.updatedAt,
                        dueDate=task.dueDate if task.dueDate else None,
                        projectId=str(project.id),
                        projectName=project.name,
                        columnId=str(column.id) if column else "",
                        columnName=column.title if column else "",
                        labels=labels_data
                    )
                )

    return matching_tasks

@router.get(
    path="/me/labels",
    response_model=list[LabelResponse],
    summary="Get my labels",
    description="Get all labels from projects the current user is a member of"
)
async def get_my_labels(
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    **Get all labels from projects the current user is a member of**
    """
    projects = await Projects.find_all().to_list()
    user_labels: list[LabelResponse] = []

    

    for project in projects:
        if any(member.userId == current_user.id for member in project.members):
            from mongo.schemas import Labels
            labels = await Labels.find(Labels.projectId == project.id).to_list()
            for label in labels:
                user_labels.append(LabelResponse(
                    id=str(label.id),
                    projectId=str(label.projectId),
                    text=label.text,
                    color=label.color
                ))

    labels_dict = {str(label.text): label for label in user_labels}

    user_labels = list(labels_dict.values())
    

    return user_labels

@router.get(
    "/me/tasks",
    response_model=List[TaskResponse],
    summary="Get my tasks",
    description="Get all tasks assigned to current user"
)
async def get_my_tasks(
    current_user: Annotated[Users, Depends(get_current_user)],
    project_id: Optional[UUID] = Query(None, description="Filter by project ID"),
    label_text: Optional[str] = Query(None, description="Filter by label text"),
    no_due_date: Optional[bool] = Query(None, description="Filter tasks with no due date"),
    overdue: Optional[bool] = Query(None, description="Filter overdue tasks"),
    this_week: Optional[bool] = Query(None, description="Filter tasks due this week"),
):
    """
    Get all tasks assigned to the current user
    """
    tasks = await Tasks.find_all().to_list()
    tasks = [task for task in tasks if current_user.id in task.assignees]

    if project_id:
        tasks = [task for task in tasks if task.projectId == project_id]
    
    if label_text:
        from mongo.schemas import Labels
        matching_label_ids: list[UUID] = []
        labels = await Labels.find(Labels.text == label_text).to_list()
        for label in labels:
            matching_label_ids.append(label.id)
        
        tasks = [
            task for task in tasks
            if any(label_id in matching_label_ids for label_id in task.labels)
        ]
    
    now = datetime.now(timezone.utc)
    
    def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
        """Ensure datetime is timezone-aware for comparison."""
        if dt is None:
            return None
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt
    
    if overdue:
        tasks = [
            task for task in tasks
            if task.dueDate and to_utc(task.dueDate) < now
        ]
    
    if this_week:
        from datetime import timedelta
        week_end = now + timedelta(days=7)
        tasks = [
            task for task in tasks
            if task.dueDate and now <= to_utc(task.dueDate) <= week_end
        ]
    
    if no_due_date:
        tasks = [
            task for task in tasks
            if not task.dueDate
        ]
    
    task_responses = [
        TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            projectId=task.projectId,
            columnId=task.columnId,
            creatorId=task.creatorId,
            assignees=task.assignees,
            dueDate=task.dueDate,
            labels=task.labels,
            checklists=task.checklists,
            createdAt=task.createdAt,
            updatedAt=task.updatedAt
        )
        for task in tasks
    ]
    
    def normalize_datetime(dt: Optional[datetime]) -> datetime:
        """Ensure datetime is timezone-aware for consistent comparison."""
        if dt is None:
            return datetime.max.replace(tzinfo=timezone.utc)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt
    
    task_responses.sort(
        key=lambda t: (
            normalize_datetime(t.dueDate),
            normalize_datetime(t.createdAt)
        )
    )
    
    return task_responses


@router.get(
    "/me/projects",
    response_model=List[ProjectSearchResponse],
    status_code=status.HTTP_200_OK,
    summary="Get my projects",
    description="Get all projects the current user is a member of"
)
async def get_my_projects(
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    **Get all projects the current user is a member of**
    """
    projects = await Projects.find_all().to_list()
    user_projects: list[ProjectSearchResponse] = []

    for project in projects:
        if any(member.userId == current_user.id for member in project.members):
            user_projects.append(
                ProjectSearchResponse(
                    id=str(project.id),
                    name=project.name,
                    description=project.description if project.description else None,
                    createdAt=project.createdAt,
                    updatedAt=project.updatedAt,
                    status=project.status,
                    deadline=project.deadline if project.deadline else None,
                    workspaceId=str(project.workspaceId)
                )
            )

    return user_projects