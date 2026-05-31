import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const DEFAULT_MESSAGES = [];

function GraduationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="app-icon" aria-hidden="true">
      <path d="M3.5 8.4 12 4.2l8.5 4.2L12 12.6 3.5 8.4Z" />
      <path d="M7.4 10.7v4.5c0 1.5 2.1 2.8 4.6 2.8s4.6-1.3 4.6-2.8v-4.5" />
      <path d="M19.2 9.2v4.3" />
      <path d="M19.2 13.5c.7.5.9 1.2.7 2" />
    </svg>
  );
}

function JourneyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="journey-icon" aria-hidden="true">
      <path d="M4.2 17.8C7.8 12 12.6 8.4 20 6.4" />
      <path d="M15.7 5.6 20 6.4l-2.9 3.3" />
      <path d="M5.3 18.2h4.1" />
      <path d="M12 14.2h4.8" />
      <circle cx="5.3" cy="18.2" r="1.25" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="attach-svg-icon" aria-hidden="true">
      <rect x="4" y="5" width="16" height="14" rx="2.4" />
      <path d="M7.4 16.4 10.8 13l2.4 2.2 1.7-1.7 2.7 2.9" />
      <circle cx="8.7" cy="9.5" r="1.15" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" className="attach-svg-icon" aria-hidden="true">
      <path d="M7 3.8h6.1L18 8.7v11.5H7V3.8Z" />
      <path d="M13 4v5h5" />
      <path d="M9.2 13h5.6" />
      <path d="M9.2 16h3.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="theme-icon" aria-hidden="true">
      <path d="M20.2 15.3A8.2 8.2 0 0 1 8.7 3.8 8.7 8.7 0 1 0 20.2 15.3Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="theme-icon" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.8v2.1" />
      <path d="M12 19.1v2.1" />
      <path d="M4.9 4.9l1.5 1.5" />
      <path d="M17.6 17.6l1.5 1.5" />
      <path d="M2.8 12h2.1" />
      <path d="M19.1 12h2.1" />
      <path d="M4.9 19.1l1.5-1.5" />
      <path d="M17.6 6.4l1.5-1.5" />
    </svg>
  );
}

function isArabicText(text) {
  return /[\u0600-\u06FF]/.test(text || "");
}

function isLowQualityTitle(text) {
  const cleaned = text.trim();

  if (cleaned.length < 4) return true;
  if (/(.)\1{5,}/.test(cleaned)) return true;

  const hasEnoughLetters = /[a-zA-Z\u0600-\u06FF]{4,}/.test(cleaned);
  return !hasEnoughLetters;
}

function createChatTitle(messages) {
  const firstUserMessage = messages.find((message) => message.role === "user");

  if (!firstUserMessage) return "New chat";

  const originalText = firstUserMessage.content.trim();
  const text = originalText.toLowerCase();
  const hasArabic = isArabicText(originalText);

  if (isLowQualityTitle(originalText)) return "General question";

  if (hasArabic) {
    if (originalText.includes("منحة") || originalText.includes("المستندات")) {
      return "قائمة مستندات المنحة";
    }

    if (originalText.includes("قبول") || originalText.includes("انقبل")) {
      return "سؤال عن القبول";
    }

    if (originalText.includes("جامعة") || originalText.includes("ماجستير")) {
      return "إرشاد جامعي";
    }

    return originalText.length <= 24
      ? originalText
      : `${originalText.slice(0, 24)}...`;
  }

  if (text.includes("daad")) return "DAAD scholarship guidance";
  if (text.includes("france") || text.includes("french")) return "France study options";
  if (text.includes("erasmus")) return "Erasmus Mundus guidance";
  if (text.includes("guarantee") || text.includes("accepted")) return "Admission guarantee question";
  if (text.includes("screenshot") || text.includes("image") || text.includes("uploaded")) return "File analysis";
  if (text.includes("documents") || text.includes("requirements")) return "Application requirements";
  if (text.includes("scholarship")) return "Scholarship guidance";
  if (text.includes("master") || text.includes("masters")) return "Master’s application guidance";
  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) return "Welcome chat";

  return "General application question";
}

function createNewChat() {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: DEFAULT_MESSAGES,
  };
}

function isEmptyChat(chat) {
  return !(chat?.messages || []).some((message) => message.role === "user");
}

function loadSavedChats() {
  const savedChats = localStorage.getItem("nomadscholar_chats");
  const sessionActiveChatId = sessionStorage.getItem(
    "nomadscholar_session_active_chat_id"
  );

  if (!savedChats) {
    const initialChat = createNewChat();

    sessionStorage.setItem(
      "nomadscholar_session_active_chat_id",
      initialChat.id
    );

    return { chats: [initialChat], activeChatId: initialChat.id };
  }

  try {
    const parsedChats = JSON.parse(savedChats);

    if (!Array.isArray(parsedChats) || parsedChats.length === 0) {
      const initialChat = createNewChat();

      sessionStorage.setItem(
        "nomadscholar_session_active_chat_id",
        initialChat.id
      );

      return { chats: [initialChat], activeChatId: initialChat.id };
    }

    const cleanedChats = parsedChats.map((chat) => ({
      ...chat,
      messages: Array.isArray(chat.messages)
        ? chat.messages.filter(
            (message) =>
              !(
                message.role === "assistant" &&
                message.content ===
                  "Hi, I’m NomadScholar AI. Ask a question or upload a screenshot or PDF."
              )
          )
        : [],
    }));

    const sessionChatStillExists = cleanedChats.some(
      (chat) => chat.id === sessionActiveChatId
    );

    if (sessionActiveChatId && sessionChatStillExists) {
      return {
        chats: cleanedChats,
        activeChatId: sessionActiveChatId,
      };
    }

    const existingEmptyChat = cleanedChats.find((chat) => isEmptyChat(chat));

    if (existingEmptyChat) {
      sessionStorage.setItem(
        "nomadscholar_session_active_chat_id",
        existingEmptyChat.id
      );

      return {
        chats: cleanedChats,
        activeChatId: existingEmptyChat.id,
      };
    }

    const freshChat = createNewChat();

    sessionStorage.setItem("nomadscholar_session_active_chat_id", freshChat.id);

    return {
      chats: [freshChat, ...cleanedChats],
      activeChatId: freshChat.id,
    };
  } catch {
    const initialChat = createNewChat();

    sessionStorage.setItem(
      "nomadscholar_session_active_chat_id",
      initialChat.id
    );

    return { chats: [initialChat], activeChatId: initialChat.id };
  }
}

function getSavedTheme() {
  return localStorage.getItem("nomadscholar_theme") === "dark" ? "dark" : "light";
}

function App() {
  const savedState = loadSavedChats();
  const abortControllerRef = useRef(null);
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const [chats, setChats] = useState(savedState.chats);
  const [activeChatId, setActiveChatId] = useState(savedState.activeChatId);
  const [question, setQuestion] = useState("");
  const [image, setImage] = useState(null);
  const [checklistText, setChecklistText] = useState("");
  const [checklistResult, setChecklistResult] = useState(null);
  const [loadingChatId, setLoadingChatId] = useState(null);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [copiedMessageKey, setCopiedMessageKey] = useState(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getSavedTheme);

  const activeChat = chats.find((chat) => chat.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || DEFAULT_MESSAGES;
  const isActiveChatLoading = loadingChatId === activeChatId;
  const hasStartedChat = messages.some((message) => message.role === "user");

  const exampleQuestions = [
    "What documents do I need for a DAAD scholarship?",
    "شو المستندات المطلوبة للتقديم على منحة؟",
    "What should I prepare for Erasmus Mundus?",
    "Can you guarantee I will get accepted?",
  ];

  useEffect(() => {
    localStorage.setItem("nomadscholar_chats", JSON.stringify(chats));
    sessionStorage.setItem("nomadscholar_session_active_chat_id", activeChatId);
  }, [chats, activeChatId]);

  useEffect(() => {
    localStorage.setItem("nomadscholar_theme", theme);
  }, [theme]);

  function clearDraftState() {
    setQuestion("");
    setImage(null);
    setAttachMenuOpen(false);
  }

  function clearEditingState() {
    setEditingMessageIndex(null);
    setEditingText("");
  }

  function clearChecklistState() {
    setChecklistText("");
    setChecklistResult(null);
  }

  function switchChat(chatId) {
    if (chatId === activeChatId) return;

    const currentChat = chats.find((chat) => chat.id === activeChatId);
    const currentChatIsEmpty = isEmptyChat(currentChat);

    clearDraftState();
    clearEditingState();
    clearChecklistState();

    setActiveChatId(chatId);

    if (currentChatIsEmpty) {
      setChats((currentChats) =>
        currentChats.filter((chat) => chat.id !== activeChatId)
      );
    }
  }

  function updateChatMessages(chatId, nextMessages, moveToTop = false) {
    setChats((currentChats) => {
      const updatedChats = currentChats.map((chat) => {
        if (chat.id !== chatId) return chat;

        return {
          ...chat,
          title: createChatTitle(nextMessages),
          updatedAt: new Date().toISOString(),
          messages: nextMessages,
        };
      });

      if (!moveToTop) return updatedChats;

      const updatedChat = updatedChats.find((chat) => chat.id === chatId);
      const otherChats = updatedChats.filter((chat) => chat.id !== chatId);

      return updatedChat ? [updatedChat, ...otherChats] : updatedChats;
    });
  }

  function startNewChat() {
    clearDraftState();
    clearEditingState();
    clearChecklistState();

    const existingEmptyChat = chats.find((chat) => isEmptyChat(chat));

    if (existingEmptyChat) {
      setActiveChatId(existingEmptyChat.id);
      return;
    }

    const newChat = createNewChat();

    setChats((currentChats) => [newChat, ...currentChats]);
    setActiveChatId(newChat.id);
  }

  function deleteChat(chatIdToDelete) {
    setChats((currentChats) => {
      const remainingChats = currentChats.filter(
        (chat) => chat.id !== chatIdToDelete
      );

      if (remainingChats.length === 0) {
        const newChat = createNewChat();
        setActiveChatId(newChat.id);
        clearDraftState();
        clearEditingState();
        clearChecklistState();
        return [newChat];
      }

      if (chatIdToDelete === activeChatId) {
        setActiveChatId(remainingChats[0].id);
        clearDraftState();
        clearEditingState();
        clearChecklistState();
      }

      return remainingChats;
    });
  }

  function buildHistory(currentMessages) {
    const conversation = currentMessages.filter(
      (message) => message.role === "user" || message.role === "assistant"
    );

    const history = [];

    for (let index = 0; index < conversation.length - 1; index += 2) {
      const userMessage = conversation[index];
      const assistantMessage = conversation[index + 1];

      if (
        userMessage?.role === "user" &&
        assistantMessage?.role === "assistant"
      ) {
        history.push({
          user: userMessage.content,
          assistant: assistantMessage.content,
        });
      }
    }

    return history;
  }

  async function sendTextQuestion(finalQuestion, currentMessages, signal) {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
      body: JSON.stringify({
        question: finalQuestion,
        history: buildHistory(currentMessages),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get answer.");
    }

    return response.json();
  }

  async function sendFileQuestion(finalQuestion, signal) {
    const formData = new FormData();
    formData.append("question", finalQuestion);
    formData.append("file", image);

    const response = await fetch(`${API_BASE_URL}/api/chat-with-file`, {
      method: "POST",
      body: formData,
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to process file.");
    }

    return response.json();
  }

  function getFriendlyErrorMessage(error) {
    if (error.name === "AbortError") return "Response stopped.";

    if (
      error.message.includes("RESOURCE_EXHAUSTED") ||
      error.message.includes("429")
    ) {
      return (
        "The Gemini API quota was reached. Please wait about a minute and try again. " +
        "If this keeps happening, the project may need a different API key, billing enabled, or a lower-traffic model."
      );
    }

    return `Something went wrong: ${error.message}`;
  }

  async function requestAssistantAnswer({
    chatIdForRequest,
    messagesWithUserQuestion,
    finalQuestion,
    fileWasAttached = false,
  }) {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoadingChatId(chatIdForRequest);

    try {
      const data = fileWasAttached
        ? await sendFileQuestion(finalQuestion, controller.signal)
        : await sendTextQuestion(
            finalQuestion,
            messagesWithUserQuestion,
            controller.signal
          );

      const assistantMessage = {
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
      };

      updateChatMessages(
        chatIdForRequest,
        [...messagesWithUserQuestion, assistantMessage],
        true
      );
    } catch (error) {
      updateChatMessages(
        chatIdForRequest,
        [
          ...messagesWithUserQuestion,
          {
            role: "assistant",
            content: getFriendlyErrorMessage(error),
            sources: [],
          },
        ],
        true
      );
    } finally {
      setLoadingChatId(null);
      abortControllerRef.current = null;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loadingChatId) {
      stopAnswer();
      return;
    }

    const finalQuestion = question.trim();

    if (!finalQuestion && !image) return;

    const chatIdForRequest = activeChatId;
    const fileWasAttached = Boolean(image);

    const userMessage = {
      role: "user",
      content: finalQuestion || "Please explain the uploaded file.",
      sources: [],
      imagePreview:
        image && image.type.startsWith("image/")
          ? URL.createObjectURL(image)
          : null,
      fileName: image ? image.name : null,
      fileType: image ? image.type : null,
    };

    const messagesWithUserQuestion = [...messages, userMessage];

    updateChatMessages(chatIdForRequest, messagesWithUserQuestion, true);
    setActiveChatId(chatIdForRequest);
    clearDraftState();
    clearEditingState();

    await requestAssistantAnswer({
      chatIdForRequest,
      messagesWithUserQuestion,
      finalQuestion,
      fileWasAttached,
    });
  }

  function stopAnswer() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  async function regenerateFromEditedMessage(messageIndex, newContent) {
    const trimmedContent = newContent.trim();

    if (!trimmedContent || loadingChatId) return;

    const chatIdForRequest = activeChatId;
    const messagesBeforeEdit = messages.slice(0, messageIndex);
    const originalMessage = messages[messageIndex];

    const editedUserMessage = {
      ...originalMessage,
      content: trimmedContent,
    };

    const messagesWithEditedQuestion = [...messagesBeforeEdit, editedUserMessage];

    updateChatMessages(chatIdForRequest, messagesWithEditedQuestion, true);
    clearEditingState();

    await requestAssistantAnswer({
      chatIdForRequest,
      messagesWithUserQuestion: messagesWithEditedQuestion,
      finalQuestion: trimmedContent,
      fileWasAttached: false,
    });
  }

  function beginEditMessage(index, content) {
    if (loadingChatId) return;
    setEditingMessageIndex(index);
    setEditingText(content);
  }

  function cancelEditMessage() {
    clearEditingState();
  }

  function copyMessage(text, key) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedMessageKey(key);
        window.setTimeout(() => setCopiedMessageKey(null), 1200);
      })
      .catch(() => {
        setCopiedMessageKey(null);
      });
  }

  async function handleChecklistExtraction() {
    if (!checklistText.trim()) return;

    setChecklistLoading(true);
    setChecklistResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/checklist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: checklistText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to extract checklist.");
      }

      const data = await response.json();
      setChecklistResult(data);
    } catch (error) {
      setChecklistResult({
        error: error.message,
      });
    } finally {
      setChecklistLoading(false);
    }
  }

  function clearChecklist() {
    clearChecklistState();
  }

  function downloadChecklistPdf() {
    if (!checklistResult || checklistResult.error) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxWidth = pageWidth - margin * 2;
    let y = 56;

    function addPageIfNeeded(extraHeight = 40) {
      if (y + extraHeight > pageHeight - margin) {
        doc.addPage();
        y = 56;
      }
    }

    function addTitle(text) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(13, 27, 42);
      doc.text(text, margin, y);
      y += 30;
    }

    function addSection(title) {
      addPageIfNeeded(34);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(35, 87, 137);
      doc.text(title.toUpperCase(), margin, y);
      y += 18;
    }

    function addParagraph(text) {
      addPageIfNeeded(32);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(23, 33, 43);

      const lines = doc.splitTextToSize(text || "Not mentioned", maxWidth);

      lines.forEach((line) => {
        addPageIfNeeded(15);
        doc.text(line, margin, y);
        y += 14;
      });

      y += 8;
    }

    function addList(items) {
      if (!items || items.length === 0) {
        addParagraph("None detected.");
        return;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(23, 33, 43);

      items.forEach((item) => {
        const lines = doc.splitTextToSize(String(item), maxWidth - 18);
        addPageIfNeeded(18);

        doc.text("•", margin, y);
        doc.text(lines[0], margin + 18, y);
        y += 14;

        lines.slice(1).forEach((line) => {
          addPageIfNeeded(15);
          doc.text(line, margin + 18, y);
          y += 14;
        });

        y += 4;
      });

      y += 8;
    }

    addTitle("NomadScholar AI Checklist");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 113, 129);
    doc.text(
      "Generated from extracted scholarship/admissions information.",
      margin,
      y
    );
    y += 28;

    addSection("Deadline");
    addParagraph(checklistResult.deadline || "Not mentioned");

    addSection("Required documents");
    addList(checklistResult.required_documents);

    addSection("Eligibility notes");
    addList(checklistResult.eligibility_notes);

    addSection("Missing information");
    addList(checklistResult.missing_information);

    addSection("Next steps");
    addList(checklistResult.next_steps);

    const pageCount = doc.internal.getNumberOfPages();

    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(130, 145, 162);
      doc.text(
        `NomadScholar AI • Page ${page} of ${pageCount}`,
        margin,
        pageHeight - 24
      );
    }

    doc.save("nomadscholar-checklist.pdf");
  }

  function handleExampleClick(exampleQuestion) {
    setQuestion(exampleQuestion);
  }

  function handleAttachedFile(file) {
    if (!file) return;
    setImage(file);
    setAttachMenuOpen(false);
  }

  function openImagePicker() {
    setAttachMenuOpen(false);
    imageInputRef.current?.click();
  }

  function openPdfPicker() {
    setAttachMenuOpen(false);
    pdfInputRef.current?.click();
  }

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  return (
    <div
      className={`app theme-${theme} ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="aurora aurora-three" />
      <div className="mesh-grid" />

      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand">
            <div className="logo-orb">
              <GraduationIcon />
            </div>
            <div className="brand-copy">
              <h1>NomadScholar</h1>
              <p>AI admissions guide</p>
            </div>
          </div>

          <div className="sidebar-actions">
            <button
              type="button"
              className="theme-toggle-button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            <button
              type="button"
              className="sidebar-collapse-button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
              {sidebarCollapsed ? "☰" : "←"}
            </button>
          </div>
        </div>

        <div className="sidebar-shell">
          <section className="sidebar-block">
            <div className="section-mini-header">
              <h2>Chats</h2>
              <button
                type="button"
                className="new-chat-button"
                onClick={startNewChat}
              >
                New
              </button>
            </div>

            <div className="chat-list">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-list-item ${
                    chat.id === activeChatId ? "active" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="chat-title-button"
                    onClick={() => switchChat(chat.id)}
                  >
                    <span className="chat-dot" />
                    {chat.title}
                  </button>

                  <button
                    type="button"
                    className="delete-chat-button"
                    onClick={() => deleteChat(chat.id)}
                    title="Delete chat"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="sidebar-block">
            <div className="section-mini-header">
              <h2>Quick asks</h2>
            </div>

            <div className="examples">
              {exampleQuestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="example-button"
                  onClick={() => handleExampleClick(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <div className="sidebar-footer-note">
            This assistant explains retrieved admissions information. It does not
            guarantee admission, scholarships, visas, or funding.
          </div>
        </div>
      </aside>

      <main className="main">
        <section className="hero minimal-hero">
          <div className="hero-copy">
            <h2>Scholarship and admissions guidance.</h2>
            <p>Ask, upload, extract, and plan.</p>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-orbit">
              <div className="orbit-core" />
              <div className="float-orb orb-one" />
              <div className="float-orb orb-two" />
              <div className="float-orb orb-three" />
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="chat-card chat-card-large">
            <div className="section-header section-header-minimal">
              <h3>Assistant</h3>
              <span>Live</span>
            </div>

            <div className="messages">
              {!hasStartedChat && !isActiveChatLoading && (
                <div className="empty-chat-state">
                  <div className="welcome-stage">
                    <div className="welcome-glow" />
                    <div className="welcome-orbit orbit-a" />
                    <div className="welcome-card-mini card-mini-one" />
                    <div className="welcome-card-mini card-mini-two" />
                    <div className="empty-chat-orb">
                      <JourneyIcon />
                    </div>
                  </div>

                  <h2>Turn your study plans into a real opportunity.</h2>
                  <p>
                    Ask about scholarships, admissions, documents, or upload a PDF.
                  </p>
                </div>
              )}

              {messages.map((message, index) => {
                const messageIsArabic = isArabicText(message.content);
                const messageKey = `${activeChatId}-${message.role}-${index}`;
                const isEditingThisMessage = editingMessageIndex === index;
                const canEditUserMessage =
                  message.role === "user" &&
                  !message.fileName &&
                  !isActiveChatLoading;
                const canCopyMessage =
                  message.role === "user" || message.role === "assistant";

                return (
                  <div key={messageKey} className={`message ${message.role}`}>
                    <div
                      className={`message-bubble ${
                        messageIsArabic ? "rtl-bubble" : ""
                      }`}
                      dir={messageIsArabic ? "rtl" : "ltr"}
                    >
                      <div className="message-role">
                        {message.role === "user" ? "You" : "NomadScholar AI"}
                      </div>

                      {message.imagePreview && (
                        <button
                          type="button"
                          className="image-preview-button"
                          onClick={() => setPreviewImage(message.imagePreview)}
                        >
                          <img
                            src={message.imagePreview}
                            alt="Uploaded application screenshot"
                            className="message-image-preview"
                          />
                        </button>
                      )}

                      {message.fileName && !message.imagePreview && (
                        <div className="message-file-preview">
                          <span className="file-icon">
                            {message.fileType === "application/pdf" ? "PDF" : "FILE"}
                          </span>
                          <span>{message.fileName}</span>
                        </div>
                      )}

                      {isEditingThisMessage ? (
                        <div className="inline-edit-box" dir="ltr">
                          <textarea
                            value={editingText}
                            onChange={(event) => setEditingText(event.target.value)}
                            autoFocus
                          />
                          <div className="inline-edit-actions">
                            <button
                              type="button"
                              className="mini-action-button secondary-action"
                              onClick={cancelEditMessage}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="mini-action-button"
                              onClick={() =>
                                regenerateFromEditedMessage(index, editingText)
                              }
                            >
                              Save & send
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`message-content ${
                            messageIsArabic ? "rtl-content" : ""
                          }`}
                        >
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      )}

                      {message.sources?.length > 0 && (
                        <div className="sources" dir="ltr">
                          <strong>Retrieved sources</strong>
                          <div>
                            {message.sources.map((source) => (
                              <span key={source} className="source-pill">
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isEditingThisMessage && canCopyMessage && (
                        <div className="message-actions" dir="ltr">
                          <button
                            type="button"
                            className="message-action-button"
                            onClick={() => copyMessage(message.content, messageKey)}
                          >
                            {copiedMessageKey === messageKey ? "Copied" : "Copy"}
                          </button>

                          {canEditUserMessage && (
                            <button
                              type="button"
                              className="message-action-button"
                              onClick={() => beginEditMessage(index, message.content)}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isActiveChatLoading && (
                <div className="message assistant">
                  <div className="message-bubble loading-bubble">
                    <div className="typing">
                      <span />
                      <span />
                      <span />
                      Retrieving sources and generating answer.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form className="chat-form" onSubmit={handleSubmit}>
              {image && (
                <div className="selected-file-preview">
                  <span>{image.name}</span>
                  <button type="button" onClick={() => setImage(null)}>
                    Remove
                  </button>
                </div>
              )}

              <div className="composer">
                <div className="attach-menu-wrapper">
                  <button
                    type="button"
                    className="composer-attach-button"
                    title="Attach file"
                    onClick={() => setAttachMenuOpen((current) => !current)}
                  >
                    ＋
                  </button>

                  {attachMenuOpen && (
                    <div className="attach-menu">
                      <button type="button" onClick={openImagePicker}>
                        <span className="attach-menu-icon">
                          <ImageIcon />
                        </span>
                        <span>
                          <strong>Attach picture</strong>
                          <small>PNG, JPG, JPEG</small>
                        </span>
                      </button>

                      <button type="button" onClick={openPdfPicker}>
                        <span className="attach-menu-icon">
                          <PdfIcon />
                        </span>
                        <span>
                          <strong>Attach PDF</strong>
                          <small>Digital PDF text</small>
                        </span>
                      </button>
                    </div>
                  )}

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden-file-input"
                    onChange={(event) => {
                      handleAttachedFile(event.target.files[0] || null);
                      event.target.value = "";
                    }}
                  />

                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden-file-input"
                    onChange={(event) => {
                      handleAttachedFile(event.target.files[0] || null);
                      event.target.value = "";
                    }}
                  />
                </div>

                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask in English or Arabic."
                  rows={1}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmit(event);
                    }
                  }}
                />

                <button
                  className={`composer-send-button ${
                    loadingChatId ? "composer-stop-button" : ""
                  }`}
                  type="submit"
                  title={loadingChatId ? "Stop response" : "Send"}
                >
                  {loadingChatId ? "■" : "➤"}
                </button>
              </div>
            </form>
          </div>

          <div className="checklist-card checklist-card-compact">
            <div className="section-header section-header-minimal">
              <h3>Checklist</h3>
              <span>JSON</span>
            </div>

            <textarea
              className="checklist-textarea"
              value={checklistText}
              onChange={(event) => setChecklistText(event.target.value)}
              placeholder="Paste application requirements here."
              rows={10}
            />

            <div className="checklist-actions">
              <button
                className="full-button"
                type="button"
                disabled={checklistLoading}
                onClick={handleChecklistExtraction}
              >
                {checklistLoading ? "Extracting..." : "Extract"}
              </button>

              <button
                className="clear-checklist-button"
                type="button"
                disabled={checklistLoading && !checklistText}
                onClick={clearChecklist}
              >
                Clear
              </button>

              {checklistResult && !checklistResult.error && (
                <button
                  className="download-checklist-button"
                  type="button"
                  onClick={downloadChecklistPdf}
                >
                  PDF
                </button>
              )}
            </div>

            {checklistResult && (
              <div className="checklist-result">
                {checklistResult.error ? (
                  <div className="result-error">{checklistResult.error}</div>
                ) : (
                  <>
                    <div className="result-card deadline-card">
                      <span className="result-label">Deadline</span>
                      <strong>{checklistResult.deadline || "Not mentioned"}</strong>
                    </div>

                    <div className="result-card">
                      <span className="result-label">Required documents</span>
                      {checklistResult.required_documents?.length > 0 ? (
                        <ul className="clean-list">
                          {checklistResult.required_documents.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-result">No required documents detected.</p>
                      )}
                    </div>

                    <div className="result-card">
                      <span className="result-label">Eligibility notes</span>
                      {checklistResult.eligibility_notes?.length > 0 ? (
                        <ul className="clean-list">
                          {checklistResult.eligibility_notes.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-result">No eligibility notes detected.</p>
                      )}
                    </div>

                    <div className="result-card">
                      <span className="result-label">Missing information</span>
                      {checklistResult.missing_information?.length > 0 ? (
                        <ul className="warning-list">
                          {checklistResult.missing_information.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-result">
                          No major missing information detected.
                        </p>
                      )}
                    </div>

                    <div className="result-card">
                      <span className="result-label">Next steps</span>
                      {checklistResult.next_steps?.length > 0 ? (
                        <ol className="step-list">
                          {checklistResult.next_steps.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                      ) : (
                        <p className="empty-result">No next steps generated.</p>
                      )}
                    </div>

                    <details className="raw-json">
                      <summary>View raw structured JSON</summary>
                      <pre className="json-output">
                        {JSON.stringify(checklistResult, null, 2)}
                      </pre>
                    </details>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {previewImage && (
        <div className="image-modal" onClick={() => setPreviewImage(null)}>
          <div className="image-modal-content">
            <button
              type="button"
              className="image-modal-close"
              onClick={() => setPreviewImage(null)}
            >
              ×
            </button>
            <img src={previewImage} alt="Expanded uploaded screenshot" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;