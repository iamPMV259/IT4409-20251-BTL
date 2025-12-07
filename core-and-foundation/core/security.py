import os
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext

_ = load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")




def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets security requirements
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < os.getenv("MIN_PASSWORD_LENGTH"):
        return False, f"Password must be at least {os.getenv('MIN_PASSWORD_LENGTH')} characters long"

    if os.getenv("REQUIRE_UPPERCASE") and not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"

    if os.getenv("REQUIRE_NUMBER") and not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"

    if os.getenv("REQUIRE_SPECIAL_CHAR"):
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in password):
            return False, "Password must contain at least one special character"
    
    return True, ""




def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Data to encode in the token (usually user_id)
        expires_delta: Token expiration time (default: from settings)
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(claims=to_encode, key=os.getenv("SECRET_KEY"), algorithm=os.getenv("ALGORITHM"))

    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any] | None:
    """
    Decode and verify a JWT access token
    
    Args:
        token: JWT token to decode
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token, 
            key=os.getenv("SECRET_KEY"), 
            algorithms=[os.getenv("ALGORITHM")]
        )
        return payload
    except JWTError:
        return None


def get_user_id_from_token(token: str) -> UUID | None:
    """
    Extract user ID from JWT token
    
    Args:
        token: JWT token
        
    Returns:
        User UUID or None if invalid
    """
    payload = decode_access_token(token)
    if payload is None:
        return None
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        return None
    
    try:
        return UUID(user_id_str)
    except ValueError:
        return None
