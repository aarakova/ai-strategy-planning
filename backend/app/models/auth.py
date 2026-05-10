from pydantic import BaseModel, Field


class AuthRequest(BaseModel):
    login: str
    password: str = Field(min_length=8)


class UserResponse(BaseModel):
    id: str
    login: str
