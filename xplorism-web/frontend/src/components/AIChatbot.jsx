import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  MessageCircle, X, Send, Trash2, Copy, RotateCcw,
  Sparkles, CornerDownLeft, Loader2, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AIChatbot() {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);

  // Prevent background body scroll chaining using wheel boundary event interception
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleWheel = (e) => {
      const scrollContainer = panel.querySelector('.overflow-y-auto');
      if (!scrollContainer) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const delta = e.deltaY;

      // If viewport is not scrollable, block wheel propagation completely
      if (scrollHeight <= clientHeight) {
        e.preventDefault();
        return;
      }

      // Block propagation only at top and bottom boundaries
      const isAtTop = scrollTop <= 0 && delta < 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1 && delta > 0;

      if (isAtTop || isAtBottom) {
        e.preventDefault();
      }
    };

    panel.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      panel.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  // Close chatbot when clicking outside of it
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Load conversations list
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      fetchConversations();
    }
  }, [isAuthenticated, isOpen]);
  // Scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-xplorism-ai', handleOpenChat);
    return () => window.removeEventListener('open-xplorism-ai', handleOpenChat);
  }, []);

  const fetchConversations = async () => {
    try {
      setConversationsLoading(true);
      const data = await api.get('/chat/conversations');
      setConversations(data || []);

      // Auto-load latest conversation if none selected
      if (data && data.length > 0 && !activeConvoId) {
        loadConversation(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setConversationsLoading(false);
    }
  };

  const loadConversation = async (convoId) => {
    try {
      setLoading(true);
      setActiveConvoId(convoId);
      const data = await api.get(`/chat/conversations/${convoId}/messages`);
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveConvoId(null);
    setMessages([]);
  };

  const handleSendMessage = async (e, customMsg = null) => {
    if (e) e.preventDefault();
    const promptToSend = customMsg ? customMsg : input;
    if (!promptToSend.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: promptToSend,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/chat/message', {
        message: promptToSend,
        conversationId: activeConvoId
      });

      if (response && response.message) {
        if (!activeConvoId && response.conversationId) {
          setActiveConvoId(response.conversationId);
          fetchConversations();
        }

        setMessages(prev => [
          ...prev,
          {
            role: 'model',
            content: response.message,
            sources: response.sources || [],
            toolCalls: response.toolCalls || [],
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to send chat message:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: 'Sorry, I encountered an error processing that request. Please try again.',
          isError: true,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!activeConvoId) {
      setMessages([]);
      return;
    }
    setShowConfirmDelete(true);
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    alert('Message copied to clipboard!');
  };

  const handleRegenerateResponse = () => {
    // Find last user message
    const userMsgs = messages.filter(m => m.role === 'user');
    if (userMsgs.length === 0) return;
    const lastUserPrompt = userMsgs[userMsgs.length - 1].content;

    // Remove last model response if exists
    if (messages[messages.length - 1].role === 'model') {
      setMessages(prev => prev.slice(0, -1));
    }
    handleSendMessage(null, lastUserPrompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatInlineBold = (text) => {
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-extrabold text-rose-500">{part}</strong>;
      }
      return part;
    });
  };

  const renderMessageContent = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-black text-sm text-slate-800 dark:text-slate-100 mt-3 mb-1">{line.slice(4)}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="font-black text-base text-rose-500 mt-4 mb-2">{line.slice(3)}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="font-black text-lg text-slate-900 dark:text-white mt-4 mb-2">{line.slice(2)}</h2>;
      }
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const cleanLine = line.trim().substring(2);
        return (
          <li key={idx} className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 ml-2.5 mb-1 leading-relaxed">
            {formatInlineBold(cleanLine)}
          </li>
        );
      }
      return (
        <p key={idx} className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed mb-2 min-h-[1em]">
          {formatInlineBold(line)}
        </p>
      );
    });
  };

  const starterPrompts = [
    "Plan a 3-day trip to Manali",
    "Best places to visit in Kashmir?",
    "Suggest a budget trip from Chandigarh",
    "What should I visit in Goa?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* Floating Tooltip Bubble */}
      <div
        className={`absolute bottom-16 right-0 whitespace-nowrap text-[10px] font-black px-3.5 py-1.5 rounded-2xl shadow-xl flex items-center space-x-1.5 transition-all duration-500 origin-bottom-right border pointer-events-none select-none z-10 ${isOpen ? 'scale-0 opacity-0 translate-y-5' : 'scale-100 opacity-100 translate-y-0'
          } bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-slate-900/10 dark:shadow-black/50`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
        <span>Ask Xplorism AI</span>
        {/* Tooltip Arrow */}
        <div className="absolute bottom-[-5px] right-[24px] w-2.5 h-2.5 border-r border-b rotate-45 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
        className={`absolute bottom-0 right-0 h-14 w-14 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 hover:scale-110 active:scale-95 text-white shadow-[0_8px_32px_rgba(244,63,94,0.4)] hover:shadow-[0_12px_40px_rgba(244,63,94,0.55)] flex items-center justify-center transition-all duration-300 cursor-pointer border border-white/10 group z-10 p-0 overflow-hidden ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
          }`}
      >
        <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          stroke="currentColor"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-white pointer-events-none"
          style={{ background: 'transparent !important', backgroundColor: 'transparent !important', boxShadow: 'none' }}
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      </button>

      {/* Main Chat Panel */}
      <div
        ref={panelRef}
        className={`absolute bottom-0 right-0 w-[90vw] sm:w-[450px] h-[600px] max-h-[85vh] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border transition-all duration-300 origin-bottom-right ${isOpen
          ? 'scale-100 opacity-100 pointer-events-auto translate-y-0'
          : 'scale-75 opacity-0 pointer-events-none translate-y-10'
          } bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800 backdrop-blur-xl`}
      >
        {/* Header */}
        <div className="bg-rose-500 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">Xplorism AI</h3>
              <span className="text-[10px] text-rose-100 flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Online Assistant</span>
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={startNewChat}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition cursor-pointer border-none bg-transparent"
              title="New Chat"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition cursor-pointer border-none bg-transparent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Section */}
        {!isAuthenticated ? (
          /* Guest login request state */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
            <Sparkles className="h-12 w-12 text-rose-500 mb-3 animate-bounce" />
            <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm mb-1.5">Ask Xplorism AI!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] leading-relaxed mb-6">
              Your AI travel guide is waiting to suggest customized itineraries, plan routes, and share current destination insights.
            </p>
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition flex items-center space-x-2 shadow-md shadow-rose-500/20"
            >
              <span>Login to Start Chatting</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Chat Viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/50 dark:bg-slate-950/50">
              {messages.length === 0 ? (
                /* Empty / Welcome State */
                <div className="h-full flex flex-col justify-center items-center py-6 text-center">
                  <Sparkles className="h-10 w-10 text-rose-500 mb-2.5 animate-pulse" />
                  <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">Hi {user?.name || 'there'}!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] leading-relaxed mt-1 mb-6">
                    I can create trip itineraries, look up weather/hotels, search destinations, and fetch preferences. Ask me anything!
                  </p>
                  <div className="w-full max-w-[320px] space-y-2">
                    {starterPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => handleSendMessage(e, p)}
                        className="w-full p-3 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 hover:border-rose-350 dark:hover:border-rose-500 hover:bg-rose-50/10 dark:hover:bg-rose-500/10 text-left text-xs font-bold rounded-2xl transition cursor-pointer text-slate-700 dark:text-slate-200 shadow-sm"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.role === 'user';
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Bubble */}
                      <div className={`px-4 py-3 rounded-3xl text-xs max-w-[85%] leading-relaxed shadow-sm relative group ${isMe
                        ? 'bg-rose-500 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-tl-none'
                        }`}>
                        {isMe ? msg.content : renderMessageContent(msg.content)}

                        {/* Sources indicator */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-1 items-center">
                            <span className="text-[9px] text-rose-450 font-bold uppercase tracking-wider">Xplorism Data:</span>
                            {msg.sources.map((src, sIdx) => (
                              <span key={sIdx} className="text-[9px] bg-slate-50 dark:bg-slate-700 border border-slate-150 dark:border-slate-600 text-slate-550 dark:text-slate-300 px-1.5 py-0.5 rounded-lg font-bold" title={src.category}>
                                {src.title}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Overlay */}
                        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition duration-200 ${isMe ? 'right-full mr-2' : 'left-full ml-2'
                          }`}>
                          <button
                            onClick={() => handleCopyText(msg.content)}
                            className="p-1 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-200/50 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition cursor-pointer"
                            title="Copy"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {loading && (
                <div className="flex items-center space-x-2 text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                  <span className="text-xs font-semibold animate-pulse">Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Xplorism AI..."
                    disabled={loading}
                    rows={1}
                    className="w-full pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-2xl text-xs text-slate-850 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-400 focus:outline-none focus:border-rose-500/40 resize-none max-h-[100px] font-sans leading-normal"
                  />
                  <div className="absolute right-2.5 bottom-2.5 text-[9px] text-slate-350 dark:text-slate-500 font-black uppercase tracking-wider flex items-center space-x-0.5 pointer-events-none select-none">
                    <CornerDownLeft className="h-2.5 w-2.5" />
                    <span className="hidden sm:inline">Enter</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-2xl transition cursor-pointer shadow-md shadow-rose-500/10 border-none"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
              {messages.length > 0 && (
                <div className="flex items-center justify-between mt-2.5 px-1">
                  <button
                    onClick={handleRegenerateResponse}
                    disabled={loading || messages.filter(m => m.role === 'user').length === 0}
                    className="text-[10px] text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 font-bold flex items-center space-x-1 cursor-pointer bg-transparent border-none p-0 outline-none"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Regenerate response</span>
                  </button>
                  <button
                    onClick={handleClearChat}
                    disabled={loading}
                    className="text-[10px] text-rose-450 hover:text-rose-600 font-bold flex items-center space-x-1 cursor-pointer bg-transparent border-none p-0 outline-none"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear conversation</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Custom Delete Confirmation Modal */}
        {showConfirmDelete && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm">
            <div className={`border rounded-3xl p-6 max-w-xs w-full shadow-2xl relative transition-all duration-200 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'
              }`}>
              <h3 className="text-sm font-black uppercase tracking-wider mb-2.5 text-rose-500">Delete Chat</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-6">
                Are you sure you want to permanently delete this chat? This action cannot be undone.
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-xl transition cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await api.delete(`/chat/conversations/${activeConvoId}`);
                      startNewChat();
                      fetchConversations();
                      setShowConfirmDelete(false);
                    } catch (err) {
                      console.error('Failed to delete conversation:', err);
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-[10px] font-bold rounded-xl transition cursor-pointer border-none shadow-md shadow-rose-500/10 flex items-center space-x-1"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
