from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt
from bson import ObjectId

from .config import settings
from .database import get_db


def _decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный токен")
        return user_id
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный токен")


async def get_current_user(access_token: str | None = Cookie(default=None)) -> str:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Не авторизован")
    return _decode_token(access_token)


async def get_context_for_user(
    contextId: str,
    user_id: str = Depends(get_current_user),
) -> dict:
    db = get_db()
    try:
        oid = ObjectId(contextId)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Мультипроект не найден")
    ctx = await db.planning_contexts.find_one({"_id": oid, "userId": user_id})
    if not ctx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Мультипроект не найден")
    return ctx
