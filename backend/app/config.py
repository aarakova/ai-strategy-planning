from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mongo_url: str = "mongodb://admin:secret@localhost:27017/ai_strategy?authSource=admin"
    mongo_db: str = "ai_strategy"
    jwt_secret: str = "change-me"
    jwt_expire_minutes: int = 1440
    openrouter_api_key: str = ""
    openrouter_model: str = "deepseek/deepseek-v4-flash:free"
    cors_origins: str = "http://localhost:3000"


settings = Settings()
