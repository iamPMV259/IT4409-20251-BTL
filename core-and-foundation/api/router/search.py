from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel

from api.dependencies import get_current_user
from mongo.schemas import Columns, Labels, Projects, Tasks, Users

router = APIRouter(prefix="/search", tags=["Search"])



from datetime import datetime


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

# class TeamWorkTasks(BaseModel):
#     userId: str
#     userName: str
#     tasksAssigned: int

# class Assignees(BaseModel):
#     userId: str
#     userName: str

# class TaskData(BaseModel):
#     taskId: str
#     taskTitle: str
#     dueDate: datetime
#     assignees: list[Assignees]
#     labels: list[LabelData]
    

# class ProjectDashboardResponse(BaseModel):
#     totalTasks: int
#     inProgressTasks: int
#     doneTasks: int
#     overdueTasks: int
#     reviewTasks: int
#     toDoTasks: int
#     teamWorkload: list[TeamWorkTasks]
#     overdueTasksDetails: list[TaskData]
#     upcomingDeadlines7d: list[TaskData]

# @router.get(
#     path="/projects/dashboard",
#     response_model=ProjectDashboardResponse,
#     status_code=status.HTTP_200_OK,
#     summary="Get project dashboard data",
#     description="Get aggregated dashboard data for projects the current user is a member of"    
# )
# async def get_project_dashboard(project_id: str,current_user: Annotated[Users, Depends(get_current_user)]):
#     r"""
#     **Get project dashboard data**
#     **Args:**
#         - `project_id`: The ID of the project
#     """
#     project = await Projects.find_one(Projects.id == UUID(project_id))
#     if project:
#         tasks = await Tasks.find(Tasks.projectId == project.id).to_list()
#         total_tasks = len(tasks)
#         in_progress_tasks = 0
#         done_tasks = 0
#         overdue_tasks = 0
#         review_tasks = 0
#         to_do_tasks = 0
#         team_workload_dict: dict[str, int] = {}
#         overdue_tasks_details: list[TaskData] = []
#         upcoming_deadlines_7d: list[TaskData] = []


#         for task in tasks:
#             label: list[LabelData] = []
#             for label_id in task.labels:
#                 label_obj = await Labels.find_one(Labels.id == label_id)
#                 if label_obj:
#                     label.append(LabelData(labelId=str(label_obj.id), text=label_obj.text))

#             column = await Columns.find_one(Columns.id == task.columnId)
#             if column.title == "In Progress":
#                 in_progress_tasks += 1
#             elif column.title == "Done":
#                 done_tasks += 1
#             elif column.title == "Review":
#                 review_tasks += 1
#             elif column.title == "To Do":
#                 to_do_tasks += 1

#             if task.dueDate and task.dueDate < datetime.utcnow():
#                 overdue_tasks += 1
#                 assignees_list: list[Assignees] = []
#                 for assignee_id in task.assignees:
#                     user = await Users.find_one(Users.id == assignee_id)
#                     if user:
#                         assignees_list.append(Assignees(userId=str(user.id), userName=user.name))
#                 overdue_tasks_details.append(
#                     TaskData(
#                         taskId=str(task.id),
#                         taskTitle=task.title,
#                         dueDate=task.dueDate,
#                         assignees=assignees_list,
#                         labels=label
#                     )
#                 )

#             if task.dueDate and 0 <= (task.dueDate - datetime.utcnow()).days <= 7:
#                 assignees_list: list[Assignees] = []
#                 for assignee_id in task.assignees:
#                     user = await Users.find_one(Users.id == assignee_id)
#                     if user:
#                         assignees_list.append(Assignees(userId=str(user.id), userName=user.name))
#                 upcoming_deadlines_7d.append(
#                     TaskData(
#                         taskId=str(task.id),
#                         taskTitle=task.title,
#                         dueDate=task.dueDate,
#                         assignees=assignees_list,
#                         labels=label
#                     )
#                 )

#             for assignee_id in task.assignees:
#                 team_workload_dict[str(assignee_id)] = team_workload_dict.get(str(assignee_id), 0) + 1

#         team_workload: list[TeamWorkTasks] = []
#         for user_id, task_count in team_workload_dict.items():
#             user = await Users.find_one(Users.id == UUID(user_id))
#             if user:
#                 team_workload.append(
#                     TeamWorkTasks(
#                         userId=user_id,
#                         userName=user.name,
#                         tasksAssigned=task_count
#                     )
#                 )

#         return ProjectDashboardResponse(
#             totalTasks=total_tasks,
#             inProgressTasks=in_progress_tasks,
#             doneTasks=done_tasks,
#             overdueTasks=overdue_tasks,
#             reviewTasks=review_tasks,
#             toDoTasks=to_do_tasks,
#             teamWorkload=team_workload,
#             overdueTasksDetails=overdue_tasks_details,
#             upcomingDeadlines7d=upcoming_deadlines_7d
#         )

