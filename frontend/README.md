# Academic Insight Assistant - Frontend

This directory contains the Next.js frontend application for the Academic Insight Assistant. It provides the user interface for uploading documents, viewing processing status, and interacting with the generated insights (summaries, definitions, questions).

## Tech Stack

* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS, DaisyUI
* **State Management:** React's `useState`, `useEffect` (for basic needs)

## Features

* **Responsive UI:** Built with Tailwind CSS for a mobile-first design.
* **PDF Upload Interface:** Simple and intuitive form for uploading academic papers.
* **Paper Dashboard:** Displays a list of uploaded papers and their current processing status.
* **Dynamic Paper Detail Pages:** View generated summaries, extracted definitions, and interact with practice questions.
* **Backend API Integration:** Communicates with the FastAPI backend to send files and retrieve data.

## Getting Started

Follow these steps to set up and run the frontend locally. Ensure you have completed the [overall project setup](#getting-started) steps in the root `README.md` first, and that the [backend](#academic-insight-assistant-backend-readme-md) is running.

### Prerequisites

* Node.js (LTS version) & npm/yarn/pnpm

### Setup Instructions

1.  **Navigate to the Frontend Directory:**
    ```bash
    cd academic-insight-assistant/frontend
    ```

2.  **Install Node.js Dependencies:**
    ```bash
    npm install # or yarn install or pnpm install
    ```

### Running the Frontend

Once dependencies are installed, you can run the Next.js development server:

```bash
npm run dev # or yarn dev or pnpm dev
```
The frontend application will be accessible at `http://localhost:3000`.

### Development Notes
- **API Communication**: The frontend communicates with the FastAPI backend, which is expected to be running at `http://localhost:8000`. Ensure CORS is properly configured in the FastAPI backend (`backend/main.py`).

- **Styling**: This project uses Tailwind CSS with DaisyUI components for rapid UI development. Refer to the DaisyUI documentation for available components and styling utilities.

**Pages**:

- `/`: Main dashboard for uploading and listing papers.

- `/paper/[id]`: Dynamic route for viewing details, summaries, definitions, and questions related to a specific paper.
