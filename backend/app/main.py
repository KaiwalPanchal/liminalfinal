import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.graph.neo4j_client import neo4j_client
from app.api.query import router as query_router
from app.api.ingest import router as ingest_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("liminal")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Liminal Grounded GraphRAG Backend...")
    neo4j_client.connect()
    yield
    logger.info("Shutting down Liminal Backend...")
    neo4j_client.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Grounded Hybrid GraphRAG Backend with Multi-Edge Action-Goal Networks",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(query_router, prefix=settings.API_V1_STR, tags=["Query"])
app.include_router(ingest_router, prefix=settings.API_V1_STR, tags=["Ingest"])

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint monitoring Neo4j connectivity."""
    neo4j_ok = neo4j_client.is_healthy()
    return {
        "status": "healthy" if neo4j_ok else "degraded",
        "neo4j_connected": neo4j_ok,
        "service": settings.PROJECT_NAME
    }

@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Liminal Grounded Hybrid GraphRAG API is operational",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
