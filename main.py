from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import ResumeInput
from graph import app_graph

app = FastAPI(title="Agentic Resume Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all domains (you can restrict this to your exact Vercel URL later for security)
    allow_credentials=True,
    allow_methods=["*"], # Allows all HTTP methods (POST, GET, etc.)
    allow_headers=["*"], # Allows all headers
)




@app.post("/analyze")
async def analyze_resume(payload: ResumeInput):
    # Initialize the starting state
    initial_state = {
        "job_description": payload.job_description,
        "resume_text": payload.resume_text,
        "rag_context": "",
        "calculated_experience_years": 0.0,
        "final_score": 0
    }

    # Execute the LangGraph multi-agent loop
    final_state = app_graph.invoke(initial_state)

    return {
        "score": final_state["final_score"],
        "verified_years": final_state["calculated_experience_years"]
    }