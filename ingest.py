from pathlib import Path

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


DATA_DIR = "data"
VECTORSTORE_DIR = "vectorstore"
COLLECTION_NAME = "nomadscholar_kb"
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


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

        document = Document(
            page_content=content,
            metadata={"source_file": file_path.name}
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
        separators=["\n\n", "\n", ".", " ", ""]
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
        collection_name=COLLECTION_NAME
    )

    print("Vectorstore created successfully.")


if __name__ == "__main__":
    build_vectorstore()