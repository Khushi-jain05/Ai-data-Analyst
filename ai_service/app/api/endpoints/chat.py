from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.vector_service import vector_client
from openai import OpenAI
import os

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatRequest(BaseModel):
    question: str
    session_id: str = "default"

@router.post("/chat")
async def chat_with_context(request: ChatRequest):
    try:
        # 1. Search for relevant context
        search_results = vector_client.search_similar(request.question)
        context = "\n".join([doc['content'] for doc in search_results.data])

        # 2. Augment prompt
        prompt = f"""
        You are DataNova AI, a helpful analyst. 
        Use the following retrieved context to answer the user's question.
        If the context is not enough, say you don't know but try to be helpful.

        Context:
        {context}

        Question: {request.question}
        """

        # 3. Generate response
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful study notes assistant."},
                {"role": "user", "content": prompt}
            ]
        )

        return {"answer": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
