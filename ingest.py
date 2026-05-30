from pathlib import Path

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


DATA_DIR = "data"
VECTORSTORE_DIR = "vectorstore"
COLLECTION_NAME = "nomadscholar_kb"
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


def extract_metadata(content, file_name):
    """
    Extract title, source, and URL from a curated knowledge base file.
    """
    metadata = {
        "source_file": file_name,
        "title": file_name,
        "source": "",
        "url": "",
    }

    for line in content.splitlines():
        if line.startswith("TITLE:"):
            metadata["title"] = line.replace("TITLE:", "").strip()

        if line.startswith("SOURCE:"):
            metadata["source"] = line.replace("SOURCE:", "").strip()

        if line.startswith("URL:"):
            metadata["url"] = line.replace("URL:", "").strip()

    return metadata


def load_documents():
    """
    Load all .txt files from the data folder.

    Each file becomes a LangChain Document with source metadata.
    """
    documents = []

    data_path = Path(DATA_DIR)

    if not data_path.exists():
        raise FileNotFoundError(f"Data folder not found: {DATA_DIR}")

    txt_files = list(data_path.glob("*.txt"))

    if not txt_files:
        raise FileNotFoundError(f"No .txt files found inside {DATA_DIR}")

    for file_path in txt_files:
        content = file_path.read_text(encoding="utf-8")
        metadata = extract_metadata(content, file_path.name)

        document = Document(
            page_content=content,
            metadata=metadata,
        )

        documents.append(document)

    return documents


def build_vectorstore():
    """
    Build a Chroma vector database from the knowledge base documents.
    """
    print("Loading documents...")
    documents = load_documents()
    print(f"Loaded {len(documents)} documents.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=700,
        chunk_overlap=120,
        separators=["\n\n", "\n", ".", " ", ""],
    )

    chunks = splitter.split_documents(documents)
    print(f"Created {len(chunks)} chunks.")

    print("Loading multilingual embedding model...")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    print("Building Chroma vectorstore...")
    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=VECTORSTORE_DIR,
        collection_name=COLLECTION_NAME,
    )

    print("Vectorstore created successfully.")


if __name__ == "__main__":
    build_vectorstore()