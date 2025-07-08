# Academic Insight Assistant - Backend

This directory contains the FastAPI backend application for the Academic Insight Assistant. It handles document processing, interaction with LangChain and Ollama, database operations (PostgreSQL and ChromaDB), and serves as the API for the Next.js frontend.

## Tech Stack

* **Framework:** FastAPI
* **Language:** Python 3.9+
* **LLM Orchestration:** LangChain
* **Local LLM Provider:** Ollama (via `langchain-community`)
* **Relational Database:** PostgreSQL (via SQLAlchemy)
* **Vector Database:** ChromaDB (via `langchain-chroma`)
* **PDF Processing:** PyPDFLoader

## Features

* **PDF File Upload:** Securely receives PDF files from the frontend.
* **Asynchronous Processing:** Handles document parsing, chunking, embedding generation, and storage in the background.
* **LangChain Integration:** Orchestrates LLM calls for summarization, definition extraction, and question generation.
* **Database Management:** Stores paper metadata in PostgreSQL and vector embeddings in ChromaDB.
* **RESTful API:** Provides endpoints for all core functionalities.

## Getting Started

Follow these steps to set up and run the backend locally. Ensure you have completed the [overall project setup](#getting-started) steps in the root `README.md` first.

### Prerequisites

* Python 3.9+
* `venv` (Python's built-in virtual environment tool)
* Docker Desktop (for PostgreSQL, ChromaDB, Ollama)
* All core services (PostgreSQL, ChromaDB, Ollama) should be running via `docker-compose up -d` from the project root.

### Setup Instructions

1.  **Navigate to the Backend Directory:**
    ```bash
    cd academic-insight-assistant/backend
    ```

2.  **Create and Activate Virtual Environment:**
    ```bash
    python -m venv venv
    ```
    * **macOS/Linux:**
        ```bash
        source venv/bin/activate
        ```
    * **Windows (Command Prompt):**
        ```bash
        venv\Scripts\activate.bat
        ```
    * **Windows (PowerShell):**
        ```bash
        .\venv\Scripts\Activate.ps1
        ```

3.  **Install Python Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    (The `requirements.txt` should have been generated during the initial monorepo setup.)

4.  **Database Configuration:**
    The backend uses environment variables for database connection. These are sourced from the `.env` file in the project root. Ensure your `academic-insight-assistant/.env` file has the correct `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` values.

5.  **Ollama Configuration:**
    The `OLLAMA_BASE_URL`, `OLLAMA_LLM_MODEL`, and `OLLAMA_EMBED_MODEL` are also read from the root `.env` file. Confirm these match your Ollama Docker setup.

### Running the Backend

Once all setup steps are complete, you can run the FastAPI application:

```bash
uvicorn main:app --reload --port 8000
```

It's a great decision to set up a monorepo for this project! It simplifies dependency management, code sharing, and development workflow. We'll use a standard approach with separate directories for backend and frontend, managed by Git.

Let's break down the monorepo setup step-by-step and then generate the three README.md files.

Monorepo Setup: Step-by-Step
This setup assumes you're starting from scratch.

Step 1: Create the Root Project Directory
First, create the main directory that will house your entire monorepo.

Bash

mkdir academic-insight-assistant
cd academic-insight-assistant
Step 2: Initialize Git
Initialize a Git repository at the root of your monorepo. This will allow you to manage both frontend and backend code within a single repository.

Bash

git init
Step 3: Create Backend Directory and Initialize FastAPI Project
Now, set up your FastAPI backend within the backend/ directory.

Bash

mkdir backend
cd backend
Create Python Virtual Environment:

Bash

python -m venv venv
Activate Virtual Environment:

macOS/Linux:

Bash

source venv/bin/activate
Windows (Command Prompt):

Bash

venv\Scripts\activate.bat
Windows (PowerShell):

Bash

.\venv\Scripts\Activate.ps1
Install Core Backend Dependencies:

Bash

pip install fastapi uvicorn[standard] python-dotenv SQLAlchemy psycopg2-binary langchain langchain-community langchain-chroma pypdf python-jose[cryptography] passlib[bcrypt] python-multipart
Create requirements.txt:

Bash

pip freeze > requirements.txt
This captures all installed packages.

Create Backend Files:

main.py (your FastAPI application logic)

database.py (PostgreSQL models and connection)

auth.py (for authentication, will be used later)

README.md (for the backend)

You can create these empty files for now:

Bash

touch main.py database.py auth.py README.md
Navigate back to the monorepo root:

Bash

cd ..
Step 4: Create Frontend Directory and Initialize Next.js Project
Next, set up your Next.js frontend within the frontend/ directory.

Bash

mkdir frontend
cd frontend
Create Next.js Application:
We'll use the App Router and TypeScript.

Bash

npx create-next-app@latest . --typescript --eslint --tailwind --app
When prompted, choose "No" or "N" for the src/ directory.

Choose "Yes" or "Y" for App Router.

Choose "Yes" or "Y" for importing ESLint config.

Install Frontend Dependencies (Optional, for styling):
If you want to use DaisyUI for quick styling (as suggested in the roadmap):

Bash

npm install -D daisyui
And update your tailwind.config.ts (inside frontend/):

TypeScript

// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [require('daisyui')], // Add this line
  daisyui: {
    themes: ["light", "dark", "cupcake", "dracula"], // Choose themes you like
  },
};
export default config;
Create README.md for the frontend:

Bash

touch README.md
Navigate back to the monorepo root:

Bash

cd ..
Step 5: Configure Root-level Files
Create docker-compose.yml:
Create this file in the academic-insight-assistant/ root. This file will orchestrate your database, ChromaDB, and Ollama containers. The content for this was provided in the previous response, but ensure it's in the root.

Crucial adjustment: When FastAPI and Next.js are running outside Docker (locally for development), they communicate with Docker containers via localhost. If you containerize them later, they'll use service names. For initial setup, use localhost in your application code.

Create .env file:
Create this file in the academic-insight-assistant/ root. This will hold your shared environment variables for Docker Compose and your backend.

Code snippet

POSTGRES_DB=academic_insights_db
POSTGRES_USER=user
POSTGRES_PASSWORD=password

# Ollama settings for the backend application
OLLAMA_BASE_URL=http://localhost:11434 # Or http://ollama:11434 if backend is also in Docker Compose
OLLAMA_LLM_MODEL=llama3
OLLAMA_EMBED_MODEL=nomic-embed-text
Create Root .gitignore:
Create this file in the academic-insight-assistant/ root. This helps keep your repository clean.

Code snippet

# Node
node_modules
.next/
out/

# Python
venv/
__pycache__/
*.pyc
.pytest_cache/
.mypy_cache/
.env
.DS_Store
.vscode/

# Docker
.dockerignore
docker-compose.override.yml
*.log
Step 6: Initial Git Commit
Now that the basic structure is in place, make your first commit.

Bash

git add .
git commit -m "feat: Initial monorepo setup with backend, frontend, and Docker Compose config"
Monorepo Structure Overview:
academic-insight-assistant/
├── .env
├── .gitignore
├── docker-compose.yml
├── backend/
│   ├── venv/
│   ├── main.py
│   ├── database.py
│   ├── auth.py
│   ├── requirements.txt
│   └── README.md
└── frontend/
    ├── node_modules/
    ├── public/
    ├── app/
    │   └── page.tsx
    ├── .eslintrc.json
    ├── next.config.mjs
    ├── package.json
    ├── pnpm-lock.yaml (or yarn.lock/package-lock.json)
    ├── postcss.config.js
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── README.md
You are now set up for monorepo development!

README Files Generation
Here are the three README.md files: one for the entire project, one for the backend, and one for the frontend.

1. academic-insight-assistant/README.md (Project Root)
Markdown

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
    git clone [https://github.com/your-username/academic-insight-assistant.git](https://github.com/your-username/academic-insight-assistant.git)
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

## Contributing

Contributions are welcome! Please see the `CONTRIBUTING.md` (future file) for guidelines.

## License

This project is licensed under the MIT License. See the `LICENSE` (future file) for details.

---
2. academic-insight-assistant/backend/README.md
Markdown

# Academic Insight Assistant - Backend

This directory contains the FastAPI backend application for the Academic Insight Assistant. It handles document processing, interaction with LangChain and Ollama, database operations (PostgreSQL and ChromaDB), and serves as the API for the Next.js frontend.

## Tech Stack

* **Framework:** FastAPI
* **Language:** Python 3.9+
* **LLM Orchestration:** LangChain
* **Local LLM Provider:** Ollama (via `langchain-community`)
* **Relational Database:** PostgreSQL (via SQLAlchemy)
* **Vector Database:** ChromaDB (via `langchain-chroma`)
* **PDF Processing:** PyPDFLoader

## Features

* **PDF File Upload:** Securely receives PDF files from the frontend.
* **Asynchronous Processing:** Handles document parsing, chunking, embedding generation, and storage in the background.
* **LangChain Integration:** Orchestrates LLM calls for summarization, definition extraction, and question generation.
* **Database Management:** Stores paper metadata in PostgreSQL and vector embeddings in ChromaDB.
* **RESTful API:** Provides endpoints for all core functionalities.

## Getting Started

Follow these steps to set up and run the backend locally. Ensure you have completed the [overall project setup](#getting-started) steps in the root `README.md` first.

### Prerequisites

* Python 3.9+
* `venv` (Python's built-in virtual environment tool)
* Docker Desktop (for PostgreSQL, ChromaDB, Ollama)
* All core services (PostgreSQL, ChromaDB, Ollama) should be running via `docker-compose up -d` from the project root.

### Setup Instructions

1.  **Navigate to the Backend Directory:**
    ```bash
    cd academic-insight-assistant/backend
    ```

2.  **Create and Activate Virtual Environment:**
    ```bash
    python -m venv venv
    ```
    * **macOS/Linux:**
        ```bash
        source venv/bin/activate
        ```
    * **Windows (Command Prompt):**
        ```bash
        venv\Scripts\activate.bat
        ```
    * **Windows (PowerShell):**
        ```bash
        .\venv\Scripts\Activate.ps1
        ```

3.  **Install Python Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    (The `requirements.txt` should have been generated during the initial monorepo setup.)

4.  **Database Configuration:**
    The backend uses environment variables for database connection. These are sourced from the `.env` file in the project root. Ensure your `academic-insight-assistant/.env` file has the correct `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` values.

5.  **Ollama Configuration:**
    The `OLLAMA_BASE_URL`, `OLLAMA_LLM_MODEL`, and `OLLAMA_EMBED_MODEL` are also read from the root `.env` file. Confirm these match your Ollama Docker setup.

### Running the Backend

Once all setup steps are complete, you can run the FastAPI application:

```bash
uvicorn main:app --reload --port 8000
```

- --reload: Automatically reloads the server on code changes.

- --port 8000: Specifies the port for the backend API.

**The backend API will be accessible at http://localhost:8000.**

### API Endpoints (Current)
- `GET /`: Basic health check.
- `POST /upload-paper/`: Upload a PDF document for processing. Returns a paper_id.
- `GET /papers/{paper_id}`: Retrieve details and processing status of a specific paper.
- `POST /papers/{paper_id}/summarize`: Generate and retrieve a summary of the paper.
- `POST /papers/{paper_id}/extract-definitions`: Extract and retrieve key definitions/concepts.
- `POST /papers/{paper_id}/generate-questions`: Generate and retrieve practice questions.

### Database Details
#### PostgreSQL:

- **Table**: papers - Stores metadata about uploaded papers (filename, upload date, processing status, summary, etc.).

#### ChromaDB:

- **Collection**: academic_papers_collection - Stores vector embeddings of document chunks, allowing for semantic search and retrieval. Embeddings are filtered by paper_id to ensure context relevance.

### Development Notes
- **Temporary Files**: Uploaded PDFs are temporarily stored in the uploaded_papers directory and deleted after processing.

- **ChromaDB Persistence**: The chroma_data directory within the backend folder is used to persist ChromaDB embeddings locally. Do not delete this folder if you want to retain your processed data.

- **Background Tasks**: PDF processing is handled as a FastAPI BackgroundTasks to avoid blocking the API response for long-running operations. For production, consider a dedicated task queue (e.g., Celery).