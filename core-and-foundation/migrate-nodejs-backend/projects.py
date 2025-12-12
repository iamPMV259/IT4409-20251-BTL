from datetime import datetime
from typing import Optional

import aiohttp
from pydantic import BaseModel, field_validator

from configs import get_logger, nodejs_backend_config
from hooks.http_errors import (
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    NotFoundError,
)
from utils import base64_to_uuid

logger = get_logger("nodejs-backend-projects")




# class ProjectGetResponse(BaseModel):
#     success: bool


# async def get_project(project_id: str, token: str) -> ProjectGetResponse:
#     url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/projects/{project_id}"
#     headers = {
#         "accept": "*/*",
#         "Authorization": f"Bearer {token}",
#     }
#     async with aiohttp.ClientSession() as session:
#         async with session.get(url, headers=headers) as response:
#             if response.status == 200:
#                 data = await response.json()
#                 logger.info(f"Project {project_id} retrieved successfully.")
#                 return ProjectGetResponse.model_validate(data)
#             elif response.status == 401:
#                 logger.error("Authentication failed while retrieving project.")
#                 raise AuthenticationError("Invalid or expired token.")
#             elif response.status == 404:
#                 logger.error(f"Project {project_id} not found.")
#                 raise NotFoundError(f"Project with ID {project_id} not found.")
#             else:
#                 error_message = await response.text()
#                 logger.error(f"Failed to retrieve project: {error_message}")
#                 raise InternalServerError(f"Retrieval failed with status {response.status}: {error_message}")
