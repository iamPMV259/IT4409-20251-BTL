import aiohttp

from configs import get_logger, nodejs_backend_config
from hooks.http_errors import AuthenticationError, BadRequestError, InternalServerError

logger = get_logger("nodejs-backend-auth")

BASE_URL = nodejs_backend_config.domain if len(nodejs_backend_config.domain) > 0 else f"http://{nodejs_backend_config.host}:{nodejs_backend_config.port}"


async def login_to_get_token(email: str, password: str) -> str:
    async with aiohttp.ClientSession() as session:
        login_url = f"{BASE_URL}/api/v1/auth/login"
        payload = {"email": email, "password": password}

        async with session.post(login_url, json=payload) as response:
            if response.status == 200:
                data = await response.json()
                token = data.get("token")
                logger.info("Login successful.")
                return token
            elif response.status == 401:
                error_message = await response.text()
                logger.error(f"Login failed: {error_message}")
                raise AuthenticationError(f"Login failed with status {response.status}: {error_message}")
            elif response.status == 400:
                error_message = await response.text()
                logger.error(f"Bad request during login: {error_message}")
                raise BadRequestError(f"Login failed with status {response.status}: {error_message}")
            else:
                error_message = await response.text()
                logger.error(f"Internal server error during login: {error_message}")
                raise InternalServerError(f"Login failed with status {response.status}: {error_message}")