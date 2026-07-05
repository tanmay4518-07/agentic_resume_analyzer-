from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

# Use a free, local embedding model
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


def build_and_query_knowledge_base(job_description: str, resume_text: str) -> str:
    # In a real app, you would chunk the resume. For now, we embed the JD.
    doc = Document(page_content=job_description)
    vector_db = FAISS.from_documents([doc], embeddings)

    # Retrieve the most relevant requirements matching the resume
    docs = vector_db.similarity_search(resume_text, k=2)
    return "\n".join([d.page_content for d in docs])