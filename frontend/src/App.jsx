import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const DEFAULT_MESSAGES = [
  {
    role: "assistant",
    content:
      "Hi, I’m NomadScholar AI. Ask me about scholarships, admissions, required documents, deadlines, or upload a screenshot of application requirements.",
    sources: [],
  },
];

function isArabicText(text) {
  return /[\u0600-\u06FF]/.test(text || "");
}

function isLowQualityTitle(text) {
  const cleaned = text.trim();

  if (cleaned.length < 4) {
    return true;
  }

  if (/(.)\1{5,}/.test(cleaned)) {
    return true;
  }

  const hasEnoughLetters = /[a-zA-Z\u0600-\u06FF]{4,}/.test(cleaned);
  return !hasEnoughLetters;
}

function createChatTitle(messages) {
  const firstUserMessage = messages.find((message) => message.role === "user");

  if (!firstUserMessage) {
    return "New chat";
  }

  const originalText = firstUserMessage.content.trim();
  const text = originalText.toLowerCase();
  const hasArabic = isArabicText(originalText);

  if (isLowQualityTitle(originalText)) {
    return "General question";
  }

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

  if (text.includes("daad")) {
    return "DAAD scholarship guidance";
  }

  if (text.includes("france") || text.includes("french")) {
    return "France master’s options";
  }

  if (text.includes("erasmus")) {
    return "Erasmus Mundus guidance";
  }

  if (text.includes("guarantee") || text.includes("accepted")) {
    return "Admission guarantee question";
  }

  if (
    text.includes("screenshot") ||
    text.includes("image") ||
    text.includes("uploaded")
  ) {
    return "Screenshot analysis";
  }

  if (text.includes("documents") || text.includes("requirements")) {
    return "Application requirements";
  }

  if (text.includes("scholarship")) {
    return "Scholarship guidance";
  }

  if (text.includes("master") || text.includes("masters")) {
    return "Master’s application guidance";
  }

  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return "Welcome chat";
  }

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

function loadSavedChats() {
  const savedChats = localStorage.getItem("nomadscholar_chats");
  const activeChatId = localStorage.getItem("nomadscholar_active_chat_id");

  if (!savedChats) {
    const initialChat = createNewChat();

    return {
      chats: [initialChat],
      activeChatId: initialChat.id,
    };
  }

  try {
    const parsedChats = JSON.parse(savedChats);

    if (!Array.isArray(parsedChats) || parsedChats.length === 0) {
      const initialChat = createNewChat();

      return {
        chats: [initialChat],
        activeChatId: initialChat.id,
      };
    }

    const validActiveChat = parsedChats.some((chat) => chat.id === activeChatId);

    return {
      chats: parsedChats,
      activeChatId: validActiveChat ? activeChatId : parsedChats[0].id,
    };
  } catch {
    const initialChat = createNewChat();

    return {
      chats: [initialChat],
      activeChatId: initialChat.id,
    };
  }
}

function App() {
  const savedState = loadSavedChats();

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

  const activeChat =
    chats.find((chat) => chat.id === activeChatId) || chats[0];

  const messages = activeChat?.messages || DEFAULT_MESSAGES;
  const isActiveChatLoading = loadingChatId === activeChatId;

  const exampleQuestions = [
    "What documents do I need for a DAAD scholarship?",
    "شو المستندات المطلوبة للتقديم على منحة؟",
    "What should I prepare for Erasmus Mundus?",
    "Can you guarantee I will get accepted?",
  ];

  useEffect(() => {
    localStorage.setItem("nomadscholar_chats", JSON.stringify(chats));
    localStorage.setItem("nomadscholar_active_chat_id", activeChatId);
  }, [chats, activeChatId]);

  function clearDraftState() {
    setQuestion("");
    setImage(null);
  }

  function switchChat(chatId) {
    setActiveChatId(chatId);
    clearDraftState();
  }

  function updateChatMessages(chatId, nextMessages, moveToTop = false) {
    setChats((currentChats) => {
      const updatedChats = currentChats.map((chat) => {
        if (chat.id !== chatId) {
          return chat;
        }

        return {
          ...chat,
          title: createChatTitle(nextMessages),
          updatedAt: new Date().toISOString(),
          messages: nextMessages,
        };
      });

      if (!moveToTop) {
        return updatedChats;
      }

      const updatedChat = updatedChats.find((chat) => chat.id === chatId);
      const otherChats = updatedChats.filter((chat) => chat.id !== chatId);

      return updatedChat ? [updatedChat, ...otherChats] : updatedChats;
    });
  }

  function startNewChat() {
    const currentChat = chats.find((chat) => chat.id === activeChatId);
    const currentMessages = currentChat?.messages || [];

    const hasUserMessages = currentMessages.some(
      (message) => message.role === "user"
    );

    clearDraftState();
    setChecklistResult(null);

    if (!hasUserMessages) {
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
        return [newChat];
      }

      if (chatIdToDelete === activeChatId) {
        setActiveChatId(remainingChats[0].id);
        clearDraftState();
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

  async function sendTextQuestion(finalQuestion, currentMessages) {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

  async function sendImageQuestion(finalQuestion) {
    const formData = new FormData();
    formData.append("question", finalQuestion);
    formData.append("image", image);

    const response = await fetch(`${API_BASE_URL}/api/chat-with-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to process image.");
    }

    return response.json();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const finalQuestion = question.trim();

    if (!finalQuestion && !image) {
      return;
    }

    const chatIdForRequest = activeChatId;

    const userMessage = {
      role: "user",
      content: finalQuestion || "Please explain the uploaded image.",
      sources: [],
      imagePreview: image ? URL.createObjectURL(image) : null,
    };

    const messagesWithUserQuestion = [...messages, userMessage];

    updateChatMessages(chatIdForRequest, messagesWithUserQuestion, true);
    setActiveChatId(chatIdForRequest);
    clearDraftState();
    setLoadingChatId(chatIdForRequest);

    try {
      const data = image
        ? await sendImageQuestion(finalQuestion)
        : await sendTextQuestion(finalQuestion, messagesWithUserQuestion);

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
            content: `Something went wrong: ${error.message}`,
            sources: [],
          },
        ],
        true
      );
    } finally {
      setLoadingChatId(null);
    }
  }

  async function handleChecklistExtraction() {
    if (!checklistText.trim()) {
      return;
    }

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

  function handleExampleClick(exampleQuestion) {
    setQuestion(exampleQuestion);
  }

  return (
    <div className={`app ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand">
            <div className="logo">🎓</div>
            <div className="brand-copy">
              <h1>NomadScholar AI</h1>
              <p>Bilingual multimodal RAG assistant</p>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-collapse-button"
            onClick={() => setSidebarCollapsed((current) => !current)}
            title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            {sidebarCollapsed ? "☰" : "←"}
          </button>
        </div>

        <div className="panel conversation-panel">
          <div className="conversation-header">
            <h2>Conversations</h2>
            <button type="button" className="new-chat-button" onClick={startNewChat}>
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
        </div>

        <div className="panel examples-panel">
          <h2>Try examples</h2>
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
        </div>

        <div className="panel disclaimer">
          <strong>Disclaimer</strong>
          <p>
            This assistant explains application information from retrieved
            sources. It does not guarantee admission, scholarships, visas, or
            funding.
          </p>
        </div>
      </aside>

      <main className="main">
        <section className="hero">
          <p className="eyebrow">LLM course capstone project</p>
          <h2>
            Scholarship and university application guidance, grounded in
            retrieved sources.
          </h2>
          <p>
            Ask in English or Arabic. Upload screenshots of requirements,
            deadlines, or checklists. Get clear answers, source references, and
            structured next steps.
          </p>
        </section>

        <section className="content-grid">
          <div className="chat-card">
            <div className="section-header">
              <div>
                <h3>Assistant</h3>
                <p>Conversational RAG with optional image input</p>
              </div>
              <span>RAG chat</span>
            </div>

            <div className="messages">
              {messages.map((message, index) => {
                const messageIsArabic = isArabicText(message.content);

                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`message ${message.role}`}
                  >
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

                      <div
                        className={`message-content ${
                          messageIsArabic ? "rtl-content" : ""
                        }`}
                      >
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>

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
                    </div>
                  </div>
                );
              })}

              {isActiveChatLoading && (
                <div className="message assistant">
                  <div className="message-bubble">
                    <div className="typing">
                      Retrieving sources and generating answer...
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
                <label className="composer-attach-button" title="Attach image">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(event) => setImage(event.target.files[0] || null)}
                  />
                  ＋
                </label>

                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask in English or Arabic..."
                  rows={1}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmit(event);
                    }
                  }}
                />

                <button
                  className="composer-send-button"
                  type="submit"
                  disabled={Boolean(loadingChatId)}
                >
                  {isActiveChatLoading ? "..." : "➤"}
                </button>
              </div>
            </form>
          </div>

          <div className="checklist-card">
            <div className="section-header">
              <div>
                <h3>Checklist extractor</h3>
                <p>Function calling / structured output</p>
              </div>
              <span>JSON</span>
            </div>

            <p className="small-text">
              Paste scholarship or admissions text to extract deadline, required
              documents, eligibility notes, missing information, and next steps.
            </p>

            <textarea
              className="checklist-textarea"
              value={checklistText}
              onChange={(event) => setChecklistText(event.target.value)}
              placeholder="Paste application requirements here..."
              rows={10}
            />

            <button
              className="full-button"
              type="button"
              disabled={checklistLoading}
              onClick={handleChecklistExtraction}
            >
              {checklistLoading ? "Extracting..." : "Extract checklist"}
            </button>

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
                        <p className="empty-result">
                          No required documents detected.
                        </p>
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
                        <p className="empty-result">
                          No eligibility notes detected.
                        </p>
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