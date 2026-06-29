import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserTasks } from "../services/api";
import { Send, Bot, User } from "lucide-react";
import "./ChatPage.css";

const WELCOME = `Hi! I'm DeadlineGuardian AI 👋\n\nI can help you:\n• Break down tasks\n• Analyze deadline risks\n• Create work schedule\n• Give productivity advice\n\nWhat do you need help with?`;
const KEY = process.env.REACT_APP_GEMINI_API_KEY || "";
const MODEL = "gemini-2.0-flash-lite";

async function callGemini(message, tasks) {
  if (!KEY) return "Add REACT_APP_GEMINI_API_KEY to frontend/.env and restart npm start.";
  const taskSummary = tasks.slice(0, 3).map(t => `- ${t.title} (${t.risk_level}, ${t.progress || 0}% done, due ${t.deadline})`).join("\n");
  const prompt = `You are DeadlineGuardian AI. Be concise (2-3 sentences).\nUser tasks:\n${taskSummary || "none"}\nUser: ${message}`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (data.error?.code === 429) return "⏳ Rate limit hit. Wait 1 minute and try again.";
    if (data.error) return `Error: ${data.error.message}`;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  } catch { return "Connection failed. Check internet."; }
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([{ role: "ai", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (user) getUserTasks(user.uid).then(r => setTasks(r.data)).catch(() => { }); }, [user]);

  const send = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    setMessages(p => [...p, { role: "user", text: msg }]);
    setInput(""); setLoading(true);
    const reply = await callGemini(msg, tasks);
    setMessages(p => [...p, { role: "ai", text: reply }]);
    setLoading(false);
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <Bot size={22} color="var(--accent)" />
        <div><h1>AI Chat</h1><p className="text-muted">Powered by Gemini</p></div>
      </div>

      {!KEY && (
        <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "var(--warning)", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>
          ⚠ Add <code>REACT_APP_GEMINI_API_KEY=your_key</code> to <code>frontend/.env</code> then restart npm
        </div>
      )}

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-avatar">{msg.role === "ai" ? <Bot size={14} /> : <User size={14} />}</div>
            <div className="message-bubble">
              {msg.text.split("\n").map((line, j) => <p key={j}>{line}</p>)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message ai">
            <div className="message-avatar"><Bot size={14} /></div>
            <div className="message-bubble typing"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="quick-actions">
        {["What are my riskiest tasks?", "Help me plan my day", "I missed a session, what now?", "How do I improve focus?"].map(q => (
          <button key={q} className="quick-btn" onClick={() => send(q)}>{q}</button>
        ))}
      </div>

      <div className="chat-input-form">
        <input value={input} onChange={e => setInput(e.target.value)} disabled={loading}
          placeholder="Ask me anything..." onKeyDown={e => e.key === "Enter" && send()} />
        <button className="btn-primary send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}