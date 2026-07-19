import os
import re
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings

from prompts import ANSWER_TEMPLATE, SYSTEM_PROMPT
from structured_outputs import ApplicationChecklist


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

VECTORSTORE_DIR = str(BASE_DIR / "vectorstore")
COLLECTION_NAME = "nomadscholar_kb"
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")


@lru_cache(maxsize=1)
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


@lru_cache(maxsize=1)
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
            f"[Retrieved chunk {index} from {title} ({source_file})]\n"
            f"{document.page_content}"
        )

    return "\n\n".join(formatted_documents)


def collect_sources(documents):
    sources = []

    for document in documents:
        title = document.metadata.get("title") or document.metadata.get(
            "source_file",
            "Unknown source",
        )

        if title not in sources:
            sources.append(title)

    return sources


def clean_document_text(document):
    lines = []

    for line in document.page_content.splitlines():
        stripped_line = line.strip()

        if not stripped_line:
            continue

        if stripped_line.startswith(("TITLE:", "SOURCE:", "URL:", "CONTENT:")):
            continue

        lines.append(stripped_line)

    return " ".join(lines)


def is_arabic_text(text):
    return bool(re.search(r"[\u0600-\u06FF]", text or ""))


def is_quota_error(error):
    error_message = str(error)

    return "RESOURCE_EXHAUSTED" in error_message or "429" in error_message


def build_retrieval_fallback_answer(question, documents):
    """
    Return a transparent answer when retrieval works but the LLM provider is
    temporarily quota-limited.
    """
    source_summaries = []
    seen_titles = set()

    for document in documents:
        title = document.metadata.get("title", "Retrieved source")

        if title in seen_titles:
            continue

        seen_titles.add(title)
        text = clean_document_text(document)

        if not text:
            continue

        snippet = text[:420].rstrip()

        if len(text) > len(snippet):
            snippet += "..."

        source_summaries.append((title, snippet))

        if len(source_summaries) == 3:
            break

    if is_arabic_text(question):
        intro = (
            "وصلت خدمة توليد الإجابة إلى حد الاستخدام مؤقتاً، لكن نظام الاسترجاع "
            "وجد مصادر ذات صلة من قاعدة المعرفة. هذه أهم المعلومات المسترجعة:"
        )
        reminder = "جرّب مرة أخرى بعد قليل للحصول على صياغة كاملة، وتأكد دائماً من المصدر الرسمي."
    else:
        intro = (
            "The generation model is temporarily quota-limited, but retrieval is working. "
            "Here is the most relevant guidance found in the knowledge base:"
        )
        reminder = "Try again shortly for a fully generated answer, and always verify final details from the official source."

    if not source_summaries:
        return (
            "The generation model is temporarily quota-limited, and no useful retrieved "
            "context was available for a fallback answer. Please try again shortly."
        )

    bullets = [
        f"- {title}: {snippet}"
        for title, snippet in source_summaries
    ]

    return "\n\n".join([intro, "\n".join(bullets), reminder])


def format_chat_history(history):
    if not history:
        return "No previous conversation."

    formatted_history = []

    for user_message, assistant_message in history:
        formatted_history.append(f"User: {user_message}")
        formatted_history.append(f"Assistant: {assistant_message}")

    return "\n".join(formatted_history)


def normalize_question(question):
    cleaned_question = re.sub(
        r"[^\w\s\u0600-\u06FF%]",
        " ",
        (question or "").lower().strip(),
    )

    return " ".join(cleaned_question.split())


def is_greeting(question):
    normalized_question = normalize_question(question)

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


def is_small_talk(question):
    normalized_question = normalize_question(question)

    small_talk_messages = {
        "how are you",
        "how are you?",
        "how r u",
        "how are u",
        "how is it going",
        "how s it going",
        "how's it going",
        "hows it going",
        "whats up",
        "what's up",
        "what s up",
        "thank you",
        "thanks",
        "thank u",
        "okay thank you",
        "ok thank you",
        "تمام",
        "شكرا",
        "شكراً",
        "كيفك",
        "كيف حالك",
        "عامل ايه",
    }

    return normalized_question in small_talk_messages


def is_safety_or_guarantee_question(question):
    normalized_question = normalize_question(question)

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


DOMAIN_KEYWORDS = {
    "admission",
    "admissions",
    "application",
    "applications",
    "apply",
    "applying",
    "checklist",
    "college",
    "cv",
    "deadline",
    "deadlines",
    "document",
    "documents",
    "eligibility",
    "financial aid",
    "funding",
    "advising",
    "adviser",
    "advisor",
    "letter of recommendation",
    "master",
    "masters",
    "motivation letter",
    "recommendation",
    "requirements",
    "scholarship",
    "scholarships",
    "study abroad",
    "transcript",
    "university",
    "visa",
    "قبول",
    "تقديم",
    "جامعة",
    "جامعات",
    "ماجستير",
    "مستندات",
    "منح",
    "منحة",
    "وثائق",
}


PROVIDER_KEYWORDS = {
    "campus france",
    "common app",
    "daad",
    "education usa",
    "educationusa",
    "erasmus",
}


STUDY_LOCATION_PATTERNS = {
    "master in france",
    "masters in france",
    "master's in france",
    "study in france",
    "study in germany",
    "study in the united states",
    "study in the u.s.",
    "study in the usa",
    "studying in france",
    "studying in germany",
    "studying in the united states",
    "studying in the u.s.",
    "studying in the usa",
}


FOLLOW_UP_KEYWORDS = {
    "also",
    "arabic",
    "can you explain",
    "can you summarize",
    "checklist",
    "continue",
    "deadline",
    "deadlines",
    "english",
    "explain it",
    "explain more",
    "how about",
    "more",
    "next steps",
    "requirements",
    "say it",
    "same",
    "summarize",
    "summary",
    "tell me more",
    "them",
    "these",
    "those",
    "translate",
    "what about",
    "what does it mean",
    "what else",
    "what is it",
    "what next",
    "why",
    "بالعربي",
    "بالانجليزي",
    "بالإنجليزي",
    "ترجم",
    "ترجمة",
    "فسر",
    "لخص",
    "ملخص",
    "كمان",
}


OUT_OF_SCOPE_KEYWORDS = {
    "basketball",
    "bitcoin",
    "code",
    "coding",
    "crypto",
    "football",
    "javascript",
    "movie",
    "news",
    "python",
    "recipe",
    "restaurant",
    "stock",
    "stocks",
    "weather",
}


def contains_any_keyword(normalized_question, keywords):
    for keyword in keywords:
        if not keyword:
            continue

        keyword_has_arabic = re.search(r"[\u0600-\u06FF]", keyword)
        keyword_is_phrase = " " in keyword or "'" in keyword or "%" in keyword

        if keyword_has_arabic or keyword_is_phrase:
            if keyword in normalized_question:
                return True
            continue

        if re.search(rf"\b{re.escape(keyword)}\b", normalized_question):
            return True

    return False


def is_in_scope_question(question, history=None, image_text=""):
    """
    Decide whether a text-only question should use the admissions RAG knowledge base.

    Uploaded files are allowed through because the relevant context may be in
    the file. Follow-up turns are allowed only when the new message still looks
    related to applications, or when it clearly refers back to the previous
    admissions conversation.
    """
    if image_text:
        return True

    normalized_question = normalize_question(question)

    has_domain_signal = (
        contains_any_keyword(normalized_question, DOMAIN_KEYWORDS)
        or contains_any_keyword(normalized_question, PROVIDER_KEYWORDS)
        or contains_any_keyword(normalized_question, STUDY_LOCATION_PATTERNS)
    )

    if has_domain_signal:
        return True

    if contains_any_keyword(normalized_question, OUT_OF_SCOPE_KEYWORDS):
        return False

    if history and contains_any_keyword(normalized_question, FOLLOW_UP_KEYWORDS):
        return True

    return False


def answer_question(question, history=None, image_text=""):
    history = history or []
    question = question or ""

    if is_greeting(question):
        return {
            "answer": (
                "Hello! I’m NomadScholar AI. I can help you understand scholarship "
                "and university application requirements, prepare document checklists, "
                "compare official guidance, and explain screenshots or PDFs of admissions "
                "or scholarship pages.\n\n"
                "What are you applying for?"
            ),
            "sources": [],
            "retrieved_context": "",
        }

    if is_small_talk(question):
        return {
            "answer": (
                "I’m ready to help with scholarships, admissions, required documents, "
                "deadlines, screenshots, PDFs, or application checklists. What are you "
                "working on?"
            ),
            "sources": [],
            "retrieved_context": "",
        }

    if is_safety_or_guarantee_question(question):
        return {
            "answer": (
                "I can’t guarantee admission, scholarships, visas, or funding. Final "
                "decisions are made by the official university, scholarship provider, "
                "or embassy.\n\n"
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

    if not is_in_scope_question(question, history=history, image_text=image_text):
        return {
            "answer": (
                "I’m focused on scholarships, admissions, study-abroad applications, "
                "required documents, deadlines, uploaded application files, and checklists. "
                "I do not have enough relevant information in my knowledge base to answer "
                "that question reliably."
            ),
            "sources": [],
            "retrieved_context": "",
        }

    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

    retrieval_query = question

    if image_text:
        retrieval_query = f"{question}\n\nExtracted uploaded file text:\n{image_text}"

    retrieved_documents = retriever.invoke(retrieval_query)

    context = format_documents(retrieved_documents)
    chat_history = format_chat_history(history)
    sources = collect_sources(retrieved_documents)

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            ("human", ANSWER_TEMPLATE),
        ]
    )

    llm = get_llm()
    chain = prompt | llm

    try:
        response = chain.invoke(
            {
                "chat_history": chat_history,
                "context": context,
                "image_text": image_text or "No uploaded file text provided.",
                "question": question,
            }
        )
    except Exception as error:
        if is_quota_error(error):
            return {
                "answer": build_retrieval_fallback_answer(question, retrieved_documents),
                "sources": sources,
                "retrieved_context": context,
            }

        raise

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
        "how are you",
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
