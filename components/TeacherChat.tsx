'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLearningStore } from '@/lib/store';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  GraduationCap, 
  Trash2, 
  User, 
  Bot, 
  Info, 
  Loader2,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { showToast } from '@/components/NotificationToaster';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Pure helper function defined outside the component to avoid linter purity issues
function buildChatMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  const randId = Math.random().toString(36).substring(2, 9);
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return {
    id: `msg-${randId}`,
    role,
    content,
    timestamp: timeStr
  };
}

export default function TeacherChat() {
  const { theme, user } = useLearningStore();
  const isDark = theme === 'dark';
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount safely
  useEffect(() => {
    const savedChats = localStorage.getItem('roadmapai-teacher-chats');
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setTimeout(() => {
          setMessages(parsed);
        }, 0);
      } catch (e) {
        console.error('Failed to parse saved chats:', e);
      }
    } else {
      // Set initial welcome message from Professor Sterling
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Greetings! I am **Professor Sterling**, your dedicated AI Technical Teacher. 🎓\n\nI am here to clarify coding queries, explain complex concepts, run debug walks, or recommend academic methods. \n\n*Please note: I am strictly dedicated to your technical education. Let me know what you would like to explore today!*`,
        timestamp: '09:00 AM'
      };
      setTimeout(() => {
        setMessages([welcomeMsg]);
      }, 0);
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('roadmapai-teacher-chats', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg = buildChatMessage('user', trimmed);

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build conversation history payload in user/assistant structure
      const historyPayload = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask-teacher',
          payload: { messages: historyPayload }
        })
      });

      if (!res.ok) {
        throw new Error('Server responded with an error');
      }

      const data = await res.json();
      
      const assistantMsg = buildChatMessage(
        'assistant',
        data.text || 'I apologize, but I could not formulate a response. Please try again.'
      );

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      showToast('Connection issue with AI Teacher service.', 'error');
      
      const errorMsg = buildChatMessage(
        'assistant',
        `*My apologies. It appears my communication systems are experiencing temporary interference. Let's try that again shortly!*`
      );
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const clearChatHistory = () => {
    if (window.confirm('Are you sure you want to clear your learning conversation with Professor Sterling?')) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Welcome back! I am **Professor Sterling**, your AI Teacher. How can I assist your technical learning journey now?`,
        timestamp: '09:00 AM'
      };
      setMessages([welcomeMsg]);
      localStorage.removeItem('roadmapai-teacher-chats');
      showToast('Conversation cleared successfully', 'info');
    }
  };

  const suggestedChips = [
    { label: 'Explain Object-Oriented Programming (OOP)', text: 'Can you explain the main principles of OOP with real-world examples?' },
    { label: 'How does recursion work?', text: 'Can you explain how recursion works step-by-step using a visual or simple analogy?' },
    { label: 'What is connection pooling?', text: 'What is database connection pooling and why do full-stack developers need it?' },
    { label: 'Debug Python index error', text: 'Why do I get an "IndexError: list index out of range" in Python, and how do I fix it?' }
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      
      {/* Header Banner */}
      <header className={`px-6 py-4 border-b flex justify-between items-center transition-all ${
        isDark ? 'bg-[#0E1124] border-violet-500/10' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
            isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-sky-50 border-sky-200 text-sky-600'
          }`}>
            <GraduationCap size={22} className="animate-pulse" />
          </div>
          <div>
            <h2 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Professor Sterling
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                AI Technical Teacher
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={clearChatHistory}
          title="Clear Conversation"
          className={`p-2 rounded-lg border transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold ${
            isDark 
              ? 'border-violet-500/10 bg-violet-950/20 hover:bg-violet-500/10 text-violet-300' 
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trash2 size={13} /> Clear Board
        </button>
      </header>

      {/* Educational Indicator Bar */}
      <div className={`px-6 py-2 border-b flex items-center gap-2 text-[10px] font-semibold tracking-wide uppercase ${
        isDark ? 'bg-violet-950/20 border-violet-500/10 text-violet-300' : 'bg-sky-50/50 border-slate-100 text-sky-700'
      }`}>
        <Info size={11} className="shrink-0" />
        <span>Guardrail: This chatbot answers educational, coding, and roadmap queries only.</span>
      </div>

      {/* Chat Messages Scrolling Thread */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin ${
        isDark ? 'bg-[#0B0D19]/40' : 'bg-slate-50/40'
      }`}>
        
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl animate-fade-in ${
                isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              {/* Avatar Icon */}
              <div className={`w-8 h-8 rounded-lg border shrink-0 flex items-center justify-center text-xs font-bold ${
                isAssistant
                  ? isDark
                    ? 'bg-violet-500/10 border-violet-500/25 text-violet-400'
                    : 'bg-sky-50 border-sky-200 text-sky-600'
                  : isDark
                  ? 'bg-indigo-600/10 border-indigo-500/25 text-indigo-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}>
                {isAssistant ? <Bot size={15} /> : <User size={15} />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-1">
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed shadow-sm ${
                  isAssistant
                    ? isDark
                      ? 'bg-[#121631] border-violet-500/10 text-slate-100'
                      : 'bg-white border-slate-200 text-slate-700'
                    : isDark
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-sky-500 text-white border-sky-400'
                }`}>
                  <div className="markdown-body select-text">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                
                <p className={`text-[9px] px-1 font-bold tracking-wider ${
                  isAssistant ? 'text-left text-slate-500' : 'text-right text-slate-400'
                }`}>
                  {isAssistant ? 'Professor Sterling' : user.name || 'You'} • {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex gap-3 max-w-lg mr-auto animate-pulse">
            <div className={`w-8 h-8 rounded-lg border shrink-0 flex items-center justify-center bg-violet-500/10 border-violet-500/20 text-violet-400`}>
              <Bot size={15} />
            </div>
            <div className={`p-4 rounded-2xl border text-xs ${
              isDark ? 'bg-[#121631] border-violet-500/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              <div className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin text-violet-400" />
                <span>Professor Sterling is formulating an answer...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starting Prompts Panel (Hidden when thread is long to optimize spacing) */}
      {messages.length <= 2 && (
        <div className={`px-6 py-4 border-t ${
          isDark ? 'bg-[#111428]/40 border-violet-500/10' : 'bg-slate-50/50 border-slate-200'
        }`}>
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <Sparkles size={11} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Suggested Learning Queries
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.text)}
                disabled={isLoading}
                className={`text-left p-2.5 rounded-xl border text-[11px] font-semibold transition-all duration-200 flex justify-between items-center group ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] cursor-pointer'
                } ${
                  isDark
                    ? 'border-violet-500/10 bg-violet-950/10 hover:bg-violet-950/30 hover:border-violet-400 text-slate-300'
                    : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-sky-400 text-slate-700'
                }`}
              >
                <span>{chip.label}</span>
                <ArrowRight size={12} className={`opacity-0 group-hover:opacity-100 transition-all ${
                  isDark ? 'text-violet-400' : 'text-sky-500'
                }`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Message Form */}
      <div className={`p-4 border-t transition-all ${
        isDark ? 'bg-[#0E1124] border-violet-500/10' : 'bg-white border-slate-200'
      }`}>
        <form onSubmit={handleFormSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Ask Professor Sterling any technical learning query..."
            className={`flex-1 px-4 py-3 rounded-xl border text-xs outline-none transition-all ${
              isDark
                ? 'bg-violet-950/15 border-violet-500/20 text-white focus:border-violet-400 placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500 placeholder-slate-400'
            }`}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`px-4 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all duration-300 active:scale-95 ${
              !inputValue.trim() || isLoading
                ? 'bg-slate-500/20 text-slate-500 cursor-not-allowed border border-slate-700/20'
                : isDark
                ? 'bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-950/40 hover:scale-103'
                : 'bg-sky-500 hover:bg-sky-600 shadow-md shadow-sky-100 hover:scale-103'
            }`}
          >
            <Send size={12} />
            <span className="hidden sm:inline">Ask Board</span>
          </button>
        </form>
        <p className="text-[10px] text-slate-500 text-center mt-2 font-medium">
          Professor Sterling operates on Gemini 3.5-Flash. Keep study sessions focused on technical outcomes!
        </p>
      </div>

    </div>
  );
}
