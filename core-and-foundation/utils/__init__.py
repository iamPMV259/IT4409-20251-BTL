from .hasher import HashFunction

hasher = HashFunction()

import base64
import uuid


def base64_to_uuid(b64_str: str) -> uuid.UUID:
    uuid_bytes = base64.b64decode(b64_str)
    
    return uuid.UUID(bytes=uuid_bytes)