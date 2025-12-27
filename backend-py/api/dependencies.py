from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.security import get_user_id_from_token
from hooks.http_errors import AuthenticationError, NotFoundError
from mongo.schemas import Users, Workspaces

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Users:
    """
    Dependency to get the current authenticated user from JWT token
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        Current Users document
        
    Raises:
        AuthenticationError: If token is invalid or user not found
    """
    token = credentials.credentials
    
    # Extract user ID from token
    user_id = get_user_id_from_token(token)
    if user_id is None:
        raise AuthenticationError("Invalid authentication token")
    
    # Fetch user from database
    user = await Users.get(user_id)
    if user is None:
        raise AuthenticationError("Users not found")
    
    return user


async def get_current_active_user(
    current_user: Users = Depends(get_current_user)
) -> Users:
    """
    Dependency to get current active user (can be extended with is_active check)
    
    Args:
        current_user: Current user from get_current_user dependency
        
    Returns:
        Current Users document
    """
    
    
    return current_user


async def get_workspace_by_id(workspace_id: UUID) -> Workspaces:
    """
    Dependency to get a workspace by ID
    
    Args:
        workspace_id: Workspace UUID
        
    Returns:
        Workspace document
        
    Raises:
        NotFoundError: If workspace not found
    """
    workspace = await Workspaces.get(workspace_id)
    if workspace is None:
        raise NotFoundError(f"Workspaces with ID {workspace_id} not found")
    
    return workspace

def check_workspace_access(user: Users, workspace: Workspaces) -> bool:
    """
    Check if user has access to workspace
    
    Args:
        user: User document
        workspace: Workspace document
        
    Returns:
        True if user has access, False otherwise
    """
    # Check if user is owner
    if workspace.ownerId == user.id:
        return True
    
    # Check if user is a member
    for member in workspace.members:
        if member.userId == user.id:
            return True
    
    return False

def check_workspace_admin(user: Users, workspace: Workspaces) -> bool:
    """
    Check if user is admin or owner of workspace
    
    Args:
        user: User document
        workspace: Workspace document
        
    Returns:
        True if user is admin/owner, False otherwise
    """
    # Check if user is owner
    if workspace.ownerId == user.id:
        return True
    
    # Check if user is admin member
    for member in workspace.members:
        if member.userId == user.id and member.role in ["admin", "owner"]:
            return True
    
    return False