import aiohttp
from pydantic import BaseModel

from configs import get_logger, nodejs_backend_config
from hooks.http_errors import (
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    NotFoundError,
)

logger = get_logger("nodejs-backend-columns")


class ColumnUpdateRequest(BaseModel):
    name: str | None
    order: int | None




async def update_column(column_id: str, update_data: ColumnUpdateRequest, token: str):
    url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/columns/{column_id}"
    headers = {
        "accept": "*/*",
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = update_data.model_dump()

    async with aiohttp.ClientSession() as session:
        async with session.patch(url, json=payload, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                logger.info(f"Column {column_id} updated successfully.")
                return data
            elif response.status == 401:
                logger.error("Authentication failed while updating column.")
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                logger.error(f"Column {column_id} not found.")
                raise NotFoundError(f"Column with ID {column_id} not found.")
            elif response.status == 400:
                error_message = await response.text()
                logger.error(f"Failed to update column: {error_message}")
                raise BadRequestError(f"Update failed with status {response.status}: {error_message}")
            else:
                error_message = await response.text()
                logger.error(f"Failed to update column: {error_message}")
                raise InternalServerError(f"Update failed with status {response.status}: {error_message}")

async def delete_column(column_id: str, token: str):
    url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/columns/{column_id}"
    headers = {
        "accept": "*/*",
        "Authorization": f"Bearer {token}",
    }

    async with aiohttp.ClientSession() as session:
        async with session.delete(url, headers=headers) as response:
            if response.status in [204, 200]:
                logger.info(f"Column {column_id} deleted successfully.")
                return
            elif response.status == 401:
                logger.error("Authentication failed while deleting column.")
                raise AuthenticationError("Invalid or expired token.")
            elif response.status == 404:
                logger.error(f"Column {column_id} not found.")
                raise NotFoundError(f"Column with ID {column_id} not found.")
            elif response.status == 400:
                error_message = await response.text()
                logger.error(f"Failed to delete column: {error_message}")
                raise BadRequestError(f"Delete failed with status {response.status}: {error_message}")
            else:
                error_message = await response.text()
                logger.error(f"Failed to delete column: {error_message}")
                raise InternalServerError(f"Delete failed with status {response.status}: {error_message}")