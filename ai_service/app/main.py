from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import chat, pdf
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="DataNova AI Microservice", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "AI Microservice Online", "service": "DataNova"}

# Include routers
app.include_router(chat.router, prefix="/api/ai", tags=["Chat"])
app.include_router(pdf.router, prefix="/api/pdf", tags=["PDF"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
