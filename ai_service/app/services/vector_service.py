import os
from supabase import create_client, Client
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class SupabaseVectorClient:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not self.url or not self.key:
            raise ValueError("Supabase credentials not found in environment variables")
        self.client: Client = create_client(self.url, self.key)
        self.openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def create_embedding(self, text: str):
        response = self.openai.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding

    def store_document(self, content: str, metadata: dict):
        embedding = self.create_embedding(content)
        data = {
            "content": content,
            "metadata": metadata,
            "embedding": embedding
        }
        return self.client.table("documents").insert(data).execute()

    def search_similar(self, query: str, limit: int = 5):
        query_embedding = self.create_embedding(query)
        # Using RPC for similarity search in Supabase
        # You'll need to define this function in Supabase SQL
        params = {
            "query_embedding": query_embedding,
            "match_threshold": 0.5,
            "match_count": limit,
        }
        return self.client.rpc("match_documents", params).execute()

vector_client = SupabaseVectorClient()
