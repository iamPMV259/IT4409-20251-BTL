import asyncio
from datetime import datetime, timezone
from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from api.dependencies import (
    check_workspace_access,
    get_current_user,
    get_workspace_by_id,
)
from api.websocket import ws_manager
from hooks.http_errors import NotFoundError, PermissionDeniedError, ValidationError
from mongo.schemas import (
    Activities,
    ChecklistItem,
    Columns,
    Comments,
    Projects,
    Tasks,
    Users,
)
from utils.task_models import (
    AssigneeAdd,
    ChecklistItemCreate,
    ChecklistItemResponse,
    ChecklistItemUpdate,
    CommentCreate,
    CommentData,
    CommentResponse,
    LabelAdd,
    LabelCreate,
    LabelResponse,
    MyTasksFilter,
    TaskCreate,
    TaskMove,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter(tags=["Tasks"])



@router.post(
    "/columns/{column_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task in a column",
    description="Create a new task within a specific column"
)
async def create_task(
    column_id: UUID,
    task_data: TaskCreate,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Create a new task in a column
    """
    column = await Columns.get(column_id)
    if not column:
        raise NotFoundError(f"Column with ID {column_id} not found")
    
    project = await Projects.get(column.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this workspace")
    
    new_task = Tasks(
        title=task_data.title,
        description=task_data.description,
        projectId=column.projectId,
        columnId=column_id,
        creatorId=current_user.id,
        dueDate=task_data.dueDate,
        assignees=task_data.assignees or [],
        labels=task_data.labels or [],
    )
    
    await new_task.insert()
    
    column.taskOrder.append(new_task.id)
    await column.save()
    
    activity = Activities(
        projectId=column.projectId,
        taskId=new_task.id,
        userId=current_user.id,
        action="created task",
        details={"task_title": task_data.title}
    )
    await activity.insert()
    
    task_response = TaskResponse(
        id=new_task.id,
        title=new_task.title,
        description=new_task.description,
        projectId=new_task.projectId,
        columnId=new_task.columnId,
        creatorId=new_task.creatorId,
        assignees=new_task.assignees,
        dueDate=new_task.dueDate,
        labels=new_task.labels,
        checklists=new_task.checklists,
        createdAt=new_task.createdAt,
        updatedAt=new_task.updatedAt
    )
    
    asyncio.create_task(
        ws_manager.broadcast_to_project(
            str(project.id),
            "server:task_created",
            task_response.model_dump()
        )
    )

    return task_response


@router.get(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Get task details",
    description="Get detailed information about a specific task"
)
async def get_task(
    task_id: UUID,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Get task details by ID
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Comments, Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")

    comments = await Comments.find(Comments.taskId == task.id).to_list()
    comments_info = []
    for comment in comments:
        user = await Users.find_one(Users.id == comment.userId)
        if user:
            comments_info.append(CommentData(
                commentId=str(comment.id),
                userId=str(comment.userId),
                username=user.name,
                content=comment.content,
                createdAt=comment.createdAt
            ))
    
    
    return TaskResponse(
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
        updatedAt=task.updatedAt,
        comments=comments_info
    )


@router.patch(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Update task",
    description="Update basic task information"
)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Update task information
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.dueDate is not None:
        task.dueDate = task_data.dueDate
    
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="updated task",
        details={"fields_updated": task_data.model_dump_json(exclude_unset=True)}
    )
    await activity.insert()
    
    task_response = TaskResponse(
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

    asyncio.create_task(
        ws_manager.broadcast_to_project(
            str(project.id),
            "server:task_updated",
            task_response.model_dump()
        )
    )

    return task_response


@router.patch(
    "/tasks/{task_id}/move",
    response_model=TaskResponse,
    summary="Move task (Drag & Drop)",
    description="Handle drag-and-drop operations"
)
async def move_task(
    task_id: UUID,
    move_data: TaskMove,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    r"""
    **Move task to different column or position**
    **Args:**
    - **task_id**: ID of the task to move
    - **targetColumnId**: ID of the target column
    - **position**: (Optional) New position in the target column (0-indexed). If not provided, appends to the end.


    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    old_column_id = task.columnId
    new_column_id = move_data.targetColumnId
    
    old_column = await Columns.get(old_column_id)
    new_column = await Columns.get(new_column_id)
    
    if not new_column:
        raise NotFoundError(f"Target column with ID {new_column_id} not found")

    source_position = None
    
    if old_column and task_id in old_column.taskOrder:
        source_position = old_column.taskOrder.index(task_id)
        old_column.taskOrder.remove(task_id)
        await old_column.save()

    new_position = move_data.position
    
    if move_data.position is not None:
        position = min(move_data.position, len(new_column.taskOrder))
        new_position = position
        new_column.taskOrder.insert(position, task_id)
    else:
        new_position = len(new_column.taskOrder)
        new_column.taskOrder.append(task_id)
    
    await new_column.save()
    
    task.columnId = new_column_id
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="moved task",
        details={
            "from_column": str(old_column_id),
            "to_column": str(new_column_id),
            "position": str(move_data.position) if move_data.position is not None else "last"
        }
    )
    await activity.insert()
    
    task_response = TaskResponse(
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

    asyncio.create_task(
        ws_manager.broadcast_to_project(
            str(project.id),
            "server:task_moved",
            {
                "taskId": str(task.id),
                "sourceColumnId": str(old_column_id),
                "sourcePosition": source_position,
                "destColumnId": str(new_column_id),
                "newPosition": new_position
            }
        )
    )

    return task_response


@router.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete task",
    description="Delete a task permanently"
)
async def delete_task(
    task_id: UUID,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Delete a task
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    column = await Columns.get(task.columnId)
    if column and task_id in column.taskOrder:
        column.taskOrder.remove(task_id)
        await column.save()
    
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="deleted task",
        details={"task_title": task.title}
    )
    await activity.insert()

    asyncio.create_task(
        ws_manager.broadcast_to_project(
            str(project.id),
            "server:task_deleted",
            {
                "taskId": str(task.id),
                "columnId": str(task.columnId)
            }
        )
    )

    await task.delete()

    return None


@router.post(
    "/tasks/{task_id}/assignees",
    response_model=TaskResponse,
    summary="Add assignee to task",
    description="Assign a user to a task"
)
async def add_assignee(
    task_id: UUID,
    assignee_data: AssigneeAdd,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Assign a user to a task
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    if assignee_data.userId in task.assignees:
        raise ValidationError("User is already assigned to this task")
    
    assignee = await Users.get(assignee_data.userId)
    if not assignee:
        raise NotFoundError("User not found")
    
    project_members = [member.userId for member in project.members]
    if assignee_data.userId not in project_members:
        raise ValidationError("User doesn't have access to this project")
    
    task.assignees.append(assignee_data.userId)
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="added assignee",
        details={"assignee_id": str(assignee_data.userId), "assignee_name": assignee.name}
    )
    await activity.insert()
    
    task_response = TaskResponse(
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

    asyncio.create_task(
        ws_manager.broadcast_to_project(
            str(project.id),
            "server:task_updated",
            task_response.model_dump()
        )
    )

    return task_response


@router.delete(
    "/tasks/{task_id}/assignees/{user_id}",
    response_model=TaskResponse,
    summary="Remove assignee from task",
    description="Unassign a user from a task"
)
async def remove_assignee(
    task_id: UUID,
    user_id: UUID,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Remove an assignee from a task
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    if user_id not in task.assignees:
        raise ValidationError("User is not assigned to this task")
    
    task.assignees.remove(user_id)
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    assignee = await Users.get(user_id)
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="removed assignee",
        details={"assignee_id": str(user_id), "assignee_name": assignee.name if assignee else "Unknown"}
    )
    await activity.insert()
    
    task_response = TaskResponse(
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

    asyncio.create_task(
        ws_manager.broadcast_to_project(
            str(project.id),
            "server:task_updated",
            task_response.model_dump()
        )
    )

    return task_response




@router.post(
    "/tasks/{task_id}/labels",
    response_model=TaskResponse,
    summary="Add label to task",
    description="Add a label to a task"
)
async def add_label(
    task_id: UUID,
    label_data: LabelAdd,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Add a label to a task
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Labels, Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    label = await Labels.get(label_data.labelId)
    if not label:
        raise NotFoundError("Label not found")
    
    if label.projectId != task.projectId:
        raise ValidationError("Label doesn't belong to this project")
    
    if label_data.labelId in task.labels:
        raise ValidationError("Label is already added to this task")
    
    task.labels.append(label_data.labelId)
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="added label",
        details={"label_id": str(label_data.labelId), "label_text": label.text}
    )
    await activity.insert()
    
    task_response = TaskResponse(
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

    asyncio.create_task(
        ws_manager.broadcast_to_project(
            str(project.id),
            "server:task_updated",
            task_response.model_dump()
        )
    )

    return task_response


@router.post(
    "/tasks/{task_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add comment to task",
    description="Add a comment to a task"
)
async def add_comment(
    task_id: UUID,
    comment_data: CommentCreate,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Add a comment to a task
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    new_comment = Comments(
        taskId=task_id,
        userId=current_user.id,
        content=comment_data.content
    )
    
    await new_comment.insert()
    
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="added comment",
        details={"comment_preview": comment_data.content[:50]}
    )
    await activity.insert()
    
    comment_response = CommentResponse(
        id=new_comment.id,
        taskId=new_comment.taskId,
        userId=new_comment.userId,
        content=new_comment.content,
        createdAt=new_comment.createdAt
    )

    asyncio.create_task(
        ws_manager.broadcast_to_project(
            str(project.id),
            "server:comment_added",
            comment_response.model_dump()
        )
    )

    return comment_response


@router.post(
    "/tasks/{task_id}/checklist-items",
    response_model=ChecklistItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add checklist item",
    description="Add an item to task checklist"
)
async def add_checklist_item(
    task_id: UUID,
    item_data: ChecklistItemCreate,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Add a checklist item to a task
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    new_item = ChecklistItem(
        text=item_data.text,
        checked=item_data.checked or False
    )
    
    task.checklists.append(new_item)
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="added checklist item",
        details={"item_text": item_data.text}
    )
    await activity.insert()
    
    item_response = ChecklistItemResponse(
        text=new_item.text,
        checked=new_item.checked
    )

    asyncio.create_task(
        ws_manager.broadcast_to_project(
            str(project.id),
            "server:task_updated",
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
            ).model_dump()
        )
    )

    return item_response


@router.patch(
    "/tasks/{task_id}/checklist-items/{item_index}",
    response_model=ChecklistItemResponse,
    summary="Update checklist item",
    description="Update a checklist item"
)
async def update_checklist_item(
    task_id: UUID,
    item_index: int,
    item_data: ChecklistItemUpdate,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Update a checklist item
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    if item_index < 0 or item_index >= len(task.checklists):
        raise NotFoundError("Checklist item not found")
    
    if item_data.text is not None:
        task.checklists[item_index].text = item_data.text
    if item_data.checked is not None:
        task.checklists[item_index].checked = item_data.checked
    
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="updated checklist item",
        details={
            "item_index": str(item_index),
            "changes": item_data.model_dump_json(exclude_unset=True)
        }
    )
    await activity.insert()
    
    item_response = ChecklistItemResponse(
        text=task.checklists[item_index].text,
        checked=task.checklists[item_index].checked
    )

    asyncio.create_task(
        ws_manager.broadcast_to_project(
            str(project.id),
            "server:task_updated",
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
            ).model_dump()
        )
    )

    return item_response



@router.get(
    "/me/tasks",
    response_model=List[TaskResponse],
    summary="Get my tasks",
    description="Get all tasks assigned to current user"
)
async def get_my_tasks(
    current_user: Annotated[Users, Depends(get_current_user)],
    project_id: Optional[UUID] = Query(None, description="Filter by project ID"),
    label_id: Optional[UUID] = Query(None, description="Filter by label ID"),
    overdue: Optional[bool] = Query(None, description="Filter overdue tasks"),
    this_week: Optional[bool] = Query(None, description="Filter tasks due this week"),
):
    """
    Get all tasks assigned to the current user
    """
    query_conditions = [Tasks.assignees == current_user.id]
    
    if project_id:
        query_conditions.append(Tasks.projectId == project_id)
    
    if label_id:
        query_conditions.append(Tasks.labels == label_id)
    
    if len(query_conditions) == 1:
        tasks = await Tasks.find(query_conditions[0]).to_list()
    else:
        tasks = await Tasks.find(*query_conditions).to_list()
    
    now = datetime.now(timezone.utc)
    
    if overdue:
        tasks = [
            task for task in tasks
            if task.dueDate and task.dueDate < now
        ]
    
    if this_week:
        from datetime import timedelta
        week_end = now + timedelta(days=7)
        tasks = [
            task for task in tasks
            if task.dueDate and now <= task.dueDate <= week_end
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
    
    task_responses.sort(
        key=lambda t: (
            t.dueDate if t.dueDate else datetime.max.replace(tzinfo=timezone.utc),
            t.createdAt
        )
    )
    
    return task_responses