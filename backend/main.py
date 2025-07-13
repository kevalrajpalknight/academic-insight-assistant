from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import shutil
import uuid
from datetime import datetime

# LangChain imports (will be added more later)
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.chat_models import ChatOllama
from langchain.chains.summarize import load_summarize_chain
from langchain.prompts import PromptTemplate

# Local imports (create these files)
from database import Base, SessionLocal, engine, Paper  # Will define in database.py
# from auth import get_current_user # Will define in auth.py (Phase 4)

app = FastAPI()

# CORS configuration - IMPORTANT for Next.js communication
origins = [
    "http://localhost:3000", # Next.js frontend
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
OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "llama3") # Or mistral, gemma:2b, etc.
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

llm = ChatOllama(model=OLLAMA_LLM_MODEL, base_url=OLLAMA_BASE_URL)
embeddings = OllamaEmbeddings(model=OLLAMA_EMBED_MODEL, base_url=OLLAMA_BASE_URL)

# Directory to save uploaded files temporarily
UPLOAD_DIR = "uploaded_papers"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ChromaDB persistent directory (relative to backend/ directory)
CHROMADB_PERSIST_DIR = "chroma_data"
os.makedirs(CHROMADB_PERSIST_DIR, exist_ok=True)

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
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
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
            chunk.metadata["chunk_id"] = i # Useful for debugging/ordering

        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=CHROMADB_PERSIST_DIR,
            collection_name="academic_papers_collection" # General collection
        )
        vectorstore.persist() # Save to disk

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
    file: UploadFile = File(...)
):
    if not file.filename.endswith(".pdf"):
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
            status="pending"
        )
        db.add(new_paper)
        db.commit()
        db.refresh(new_paper)

        # Start background processing
        background_tasks.add_task(process_pdf_in_background, file_id, file_location, db)

        return JSONResponse(
            content={"message": "File uploaded and processing started.", "paper_id": file_id},
            status_code=status.HTTP_202_ACCEPTED
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

# To be implemented in Phase 3
# @app.post("/papers/{paper_id}/summarize")
# async def summarize_paper(...): pass

# @app.post("/papers/{paper_id}/extract-definitions")
# async def extract_definitions(...): pass

# @app.post("/papers/{paper_id}/generate-questions")
# async def generate_questions(...): pass