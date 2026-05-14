from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongo_url: str = "mongodb://admin:secret@localhost:27017/ai_strategy?authSource=admin"
    mongo_db: str = "ai_strategy"
    jwt_secret: str = "change-me"
    jwt_expire_minutes: int = 1440
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o-mini"
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
