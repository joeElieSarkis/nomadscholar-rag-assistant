import os

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate

from prompts import SYSTEM_PROMPT, ANSWER_TEMPLATE


load_dotenv()


VECTORSTORE_DIR = "vectorstore"
COLLECTION_NAME = "nomadscholar_kb"
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
GEMINI_MODEL = "gemini-2.5-flash"


def get_llm():
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY was not found. Make sure it is set in your .env file."
        )

    return ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        temperature=0.2,
        google_api_key=api_key,
    )


def get_vectorstore():
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    return Chroma(
        persist_directory=VECTORSTORE_DIR,
        embedding_function=embeddings,
        collection_name=COLLECTION_NAME,
    )


def format_documents(documents):
    formatted_documents = []

    for index, document in enumerate(documents, start=1):
        source = document.metadata.get("source_file", "Unknown source")
        formatted_documents.append(
            f"[Source {index}: {source}]\n{document.page_content}"
        )

    return "\n\n".join(formatted_documents)


def format_chat_history(history):
    if not history:
        return "No previous conversation."

    formatted_history = []

    for user_message, assistant_message in history:
        formatted_history.append(f"User: {user_message}")
        formatted_history.append(f"Assistant: {assistant_message}")

    return "\n".join(formatted_history)


def answer_question(question, history=None, image_text=""):
    history = history or []

    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    retrieval_query = question

    if image_text:
        retrieval_query = f"{question}\n\nExtracted image text:\n{image_text}"

    retrieved_documents = retriever.invoke(retrieval_query)

    context = format_documents(retrieved_documents)
    chat_history = format_chat_history(history)

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            ("human", ANSWER_TEMPLATE),
        ]
    )

    llm = get_llm()
    chain = prompt | llm

    response = chain.invoke(
        {
            "chat_history": chat_history,
            "context": context,
            "image_text": image_text or "No image text provided.",
            "question": question,
        }
    )

    sources = []

    for document in retrieved_documents:
        source = document.metadata.get("source_file", "Unknown source")
        if source not in sources:
            sources.append(source)

    return {
        "answer": response.content,
        "sources": sources,
        "retrieved_context": context,
    }


if __name__ == "__main__":
    test_question = "What documents do I need for a DAAD scholarship?"

    result = answer_question(test_question)

    print("\nAnswer:")
    print(result["answer"])

    print("\nSources:")
    for source in result["sources"]:
        print(f"- {source}")