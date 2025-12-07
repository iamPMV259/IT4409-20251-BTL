from datetime import datetime, timezone
from typing import Annotated, List, Optional
from uuid import UUID
from websocket import ws_manager

from fastapi import APIRouter, Depends, Query, status

from api.dependencies import (
    get_current_user,
    get_workspace_by_id,
    check_workspace_access,
)
from hooks.http_errors import NotFoundError, PermissionDeniedError, ValidationError
from mongo.schemas import (
    Users,
    Tasks,
    Columns,
    Projects,
    Comments,
    ChecklistItem,
    Activities,
)
from utils.task_models import (
    TaskCreate,
    TaskUpdate,
    TaskMove,
    TaskResponse,
    AssigneeAdd,
    LabelAdd,
    CommentCreate,
    CommentResponse,
    ChecklistItemCreate,
    ChecklistItemUpdate,
    ChecklistItemResponse,
    MyTasksFilter,
)

router = APIRouter(tags=["Tasks"])


# ==================== MODULE 5: TASKS API ====================

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
    
    - **column_id**: Target column ID
    - **title**: Task title (required)
    - **description**: Task description (optional)
    - **dueDate**: Due date (optional)
    """
    # Verify column exists and user has access
    column = await Columns.get(column_id)
    if not column:
        raise NotFoundError(f"Column with ID {column_id} not found")
    
    # Get project to verify access
    project = await Projects.get(column.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    # Check if user has access to the workspace
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this workspace")
    
    # Get the last task position in this column
    existing_tasks = await Tasks.find(Tasks.columnId == column_id).to_list()
    max_position = max([task.taskOrder for task in column.taskOrder] if column.taskOrder else [0], default=0)
    
    # Create new task
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
    
    # Update column's task order
    column.taskOrder.append(new_task.id)
    await column.save()
    
    # Log activity
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
 #Realtime broadcast: sever:task_created
 #broadcast realtime do not block API
    asyncio.create_task(
        ws_manager.broadcast_to_workspace(
            str(workspace.id),
            "server:task_created",
            task_response.model_dump()
        )
    )

    return task_response


@router.get(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Get task details",
    description="Get detailed information about a specific task (for modal display)"
)
async def get_task(
    task_id: UUID,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Get task details by ID
    
    Returns complete task information including assignees, labels, checklist, and comments
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    # Verify access through project
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
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
        updatedAt=task.updatedAt
    )


@router.patch(
    "/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Update task",
    description="Update basic task information (title, description, due date)"
)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Update task information
    
    - **title**: New task title (optional)
    - **description**: New description (optional)
    - **dueDate**: New due date (optional)
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    # Verify access
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    # Update fields
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.dueDate is not None:
        task.dueDate = task_data.dueDate
    
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    # Log activity
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="updated task",
        details={"fields_updated": task_data.model_dump(exclude_unset=True)}
    )
    await activity.insert()
    
    task_response =  TaskResponse(
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

    # REALTIME BROADCAST: server:task_updated
    asyncio.create_task(
        ws_manager.broadcast_to_workspace(
            str(workspace.id),
            "server:task_updated",
            task_response.model_dump()
        )
    )

    return task_response


@router.patch(
    "/tasks/{task_id}/move",
    response_model=TaskResponse,
    summary="Move task (Drag & Drop)",
    description="Handle drag-and-drop operations, update task position and column"
)
async def move_task(
    task_id: UUID,
    move_data: TaskMove,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Move task to different column or position (Drag & Drop handler)
    
    - **targetColumnId**: Target column ID
    - **position**: New position in the column (0-indexed)
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    # Verify access
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    old_column_id = task.columnId
    new_column_id = move_data.targetColumnId
    
    # Get columns
    old_column = await Columns.get(old_column_id)
    new_column = await Columns.get(new_column_id)
    
    if not new_column:
        raise NotFoundError(f"Target column with ID {new_column_id} not found")
    
    # Remove from old column's task order
    if old_column and task_id in old_column.taskOrder:
        old_column.taskOrder.remove(task_id)
        await old_column.save()
    
    # Add to new column's task order at specified position
    if move_data.position is not None:
        position = min(move_data.position, len(new_column.taskOrder))
        new_column.taskOrder.insert(position, task_id)
    else:
        new_column.taskOrder.append(task_id)
    
    await new_column.save()
    
    # Update task's column
    task.columnId = new_column_id
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    # Log activity
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="moved task",
        details={
            "from_column": str(old_column_id),
            "to_column": str(new_column_id),
            "position": move_data.position
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

    # REALTIME BROADCAST: server:task_moved
    asyncio.create_task(
        ws_manager.broadcast_to_workspace(
            str(workspace.id),
            "server:task_moved",
            {
                "taskId": str(task.id),
                "sourceColumnId": str(old_column_id),
                "destColumnId": str(new_column_id),
                "newPosition": move_data.position
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
    
    This will also remove the task from its column's task order
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    # Verify access
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    # Remove from column's task order
    column = await Columns.get(task.columnId)
    if column and task_id in column.taskOrder:
        column.taskOrder.remove(task_id)
        await column.save()
    
    # Log activity before deletion
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="deleted task",
        details={"task_title": task.title}
    )
    await activity.insert()

    # REALTIME BROADCAST: server:task_deleted
    asyncio.create_task(
        ws_manager.broadcast_to_workspace(
            str(workspace.id),
            "server:task_deleted",
            {
                "taskId": str(task.id),
                "columnId": str(task.columnId)
            }
        )
    )

    # Delete task
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
    
    - **userId**: User ID to assign
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    # Verify access
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    # Check if user is already assigned
    if assignee_data.userId in task.assignees:
        raise ValidationError("User is already assigned to this task")
    
    # Verify assignee exists and has access
    assignee = await Users.get(assignee_data.userId)
    if not assignee:
        raise NotFoundError("User not found")
    
    if not check_workspace_access(assignee, workspace):
        raise ValidationError("User doesn't have access to this workspace")
    
    # Add assignee
    task.assignees.append(assignee_data.userId)
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    # Log activity
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

    # OPTIONAL: broadcast task_updated because assignees changed
    asyncio.create_task(
        ws_manager.broadcast_to_workspace(
            str(workspace.id),
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
    
    # Verify access
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    # Check if user is assigned
    if user_id not in task.assignees:
        raise ValidationError("User is not assigned to this task")
    
    # Remove assignee
    task.assignees.remove(user_id)
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    # Log activity
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

    # OPTIONAL: broadcast task_updated because assignees changed
    asyncio.create_task(
        ws_manager.broadcast_to_workspace(
            str(workspace.id),
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
    
    - **labelId**: Label ID to add
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    # Verify access
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces, Labels
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    # Verify label exists and belongs to project
    label = await Labels.get(label_data.labelId)
    if not label:
        raise NotFoundError("Label not found")
    
    if label.projectId != task.projectId:
        raise ValidationError("Label doesn't belong to this project")
    
    # Check if label is already added
    if label_data.labelId in task.labels:
        raise ValidationError("Label is already added to this task")
    
    # Add label
    task.labels.append(label_data.labelId)
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    # Log activity
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

    # OPTIONAL: broadcast task_updated because labels changed
    asyncio.create_task(
        ws_manager.broadcast_to_workspace(
            str(workspace.id),
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
    
    - **content**: Comment content
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    # Verify access
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    # Create comment
    new_comment = Comments(
        taskId=task_id,
        userId=current_user.id,
        content=comment_data.content
    )
    
    await new_comment.insert()
    
    # Log activity
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

    # REALTIME BROADCAST: server:comment_added
    asyncio.create_task(
        ws_manager.broadcast_to_workspace(
            str(workspace.id),
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
    
    - **text**: Checklist item text
    - **checked**: Initial checked state (default: false)
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    # Verify access
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    # Create checklist item
    new_item = ChecklistItem(
        text=item_data.text,
        checked=item_data.checked or False
    )
    
    # Add to task's checklists
    task.checklists.append(new_item)
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    # Log activity
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="added checklist item",
        details={"item_text": item_data.text}
    )
    await activity.insert()
    
    # Return the newly created item (last item in the list)
    item_response = ChecklistItemResponse(
        text=new_item.text,
        checked=new_item.checked
    )

     # OPTIONAL: broadcast task_updated because checklist changed
    asyncio.create_task(
        ws_manager.broadcast_to_workspace(
            str(workspace.id),
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
    description="Update a checklist item (text or checked status)"
)
async def update_checklist_item(
    task_id: UUID,
    item_index: int,
    item_data: ChecklistItemUpdate,
    current_user: Annotated[Users, Depends(get_current_user)]
):
    """
    Update a checklist item
    
    - **item_index**: Index of the item in the checklist (0-based)
    - **text**: New text (optional)
    - **checked**: New checked status (optional)
    """
    task = await Tasks.get(task_id)
    if not task:
        raise NotFoundError(f"Task with ID {task_id} not found")
    
    # Verify access
    project = await Projects.get(task.projectId)
    if not project:
        raise NotFoundError("Project not found")
    
    from mongo.schemas import Workspaces
    workspace = await Workspaces.get(project.workspaceId)
    if not workspace or not check_workspace_access(current_user, workspace):
        raise PermissionDeniedError("You don't have access to this task")
    
    # Check if item exists
    if item_index < 0 or item_index >= len(task.checklists):
        raise NotFoundError("Checklist item not found")
    
    # Update item
    if item_data.text is not None:
        task.checklists[item_index].text = item_data.text
    if item_data.checked is not None:
        task.checklists[item_index].checked = item_data.checked
    
    task.updatedAt = datetime.now(timezone.utc)
    await task.save()
    
    # Log activity
    activity = Activities(
        projectId=task.projectId,
        taskId=task.id,
        userId=current_user.id,
        action="updated checklist item",
        details={
            "item_index": item_index,
            "changes": item_data.model_dump(exclude_unset=True)
        }
    )
    await activity.insert()
    #Build response
    item_response = ChecklistItemResponse(
        text=task.checklists[item_index].text,
        checked=task.checklists[item_index].checked
    )

    # OPTIONAL: broadcast task_updated because checklist changed
    asyncio.create_task(
        ws_manager.broadcast_to_workspace(
            str(workspace.id),
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




# ==================== MODULE 6: MY TASKS API ====================

@router.get(
    "/me/tasks",
    response_model=List[TaskResponse],
    summary="Get my tasks",
    description="Get all tasks assigned to current user with filtering options"
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
    
    Supports filtering by:
    - **project_id**: Show only tasks from a specific project
    - **label_id**: Show only tasks with a specific label
    - **overdue**: Show only overdue tasks
    - **this_week**: Show only tasks due this week
    """
    # Base query: all tasks assigned to current user
    query_conditions = [Tasks.assignees == current_user.id]
    
    # Apply filters
    if project_id:
        query_conditions.append(Tasks.projectId == project_id)
    
    if label_id:
        query_conditions.append(Tasks.labels == label_id)
    
    # Build query
    if len(query_conditions) == 1:
        tasks = await Tasks.find(query_conditions[0]).to_list()
    else:
        # Combine multiple conditions
        tasks = await Tasks.find(*query_conditions).to_list()
    
    # Apply date filters (post-query filtering)
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
    
    # Convert to response models
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
    
    # Sort by due date (overdue first, then by date)
    task_responses.sort(
        key=lambda t: (
            t.dueDate if t.dueDate else datetime.max.replace(tzinfo=timezone.utc),
            t.createdAt
        )
    )
    
    return task_responses