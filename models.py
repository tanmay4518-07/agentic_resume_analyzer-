from pydantic import BaseModel
from typing import List

class ResumeInput(BaseModel):
    job_description: str
    resume_text: str

class AgentState(BaseModel):
    job_description: str
    resume_text: str
    extracted_skills: List[str] = []
    calculated_experience_years: float = 0.0
    rag_context: str = ""
    final_score: int = 0