import os
import shutil
import uuid
from datetime import datetime

from database import Base, Paper, SessionLocal, engine  # Will define in database.py
from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from langchain.chains import create_retrieval_chain

# LangChain imports
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.output_parsers import JsonOutputParser  # For parsing LLM output
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama, OllamaEmbeddings
from models import Definitions
from sqlalchemy.orm import Session

# from auth import get_current_user # Will define in auth.py (Phase 4)

app = FastAPI()

# CORS configuration - IMPORTANT for Next.js communication
origins = [
    "http://localhost:3000",  # Next.js frontend
    # Add production frontend URL here later
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create tables
Base.metadata.create_all(bind=engine)

# Ollama LLM and Embeddings setup
# Make sure Ollama server is running at http://localhost:11434
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "llama3")  # Or mistral, gemma:2b, etc.
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

llm = ChatOllama(model=OLLAMA_LLM_MODEL, base_url=OLLAMA_BASE_URL)
embeddings = OllamaEmbeddings(model=OLLAMA_EMBED_MODEL, base_url=OLLAMA_BASE_URL)

# Directory to save uploaded files temporarily
UPLOAD_DIR = "uploaded_papers"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ChromaDB persistent directory (relative to backend/ directory)
CHROMADB_PERSIST_DIR = "chroma_data"
os.makedirs(CHROMADB_PERSIST_DIR, exist_ok=True)
CHROMADB_COLLECTION_NAME = "academic_papers_collection"


# --- Background Task for PDF Processing ---
def process_pdf_in_background(paper_id: str, file_path: str, db: Session):
    try:
        # 1. Load PDF
        loader = PyPDFLoader(file_path)
        documents = loader.load()

        # 2. Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
        )
        chunks = text_splitter.split_documents(documents)

        # 3. Store embeddings in ChromaDB
        # Create a collection specific to the paper_id for better organization
        # Note: ChromaDB doesn't natively support namespaces per paper_id in a single instance
        # We'll use paper_id as part of the collection name.
        # For a single-user local app, using a shared collection is often simpler,
        # but for future multi-user, unique collection names or metadata filtering are key.
        # For now, let's just add to a general collection and use metadata filters for retrieval.

        # Add paper_id to each chunk's metadata
        for i, chunk in enumerate(chunks):
            chunk.metadata["paper_id"] = str(paper_id)
            chunk.metadata["chunk_id"] = i  # Useful for debugging/ordering

        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=CHROMADB_PERSIST_DIR,
            collection_name="academic_papers_collection",  # General collection
        )
        # No need to call vectorstore.persist() as persistence is automatic

        # 4. Update Paper status in PostgreSQL
        db_paper = db.query(Paper).filter(Paper.id == paper_id).first()
        if db_paper:
            db_paper.status = "processed"
            db.commit()
            db.refresh(db_paper)

    except Exception as e:
        print(f"Error processing PDF {paper_id}: {e}")
        db_paper = db.query(Paper).filter(Paper.id == paper_id).first()
        if db_paper:
            db_paper.status = "failed"
            db.commit()
            db.refresh(db_paper)
    finally:
        # Clean up the temporary file
        if os.path.exists(file_path):
            os.remove(file_path)


# --- API Endpoints ---


@app.get("/")
async def read_root():
    return {"message": "Academic Insight Assistant Backend is running!"}


@app.post("/upload-paper/")
async def upload_paper(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
):
    if not file or not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    file_id = str(uuid.uuid4())
    file_location = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")

    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)

        # Save initial paper record to PostgreSQL
        new_paper = Paper(
            id=file_id,
            filename=file.filename,
            upload_date=datetime.now(),
            status="pending",
        )
        db.add(new_paper)
        db.commit()
        db.refresh(new_paper)

        # Start background processing
        background_tasks.add_task(process_pdf_in_background, file_id, file_location, db)

        return JSONResponse(
            content={
                "message": "File uploaded and processing started.",
                "paper_id": file_id,
            },
            status_code=status.HTTP_202_ACCEPTED,
        )
    except Exception as e:
        print(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {e}")


@app.get("/papers/{paper_id}")
async def get_paper_details(paper_id: str, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


@app.get("/papers")
async def get_all_papers(db: Session = Depends(get_db)):
    papers = db.query(Paper).order_by(Paper.upload_date.desc()).all()
    return JSONResponse(content=[paper.to_dict() for paper in papers])


# --- Feature Endpoints ---
@app.post("/papers/{paper_id}/summarize")
async def summarize_paper(paper_id: str, db: Session = Depends(get_db)):
    db_paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not db_paper or db_paper.status != "processed":
        raise HTTPException(
            status_code=404, detail="Paper not found or not processed yet."
        )
    if db_paper.summary:  # Avoid re-generating if already exists
        return {"summary": db_paper.summary}
    try:
        vectorstore = Chroma(
            embedding_function=embeddings,
            persist_directory=CHROMADB_PERSIST_DIR,
            collection_name=CHROMADB_COLLECTION_NAME,
        )
        # Filter retriever to get chunks only from this specific paper
        retriever = vectorstore.as_retriever(
            search_kwargs={"filter": {"paper_id": paper_id}}
        )

        summarization_prompt_template = """You are an expert academic assistant.
        Based on the following text from an academic paper, provide a comprehensive and concise summary.
        Focus on the main arguments, methodologies, key findings, and conclusions.
        Ensure the summary is well-structured and easy to understand. Generate summary in 50 words.

        Context:
        {context}

        Summary:
        """
        summarization_prompt = ChatPromptTemplate.from_template(
            summarization_prompt_template
        )

        combine_docs_chain = create_stuff_documents_chain(llm, summarization_prompt)
        retrieval_chain = create_retrieval_chain(retriever, combine_docs_chain)

        # The input to the retrieval chain is a query, even if the primary purpose is summarization.
        # The retriever uses the filter to get relevant docs, and the prompt uses them as context.
        response = retrieval_chain.invoke(
            {"input": f"Summarize the academic paper titled '{db_paper.filename}'."}
        )
        generated_summary = response["answer"]

        # Update PostgreSQL with the summary
        db_paper.summary = generated_summary
        db.commit()
        db.refresh(db_paper)

        return {"summary": generated_summary}
    except Exception as e:
        print(f"Error generating summary for {paper_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {e}")


@app.post("/papers/{paper_id}/extract-definitions")
async def extract_definitions(paper_id: str, db: Session = Depends(get_db)):
    db_paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not db_paper or db_paper.status != "processed":
        raise HTTPException(
            status_code=404, detail="Paper not found or not processed yet."
        )
    if db_paper.extracted_definitions:  # Avoid re-generating if already exists
        return {"extracted_definitions": db_paper.extracted_definitions}

    try:
        vectorstore = Chroma(
            embedding_function=embeddings,
            persist_directory=CHROMADB_PERSIST_DIR,
            collection_name=CHROMADB_COLLECTION_NAME,
        )
        retriever = vectorstore.as_retriever(
            search_kwargs={"filter": {"paper_id": paper_id}}
        )

        parser = JsonOutputParser(
            pydantic_object=Definitions
        )  # Use PydanticOutputParser for strict schema

        definition_prompt_template = """You are an expert in academic text analysis.
        From the following academic paper content, identify 5-10 most important key terms or concepts.
        For each term, provide a concise and clear definition as it pertains to the context of the paper.
        Output the results as a JSON array of objects, where each object has a 'term' and 'definition' field.

        Format Instructions:
        {format_instructions}

        Context:
        {context}

        Extracted Definitions:
        """
        definition_prompt = ChatPromptTemplate.from_template(
            definition_prompt_template
        ).partial(format_instructions=parser.get_format_instructions())

        combine_docs_chain = create_stuff_documents_chain(llm, definition_prompt)
        retrieval_chain = create_retrieval_chain(retriever, combine_docs_chain)

        response = retrieval_chain.invoke(
            {"input": f"Extract key terms and definitions from '{db_paper.filename}'."}
        )
        # Parse the string output from the LLM into a Python dictionary/list
        # The parser returns the parsed object directly
        parsed_definitions = parser.parse(response["answer"])

        # Update PostgreSQL with the definitions
        db_paper.extracted_definitions = parsed_definitions[
            "definitions"
        ]  # Store just the list
        db.commit()
        db.refresh(db_paper)

        return {"extracted_definitions": db_paper.extracted_definitions}
    except Exception as e:
        print(f"Error extracting definitions for {paper_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to extract definitions: {e}"
        )


@app.post("/papers/{paper_id}/generate-questions")
async def generate_questions(paper_id: str, db: Session = Depends(get_db)):
    db_paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not db_paper or db_paper.status != "processed":
        raise HTTPException(
            status_code=404, detail="Paper not found or not processed yet."
        )
    if db_paper.generated_questions:  # Avoid re-generating if already exists
        return {"generated_questions": db_paper.generated_questions}

    try:
        vectorstore = Chroma(
            embedding_function=embeddings,
            persist_directory=CHROMADB_PERSIST_DIR,
            collection_name=CHROMADB_COLLECTION_NAME,
        )
        retriever = vectorstore.as_retriever(
            search_kwargs={"filter": {"paper_id": paper_id}}
        )

        parser = JsonOutputParser(pydantic_object=Questions)

        question_prompt_template = """You are an academic testing assistant.
        Based on the following academic paper content, generate 3-5 diverse practice questions.
        Include a mix of multiple-choice and short-answer questions.
        For multiple-choice questions, provide 4 distinct options and clearly indicate the correct answer.
        For short-answer questions, provide the correct answer.
        Output the results as a JSON array of objects. Each object should have:
        - 'question': The question text.
        - 'type': 'multiple_choice' or 'short_answer'.
        - 'options': A list of strings for multiple-choice options (empty list for short-answer).
        - 'correct_answer': The correct answer string.

        Format Instructions:
        {format_instructions}

        Context:
        {context}

        Generated Questions:
        """
        question_prompt = ChatPromptTemplate.from_template(
            question_prompt_template
        ).partial(format_instructions=parser.get_format_instructions())

        combine_docs_chain = create_stuff_documents_chain(llm, question_prompt)
        retrieval_chain = create_retrieval_chain(retriever, combine_docs_chain)

        response = retrieval_chain.invoke(
            {"input": f"Generate practice questions from '{db_paper.filename}'."}
        )

        parsed_questions = parser.parse(response["answer"])

        # Update PostgreSQL with the questions
        db_paper.generated_questions = parsed_questions[
            "questions"
        ]  # Store just the list
        db.commit()
        db.refresh(db_paper)

        return {"generated_questions": db_paper.generated_questions}
    except Exception as e:
        print(f"Error generating questions for {paper_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate questions: {e}"
        )
