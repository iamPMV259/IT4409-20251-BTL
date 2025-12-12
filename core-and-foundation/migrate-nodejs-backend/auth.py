import aiohttp

from configs import get_logger, nodejs_backend_config
from hooks.http_errors import BadRequestError

logger = get_logger("nodejs-backend-auth")




async def login_to_get_token(email: str, password: str) -> str:
    async with aiohttp.ClientSession() as session:
        login_url = f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}/api/v1/auth/login"
        payload = {"email": email, "password": password}

        async with session.post(login_url, json=payload) as response:
            if response.status == 200:
                data = await response.json()
                token = data.get("token")
                logger.info("Login successful.")
                return token
            else:
                error_message = await response.text()
                logger.error(f"Login failed: {error_message}")
                raise BadRequestError(f"Login failed with status {response.status}: {error_message}")