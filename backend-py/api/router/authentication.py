

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from api.dependencies import get_current_user
from configs import nodejs_backend_config
from core.security import (
    create_access_token,
    get_password_hash,
    validate_password_strength,
    verify_password,
)
from hooks.http_errors import AuthenticationError, ConflictError, ValidationError
from mongo.schemas import Users
from utils.auth_models import Token, UserLogin, UserRegister
from utils.user_models import UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])\


@router.post(
    path="/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with email and password"
)
async def register(user_data: UserRegister) -> UserResponse:
    """
    Register a new user
    
    - **name**: User's full name
    - **email**: User's email address (must be unique)
    - **password**: User's password (min 8 characters)
    
    Returns the created user information (without password)
    """
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise ValidationError(error_msg)
    
    existing_user = await Users.find_one(Users.email == user_data.email)
    if existing_user:
        raise ConflictError("Email already registered")
    
    password_hash = get_password_hash(user_data.password)
    
    new_user = Users(
        name=user_data.name,
        email=user_data.email,
        passwordHash=password_hash
    )
    
    await new_user.insert()
    
    return UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        avatarUrl=new_user.avatarUrl,
        createdAt=new_user.createdAt,
        updatedAt=new_user.updatedAt
    )

@router.post(
    path="/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Authenticate user and return JWT token"
)
async def login(credentials: UserLogin)  -> Token:
    """
    Login with email and password
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns a JWT access token for authentication
    """
    user = await Users.find_one(Users.email == credentials.email)
    if not user:
        raise AuthenticationError("Incorrect email or password")
    
    if not verify_password(credentials.password, user.passwordHash):
        raise AuthenticationError("Incorrect email or password")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        token_type="bearer"
    )

@router.get(
    path="/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get information about the currently authenticated user",
    dependencies=[Depends(get_current_user)]
)
async def get_me(current_user: Annotated[Users, Depends(get_current_user)]) -> UserResponse:
    """
    Get current user profile
    
    Requires authentication via Bearer token in Authorization header
    
    Returns the current user's information
    """
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        avatarUrl=current_user.avatarUrl,
        createdAt=current_user.createdAt,
        updatedAt=current_user.updatedAt
    )