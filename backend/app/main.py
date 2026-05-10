from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import connect, disconnect
from .routers import auth, contexts, home, context, analysis, goals, alternatives, plan


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    await disconnect()


app = FastAPI(
    title="AI Strategy Planning API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_prefix = "/api/v1"
app.include_router(auth.router, prefix=_prefix)
app.include_router(contexts.router, prefix=_prefix)
app.include_router(home.router, prefix=_prefix)
app.include_router(context.router, prefix=_prefix)
app.include_router(analysis.router, prefix=_prefix)
app.include_router(goals.router, prefix=_prefix)
app.include_router(alternatives.router, prefix=_prefix)
app.include_router(plan.router, prefix=_prefix)
