from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response, status
from jose import jwt
from passlib.context import CryptContext

from ..config import settings
from ..database import get_db
from ..dependencies import get_current_user
from ..models.auth import AuthRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.jwt_secret, algorithm="HS256")


def _set_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
async def register(body: AuthRequest, response: Response):
    db = get_db()
    if await db.users.find_one({"login": body.login}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Логин уже занят")
    result = await db.users.insert_one({"login": body.login, "hashed_password": _pwd.hash(body.password)})
    _set_cookie(response, _create_token(str(result.inserted_id)))
    return UserResponse(id=str(result.inserted_id), login=body.login)


@router.post("/login", response_model=UserResponse)
async def login(body: AuthRequest, response: Response):
    db = get_db()
    user = await db.users.find_one({"login": body.login})
    if not user or not _pwd.verify(body.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль")
    _set_cookie(response, _create_token(str(user["_id"])))
    return UserResponse(id=str(user["_id"]), login=user["login"])


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    response.delete_cookie("access_token")


@router.get("/me", response_model=UserResponse)
async def me(user_id: str = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Не авторизован")
    return UserResponse(id=str(user["_id"]), login=user["login"])
