from pydantic import BaseModel


class NodeJSBackendConfig(BaseModel):
    host: str
    port: str | None
    domain: str | None