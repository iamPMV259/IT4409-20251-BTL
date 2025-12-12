from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from api.dependencies import get_current_user
from configs import get_logger
from hooks.http_errors import (
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    NotFoundError,
    PermissionDeniedError,
)
from migrate_nodejs_backend.columns import (
    ColumnResponse,
    ColumnUpdateRequest,
    delete_column,
    update_column,
)
from mongo.schemas import Users

logger = get_logger("columns")



router = APIRouter(
    prefix="/columns",
    tags=["Columns"],
)

@router.patch(path="/{column_id}", 
    response_model=ColumnResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a column",
    description="Update the details of a specific column by its ID"
)
async def api_update_column(
    column_id: str,
    update_data: ColumnUpdateRequest,
    current_user: Annotated[Users, Depends(get_current_user)],
    request: Request,
):
    r"""
    **Update a column by its ID**
    
    **Args:**
        `column_id`: ID of the column to update
        `update_data`: Data to update the column with
        (Requires authentication via Bearer token)
        
    **Returns:**
        `ColumnResponse` indicating success or failure
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    # Login to Node.js backend to get token
    bearer_token = auth_header[len("Bearer "):]
    
    # Call the migrate_nodejs_backend function to update the column
    try:
        return await update_column(column_id=column_id, update_data=update_data, token=bearer_token)
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


@router.delete(path="/{column_id}", 
    response_model=ColumnResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete a column",
    description="Delete a specific column by its ID"
)
async def api_delete_column(
    column_id: str,
    current_user: Annotated[Users, Depends(get_current_user)],
    request: Request,
):
    r"""
    **Delete a column by its ID**
    
    **Args:**
        `column_id`: ID of the column to delete
        (Requires authentication via Bearer token)
        
    **Returns:**
        `ColumnResponse` indicating success or failure
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    # Login to Node.js backend to get token
    bearer_token = auth_header[len("Bearer "):]
    
    # Call the migrate_nodejs_backend function to delete the column
    try:
        return await delete_column(column_id=column_id, token=bearer_token)
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