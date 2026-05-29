import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
  "Hi, I’m NomadScholar AI. Ask me about scholarships, admissions, required documents, deadlines, or upload a screenshot of application requirements.",
      sources: [],
    },
  ]);

  const [question, setQuestion] = useState("");
  const [image, setImage] = useState(null);
  const [checklistText, setChecklistText] = useState("");
  const [checklistResult, setChecklistResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);

  const exampleQuestions = [
    "What documents do I need for a DAAD scholarship?",
    "شو المستندات المطلوبة للتقديم على منحة؟",
    "What should I prepare for Erasmus Mundus?",
    "Can you guarantee I will get accepted?",
  ];

  function buildHistory() {
    const conversation = messages.filter(
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

  async function sendTextQuestion(finalQuestion) {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: finalQuestion,
        history: buildHistory(),
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

    const userMessage = {
      role: "user",
      content: finalQuestion || "Please explain the uploaded image.",
      sources: [],
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const data = image
        ? await sendImageQuestion(finalQuestion)
        : await sendTextQuestion(finalQuestion);

      const assistantMessage = {
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
      setImage(null);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: `Something went wrong: ${error.message}`,
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
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
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">🎓</div>
          <div>
            <h1>NomadScholar AI</h1>
            <p>Bilingual multimodal RAG assistant</p>
          </div>
        </div>

        <div className="panel">
          <h2>AI system</h2>
          <ul>
            <li>LangChain RAG pipeline</li>
            <li>ChromaDB vector retrieval</li>
            <li>Gemini generation</li>
            <li>EasyOCR image input</li>
            <li>Pydantic structured output</li>
            <li>FastAPI + React architecture</li>
          </ul>
        </div>

        <div className="panel">
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
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`message ${message.role}`}
                >
                  <div className="message-bubble">
                    <div className="message-role">
                      {message.role === "user" ? "You" : "NomadScholar AI"}
                    </div>

                    <div className="message-content">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>

                    {message.sources?.length > 0 && (
                      <div className="sources">
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
              ))}

              {loading && (
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
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask in English or Arabic..."
                rows={3}
              />

              <div className="form-row">
                <label className="file-input">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(event) => setImage(event.target.files[0] || null)}
                  />
                  {image ? image.name : "Upload screenshot"}
                </label>

                <button type="submit" disabled={loading}>
                  {loading ? "Thinking..." : "Send"}
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
              <pre className="json-output">
                {JSON.stringify(checklistResult, null, 2)}
              </pre>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;