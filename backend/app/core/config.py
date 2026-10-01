import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Liminal Grounded Hybrid GraphRAG"
    API_V1_STR: str = "/api"
    
    # Neo4j Settings
    NEO4J_URI: str = Field(default="bolt://localhost:7687", env="NEO4J_URI")
    NEO4J_USER: str = Field(default="neo4j", env="NEO4J_USER")
    NEO4J_PASSWORD: str = Field(default="liminalpassword", env="NEO4J_PASSWORD")
    
    # AI / Embedding Settings
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    RERANKER_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    LLM_MODEL: str = Field(default="gpt-4o-mini", env="LLM_MODEL")
    OPENAI_API_KEY: str = Field(default="", env="OPENAI_API_KEY")
    COHERE_API_KEY: str = Field(default="", env="COHERE_API_KEY")
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
