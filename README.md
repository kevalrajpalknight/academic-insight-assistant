# Academic Insight Assistant

## Overview

The Academic Insight Assistant is an innovative tool designed to streamline the process of engaging with academic papers. Leveraging the power of local Large Language Models (LLMs) via Ollama, orchestrated by LangChain, and presented through a modern Next.js frontend with a robust FastAPI backend, this application helps students, researchers, and educators quickly extract key information, generate summaries, define concepts, and create practice questions from uploaded PDF academic papers.

This project is structured as a monorepo, containing both the backend (FastAPI) and frontend (Next.js) applications, along with Docker Compose configurations for essential services.

## Features

* **PDF Document Upload:** Easily upload academic papers in PDF format.
* **Intelligent Processing:** Utilizes LangChain and local Ollama LLMs to parse and understand document content.
* **Automated Summarization:** Generate concise summaries of research papers.
* **Key Concept Extraction:** Identify and define important terminology and concepts within the text.
* **Practice Question Generation:** Create multiple-choice or short-answer questions to aid in self-study and comprehension.
* **Persistent Storage:** Uses PostgreSQL for structured data (paper metadata) and ChromaDB for vector embeddings.
* **Local LLM Support:** Ensures data privacy and reduces operational costs by running LLMs locally via Ollama.

## Tech Stack

* **Frontend:** Next.js (React), TypeScript, Tailwind CSS, DaisyUI
* **Backend:** FastAPI (Python), LangChain
* **Local LLM Runtime:** Ollama
* **Vector Database:** ChromaDB
* **Relational Database:** PostgreSQL
* **Containerization:** Docker, Docker Compose
* **Version Control:** Git (Monorepo)

## Monorepo Structure
```
academic-insight-assistant/
├── .env                  # Environment variables for Docker and backend
├── .gitignore            # Global Git ignore rules
├── docker-compose.yml    # Docker Compose setup for PostgreSQL, ChromaDB, Ollama
├── backend/              # FastAPI application, LangChain logic
│   ├── venv/             # Python virtual environment
│   ├── main.py           # Main FastAPI app
│   ├── database.py       # SQLAlchemy models and DB connection
│   ├── auth.py           # (Future) Authentication logic
│   ├── requirements.txt  # Python dependencies
│   └── README.md         # Backend-specific documentation
└── frontend/             # Next.js application
├── public/           # Static assets
├── app/              # Next.js App Router pages/components
├── node_modules/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md         # Frontend-specific documentation
```

## Getting Started

Follow these steps to set up and run the Academic Insight Assistant locally.

### Prerequisites

* Git
* Python 3.9+
* Node.js (LTS version) & npm/yarn/pnpm
* Docker Desktop (highly recommended for database and Ollama setup)

### Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/kevalrajpalknight/academic-insight-assistant.git
    cd academic-insight-assistant
    ```

2.  **Configure Environment Variables:**
    Create a `.env` file in the project root (`academic-insight-assistant/.env`) and add the following:
    ```env
    # PostgreSQL Database
    POSTGRES_DB=academic_insights_db
    POSTGRES_USER=user
    POSTGRES_PASSWORD=password

    # Ollama (Local LLM) Configuration
    OLLAMA_BASE_URL=http://localhost:11434
    OLLAMA_LLM_MODEL=llama3 # Or another model like mistral, gemma:2b
    OLLAMA_EMBED_MODEL=nomic-embed-text # Essential for embeddings
    ```

3.  **Start Core Services with Docker Compose:**
    This will spin up PostgreSQL, ChromaDB, and Ollama.
    ```bash
    docker-compose up -d
    ```
    Verify all services are running: `docker-compose ps`

4.  **Download Ollama Models:**
    Once the Ollama container is running, download the necessary LLM and embedding models.
    ```bash
    docker exec -it ollama_server ollama pull llama3       # Replace with your chosen LLM
    docker exec -it ollama_server ollama pull nomic-embed-text # Essential for embeddings
    ```
    You can check available models with `docker exec -it ollama_server ollama list`.

5.  **Set up the Backend:**
    Refer to the `backend/README.md` for detailed instructions on setting up and running the FastAPI application.

6.  **Set up the Frontend:**
    Refer to the `frontend/README.md` for detailed instructions on setting up and running the Next.js application.

## Usage

1.  Ensure all backend services (FastAPI) and Docker containers are running.
2.  Navigate to `http://localhost:3000` in your web browser.
3.  Upload a PDF academic paper.
4.  Once processed, access the paper details to generate summaries, extract definitions, and create practice questions.
