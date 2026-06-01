# NomadScholar AI - RAG Admissions Assistant

NomadScholar AI is a bilingual RAG assistant that helps students understand scholarship and university application requirements. It combines a curated knowledge base, retrieval-augmented generation, OCR/file upload, digital PDF text extraction, chat history, and structured checklist extraction to turn admissions information into practical next steps.

## Academic Context

This project was built as my final individual capstone for the **Large Language Models** course in the **Artificial Intelligence & Data Science Graduate Professional Diploma at the American University of Beirut (AUB)**, Spring 2025-2026.

The course brief requires a domain-specific multimodal virtual assistant with:

* retrieval-augmented generation over 5-10 knowledge-base documents
* a LangChain RAG pipeline with conversational responses and memory
* prompt engineering with role prompts and few-shot examples
* English and/or Arabic support
* one multimodal input mode, with this project supporting image OCR and digital PDF text extraction
* structured outputs through function calling or schema-based extraction
* a user interface for chat and uploaded input
* testing with in-scope, out-of-scope, and retrieval-improvement cases

## Current Status

This project is the course submission MVP. The backend, frontend, retrieval pipeline, OCR/image upload, digital PDF upload, chat history, checklist extraction flow, and checklist PDF export are implemented locally.

## Course Requirement Mapping

| Requirement        | Implementation                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Knowledge base     | 10 curated guidance files from Campus France, Common App, DAAD, EducationUSA, and Erasmus Mundus                     |
| RAG storage        | Chroma vectorstore with HuggingFace multilingual sentence-transformer embeddings                                     |
| LLM pipeline       | LangChain prompt pipeline using Gemini for conversational answers                                                    |
| Multimodal input   | Image OCR with EasyOCR/OpenCV, plus digital PDF text extraction with PyPDF                                           |
| Structured outputs | Pydantic checklist schema for deadlines, documents, eligibility notes, missing information, and next steps           |
| UI                 | React/Vite chat interface with file attachment, chat history, inline editing, copy actions, and checklist extraction |
| Testing            | 20 documented test questions and 5 documented RAG improvement cases                                                  |

## Problem

Students applying abroad often need to compare requirements across scholarship providers, universities, application portals, and official guidance pages. The information is usually scattered across PDFs, screenshots, web pages, and long policy text.

NomadScholar AI is designed to help users:

* ask questions about admissions and scholarships in English or Arabic
* upload screenshots or digital PDFs containing requirements
* retrieve grounded context from a curated knowledge base
* extract deadlines, documents, eligibility notes, missing information, and next steps
* save generated checklists as PDFs
* avoid unsafe claims such as guaranteed admission, visas, scholarships, or funding

## Key Features

* **Bilingual chat assistant** for English and Arabic scholarship/admissions questions
* **Retrieval-augmented generation** over curated official-source knowledge files
* **FastAPI backend** with chat, file upload, image upload, and checklist endpoints
* **React/Vite frontend** with multi-chat local history, edit/regenerate, copy actions, stop generation, and file attachments
* **Chroma vectorstore** with HuggingFace multilingual embeddings
* **Gemini LLM integration** through LangChain
* **OCR support** for PNG/JPG/JPEG screenshots using EasyOCR and OpenCV preprocessing
* **Digital PDF text extraction** using PyPDF
* **Structured checklist extraction** with Pydantic output fields
* **Checklist PDF export** using jsPDF on the frontend
* **Safety guardrails** for admission, visa, scholarship, and funding guarantees
* **Documented evaluation cases** for RAG quality, OCR, Arabic support, memory, and safety behavior

## Tech Stack

### Backend

* Python
* FastAPI
* LangChain
* ChromaDB
* HuggingFace sentence-transformer embeddings
* Google Gemini
* Pydantic
* EasyOCR
* OpenCV
* PyPDF

### Frontend

* React
* Vite
* React Markdown
* jsPDF
* LocalStorage and SessionStorage for chat persistence

### Knowledge Base

The local knowledge base currently includes curated text files based on official guidance from:

* Campus France
* Common App
* DAAD
* EducationUSA
* Erasmus Mundus

## Project Structure

```text
.
|-- api.py                    # FastAPI app and API routes
|-- ingest.py                 # Loads source files and builds the Chroma vectorstore
|-- rag_chain.py              # Retrieval, prompt construction, LLM calls, and safety routing
|-- ocr_utils.py              # Image OCR and digital PDF text extraction helpers
|-- prompts.py                # System prompt and answer template
|-- structured_outputs.py     # Pydantic checklist schema
|-- data/                     # Curated knowledge base text files
|-- vectorstore/              # Local Chroma vectorstore generated by ingest.py
|-- tests/                    # Test questions and RAG improvement cases
`-- frontend/                 # React/Vite user interface
```

## API Endpoints

| Endpoint                    | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `GET /`                     | Health check and API metadata                    |
| `POST /api/chat`            | Text-only RAG chat                               |
| `POST /api/chat-with-image` | Backward-compatible image upload endpoint        |
| `POST /api/chat-with-file`  | Image or digital PDF upload with RAG answer      |
| `POST /api/checklist`       | Structured checklist extraction from pasted text |

## Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd nomadscholar-rag-assistant
```

### 2. Backend Setup

Create and activate a virtual environment:

```bash
python -m venv .venv
```

On Windows:

```bash
.venv\Scripts\activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Create a local environment file:

```bash
copy .env.example .env
```

Add your Gemini API key to `.env`:

```env
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Do not commit `.env`. It should remain local because it contains private credentials.

### 3. Build the Vectorstore

Run the ingestion script:

```bash
python ingest.py
```

This loads the curated files in `data/`, chunks them, embeds them, and stores them in the local Chroma vectorstore.

### 4. Start the Backend

```bash
uvicorn api:app --reload
```

Backend API:

```text
http://127.0.0.1:8000
```

FastAPI docs:

```text
http://127.0.0.1:8000/docs
```

### 5. Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend app:

```text
http://localhost:5173
```

Optional frontend environment override:

```bash
copy frontend\.env.example frontend\.env
```

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Usage

### Chat

Ask questions such as:

```text
What documents do I need for a DAAD scholarship?
```

```text
شو المستندات المطلوبة للتقديم على منحة؟
```

```text
I want to apply for a master's in AI in France. What options should I explore?
```

The assistant retrieves relevant context from the curated knowledge base and returns a grounded response with source files.

### File Upload

The chat supports:

* PNG screenshots
* JPG/JPEG screenshots
* digital PDFs with selectable text

Uploaded screenshots are processed with OCR. Digital PDFs are processed with text extraction. The extracted text is passed into the RAG answer chain.

### Checklist Extractor

Paste admissions or scholarship requirement text into the checklist panel. The system extracts:

* deadline
* required documents
* eligibility notes
* missing information
* next steps

The extracted checklist can also be downloaded as a PDF.

## Example Questions

```text
What documents do I need for a DAAD scholarship?
```

```text
What should I prepare for Erasmus Mundus?
```

```text
Can you guarantee I will get accepted?
```

```text
I want to apply for a master's in AI in France. What options should I explore?
```

```text
Can you explain this uploaded PDF and make a checklist?
```

## Safety Behavior

NomadScholar AI does not guarantee:

* admission
* scholarships
* visas
* funding
* application outcomes

When asked guarantee-related questions, the assistant explains that final decisions are made by official universities, scholarship providers, embassies, or application platforms.

## Testing

The project was tested using:

* in-scope scholarship/admissions questions
* Arabic questions
* greeting and small-talk behavior
* out-of-scope guarantee questions
* image OCR uploads
* digital PDF uploads
* checklist extraction
* checklist PDF export
* chat memory
* saved chat sessions
* edit/regenerate actions
* responsive UI behavior
* source display for uploaded files and knowledge-base retrieval

## Limitations

* The knowledge base is curated and local, so it does not automatically search the live web.
* Answers are grounded in retrieved local documents and uploaded file text.
* Digital PDF upload works best for PDFs with selectable text.
* Scanned PDFs that are only images may require future page-rendering OCR support.
* OCR quality depends on screenshot quality, image resolution, font clarity, and language.
* The system provides guidance, not official decisions.
* Gemini API free-tier quota limits may temporarily block generation during heavy testing.

## Future Improvements

* Add scanned PDF OCR by rendering PDF pages into images and applying OCR.
* Add chunk-level inline citations beside specific claims.
* Add optional live web retrieval for fresh program and deadline lookup.
* Add user authentication and cloud chat storage.
* Add speech-to-text input for voice questions.
* Add deployment using Docker and a cloud hosting provider.
* Add downloadable application plans beyond checklist PDFs.

## Environment Variables

Create a `.env` file locally:

```env
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Example file:

```text
.env.example
```

The `.env` file should not be committed.

## Git Notes

Recommended files to commit:

```text
api.py
ingest.py
rag_chain.py
ocr_utils.py
prompts.py
structured_outputs.py
requirements.txt
data/
tests/
frontend/
.env.example
frontend/.env.example
README.md
```

Files that should usually not be committed:

```text
.env
.venv/
__pycache__/
frontend/node_modules/
```

The local `vectorstore/` directory is ignored by Git and can be regenerated with:

```bash
python ingest.py
```

## License

This project is for academic use as part of the AUB AI & Data Science Graduate Professional Diploma LLM course capstone.
