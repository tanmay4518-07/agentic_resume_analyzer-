import os
from typing import TypedDict
from langgraph.graph import StateGraph, END
from datetime import datetime
from rag import build_and_query_knowledge_base
from langchain_openai import ChatOpenAI  # Change this import if you use Groq/Gemini

# Initialize your AI Agent (Make sure your OPENAI_API_KEY is saved in Hugging Face settings!)
llm = ChatOpenAI(temperature=0, model="gpt-4o-mini")


class GraphState(TypedDict):
    job_description: str
    resume_text: str
    rag_context: str
    calculated_experience_years: float
    final_score: int


def retrieve_context(state: GraphState):
    context = build_and_query_knowledge_base(state["job_description"], state["resume_text"])
    return {"rag_context": context}


def calculate_experience(state: GraphState):
    resume = state["resume_text"]

    # 1. Ask the AI to strictly extract the dates
    prompt = f"Find the absolute earliest start date and the latest end date in this resume text. If currently employed, use today's date. Return strictly in this format and nothing else: YYYY-MM-DD,YYYY-MM-DD. Resume: {resume}"

    try:
        # Get the AI response and split the two dates
        dates = llm.invoke(prompt).content.strip().split(',')
        dynamic_start = dates[0].strip()
        dynamic_end = dates[1].strip()

        # 2. Execute proper first-principles math validation on the AI's dates
        raw_start = datetime.strptime(dynamic_start, "%Y-%m-%d")
        raw_end = datetime.strptime(dynamic_end, "%Y-%m-%d")

        delta = raw_end - raw_start
        exact_years = round(delta.days / 365.25, 2)

    except Exception as e:
        print(f"Extraction Error: {e}")
        exact_years = 0.0  # Fallback if the resume has no dates

    return {"calculated_experience_years": exact_years}


def evaluate_candidate(state: GraphState):
    context = state["rag_context"]
    jd = state["job_description"]

    # 1. Ask the AI for the final deterministic score
    prompt = f"Evaluate this candidate context: {context} against this job description: {jd}. Calculate a strict match percentage from 0 to 100. Return ONLY the integer number, no other text."

    try:
        # Convert the AI's text response directly into a number
        ai_score = int(llm.invoke(prompt).content.strip())
    except Exception as e:
        print(f"Scoring Error: {e}")
        ai_score = 0  # Fallback if the AI returns weird text

    return {"final_score": ai_score}


# Build and Compile the Graph
workflow = StateGraph(GraphState)

workflow.add_node("retrieve", retrieve_context)
workflow.add_node("math_validation", calculate_experience)
workflow.add_node("evaluate", evaluate_candidate)

workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "math_validation")
workflow.add_edge("math_validation", "evaluate")
workflow.add_edge("evaluate", END)

app_graph = workflow.compile()