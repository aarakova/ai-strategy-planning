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

app.include_router(auth.router)
app.include_router(contexts.router)
app.include_router(home.router)
app.include_router(context.router)
app.include_router(analysis.router)
app.include_router(goals.router)
app.include_router(alternatives.router)
app.include_router(plan.router)
