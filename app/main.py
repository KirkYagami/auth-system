import logging

from beanie import init_beanie
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.models.token import RefreshToken, Token
from app.models.user import User
from app.routers.auth import router as auth_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(
    title=settings.APP_NAME,
    description="Production-ready authentication service with JWT, RBAC, email verification, and 2FA.",
    version="1.0.0",
)


@app.on_event("startup")
async def startup():
    client = AsyncIOMotorClient(settings.MONGO_URI)
    await init_beanie(
        database=client[settings.DATABASE_NAME],
        document_models=[User, Token, RefreshToken],
    )


app.include_router(auth_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.APP_NAME}
