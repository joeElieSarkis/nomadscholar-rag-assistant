import os

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings

from prompts import ANSWER_TEMPLATE, SYSTEM_PROMPT
from structured_outputs import ApplicationChecklist


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
        title = document.metadata.get("title", "Unknown source")
        source_file = document.metadata.get("source_file", "Unknown file")
        formatted_documents.append(
            f"[Retrieved chunk {index} from {title} ({source_file})]\n{document.page_content}"
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


def is_greeting(question):
    normalized_question = question.lower().strip()

    greetings = {
        "hi",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
        "مرحبا",
        "اهلا",
        "أهلا",
        "أهلاً",
        "السلام عليكم",
    }

    return normalized_question in greetings


def is_safety_or_guarantee_question(question):
    normalized_question = question.lower()

    guarantee_keywords = [
        "guarantee",
        "guaranteed",
        "100%",
        "make sure i get accepted",
        "will i definitely get accepted",
        "visa guarantee",
        "scholarship guarantee",
        "اضمن",
        "مضمون",
        "أكيد انقبل",
        "اكيد انقبل",
    ]

    return any(keyword in normalized_question for keyword in guarantee_keywords)


def answer_question(question, history=None, image_text=""):
    history = history or []

    if is_greeting(question):
        return {
            "answer": (
                "Hello! I’m NomadScholar AI. I can help you understand scholarship and university "
                "application requirements, prepare document checklists, compare official guidance, "
                "and explain screenshots or PDFs of admissions or scholarship pages.\n\n"
                "What are you applying for?"
            ),
            "sources": [],
            "retrieved_context": "",
        }

    if is_safety_or_guarantee_question(question):
        return {
            "answer": (
                "I can’t guarantee admission, scholarships, visas, or funding. Final decisions are made "
                "by the official university, scholarship provider, or embassy.\n\n"
                "What I can do is help you:\n"
                "- understand official requirements\n"
                "- prepare a document checklist\n"
                "- identify missing information\n"
                "- explain deadlines and eligibility notes\n"
                "- organize your next steps"
            ),
            "sources": [],
            "retrieved_context": "",
        }

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
        title = document.metadata.get("title") or document.metadata.get("source_file", "Unknown source")

        if title not in sources:
            sources.append(title)

    return {
        "answer": response.content,
        "sources": sources,
        "retrieved_context": context,
    }


def extract_application_checklist(text):
    """
    Extract deadline, documents, eligibility notes, missing information,
    and next steps from application-related text.
    """
    llm = get_llm()
    structured_llm = llm.with_structured_output(ApplicationChecklist)

    prompt = f"""
You are extracting structured information from scholarship or university application text.

Rules:
- Do not invent deadlines.
- Do not invent required documents.
- If a field is not mentioned, leave it empty or null.
- If the text is unclear, list what is missing in missing_information.
- Keep next_steps practical and short.

Text:
{text}
"""

    return structured_llm.invoke(prompt)


if __name__ == "__main__":
    test_questions = [
        "hello",
        "Can you guarantee I will get accepted?",
        "What documents do I need for a DAAD scholarship?",
        "I want to apply for a master's in AI in France. What options should I explore?",
    ]

    for test_question in test_questions:
        result = answer_question(test_question)

        print("\n" + "=" * 80)
        print(f"Question: {test_question}")
        print("=" * 80)

        print("\nAnswer:")
        print(result["answer"])

        print("\nSources:")
        if result["sources"]:
            for source in result["sources"]:
                print(f"- {source}")
        else:
            print("No retrieved sources used.")