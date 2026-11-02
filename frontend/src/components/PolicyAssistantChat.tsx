import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { PolicyResponse, SuggestedPrompt } from '../types';
import { 
  Bot, Send, Sparkles, BookOpen, ChevronDown, ChevronUp, 
  HelpCircle, CheckCircle2, ShieldCheck, X, RefreshCw 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  responsePayload?: PolicyResponse;
  timestamp: string;
}

export const PolicyAssistantChat: React.FC<Props> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your AI Policy Assistant. Ask me anything about LeaveDesk leave policies, carry-forward rollover limits, medical note rules, or notice periods. I provide grounded answers with exact clause citations.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<SuggestedPrompt[]>([]);
  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getSuggestedPrompts().then(setSuggestedPrompts).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.queryPolicy(q.trim());
      const botMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: res.answer,
        responsePayload: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: `Error retrieving policy information: ${err.message || 'Server error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      width: '460px',
      maxWidth: 'calc(100vw - 2rem)',
      height: '620px',
      maxHeight: 'calc(100vh - 4rem)',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: '20px',
      boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), var(--shadow-glow-indigo)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflow: 'hidden',
    }} className="animate-fade-in">
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.3), rgba(139, 92, 246, 0.2))',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)',
          }}>
            <Bot size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                Policy AI Assistant
              </span>
              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '4px', fontWeight: 700 }}>
                RAG Pipeline Active
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Cites Official 2026 LeaveDesk Handbook
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Suggested prompts carousel chips */}
      {suggestedPrompts.length > 0 && messages.length <= 2 && (
        <div style={{
          padding: '0.65rem 1rem',
          background: 'rgba(0, 0, 0, 0.25)',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
        }}>
          {suggestedPrompts.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSend(p.prompt)}
              style={{
                whiteSpace: 'nowrap',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#c7d2fe',
                fontSize: '0.72rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkles size={12} color="var(--accent-indigo)" />
              <span>{p.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '88%',
                padding: '0.85rem 1rem',
                borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                background: msg.sender === 'user'
                  ? 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))'
                  : 'rgba(30, 41, 59, 0.75)',
                border: msg.sender === 'user'
                  ? 'none'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontSize: '0.85rem',
                lineHeight: '1.45',
                boxShadow: msg.sender === 'user' ? '0 4px 15px rgba(79, 70, 229, 0.3)' : 'none',
              }}
            >
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

              {/* RAG Citations and Key Takeaways */}
              {msg.responsePayload && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {/* Confidence meter */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ShieldCheck size={13} color="#34d399" />
                      <span>Grounded Citation Score:</span>
                    </div>
                    <strong style={{ color: '#34d399' }}>{(msg.responsePayload.confidence * 100).toFixed(0)}%</strong>
                  </div>

                  {/* Key Takeaways */}
                  {msg.responsePayload.key_takeaways.length > 0 && (
                    <div style={{ marginBottom: '0.6rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c7d2fe', marginBottom: '0.25rem' }}>
                        Key Takeaways:
                      </div>
                      <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.75rem', color: '#cbd5e1' }}>
                        {msg.responsePayload.key_takeaways.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Citations List */}
                  {msg.responsePayload.citations.map((c, i) => {
                    const citKey = `${msg.id}-${i}`;
                    const isExpanded = expandedCitationId === citKey;
                    return (
                      <div
                        key={citKey}
                        style={{
                          background: 'rgba(15, 23, 42, 0.8)',
                          borderRadius: '8px',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          padding: '0.45rem 0.65rem',
                          marginTop: '0.35rem',
                          fontSize: '0.75rem',
                        }}
                      >
                        <div
                          onClick={() => setExpandedCitationId(isExpanded ? null : citKey)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            color: '#a5b4fc',
                            fontWeight: 600,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <BookOpen size={13} />
                            <span>{c.clause_id}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                              ({c.section_title})
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </div>

                        {isExpanded && (
                          <div style={{
                            marginTop: '0.4rem',
                            paddingTop: '0.4rem',
                            borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                            fontSize: '0.72rem',
                            color: 'var(--text-secondary)',
                            fontStyle: 'italic',
                            lineHeight: '1.35',
                          }}>
                            "{c.snippet}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem', padding: '0 0.4rem' }}>
              {msg.timestamp}
            </span>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <div className="pulse-indicator" />
            <span>Scanning policy handbook & synthesizing citations...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{
          padding: '0.85rem 1rem',
          background: 'rgba(11, 17, 30, 0.9)',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        <input
          type="text"
          placeholder="Ask a policy question (e.g. sick note rules, carryover)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input-field"
          style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-primary"
          style={{ padding: '0.55rem 0.85rem' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
