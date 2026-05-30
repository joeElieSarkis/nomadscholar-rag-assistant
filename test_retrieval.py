from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings


VECTORSTORE_DIR = "vectorstore"
COLLECTION_NAME = "nomadscholar_kb"
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


def get_vectorstore():
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    return Chroma(
        persist_directory=VECTORSTORE_DIR,
        embedding_function=embeddings,
        collection_name=COLLECTION_NAME,
    )


def test_query(vectorstore, question: str):
    results = vectorstore.similarity_search_with_score(question, k=4)

    print("\n" + "=" * 80)
    print(f"Question: {question}")
    print("=" * 80)

    for index, (document, score) in enumerate(results, start=1):
        source = document.metadata.get("source_file", "Unknown source")
        preview = document.page_content[:500].replace("\n", " ")

        print(f"\nResult {index}")
        print(f"Source: {source}")
        print(f"Score: {score}")
        print(f"Preview: {preview}...")


if __name__ == "__main__":
    test_questions = [
        "What documents do I need for a DAAD scholarship?",
        "Can Lebanese students get advising for studying in the United States?",
        "شو المستندات المطلوبة للتقديم على منحة؟",
        "What should I prepare for Erasmus Mundus?",
        "Do universities require separate scholarship applications?",
        "I want to apply for a master's in AI in France. What options should I explore?",
    ]

    vectorstore = get_vectorstore()

    for question in test_questions:
        test_query(vectorstore, question)