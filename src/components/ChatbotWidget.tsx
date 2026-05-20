import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, X, Send, Bot, HelpCircle, Activity, 
  Calendar, Users, Clock, AlertTriangle, ArrowRight, CornerDownLeft
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  text: "Hello! I am **Greenfield Assistant**, your digital clinical helper. How can I assist you with scheduling dynamic appointment slots, finding our Stanford & Harvard residency specialists, or navigating our patient portal today?",
};

export const ChatbotWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevUserIdRef = useRef<string | undefined>(user?.userId);

  // Reset chatbot messages and states when the user logs out or logs in with a different account
  useEffect(() => {
    const currentUserId = user?.userId;
    if (currentUserId !== prevUserIdRef.current) {
      setMessages([WELCOME_MESSAGE]);
      setInputText("");
      setErrorMsg(null);
      setIsLoading(false);
      prevUserIdRef.current = currentUserId;
    }
  }, [user?.userId]);

  // Auto scroll to bottom when message arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Handle standard user text submit
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    setErrorMsg(null);

    // Prepare message history in correct model schema
    const historyPayload = messages.map(m => ({
      role: m.role,
      text: m.text
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to communicate with the Assistant server.");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.text }]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorMsg(err.message || "Something went wrong. Please check your network or try again.");
      setMessages((prev) => [
        ...prev, 
        { 
          role: "assistant", 
          text: "⚠️ **System Notification**: I experienced an issue reaching the server. If this is a clinical emergency, please use our hotline **1-800-473-3634**. Otherwise, please verify that your Gemini API Key is active in **Settings > Secrets**." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage(inputText);
    }
  };

  // Custom typography parser to format simple Markdown bold (**text**) and bullet lists elegantly
  const renderMessageText = (text: string) => {
    return text.split("\n").map((line, lineIdx) => {
      let isBullet = false;
      let cleanLine = line;

      if (line.trim().startsWith("- ") || line.trim().startsWith("* ") || line.trim().startsWith("• ")) {
        isBullet = true;
        cleanLine = line.replace(/^[\s*-•]+/, "");
      }

      const boldRegex = /\*\*(.*?)\*\*/g;
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          elements.push(cleanLine.substring(lastIndex, match.index));
        }
        elements.push(<strong key={match.index} className="font-extrabold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < cleanLine.length) {
        elements.push(cleanLine.substring(lastIndex));
      }

      const finalContent = elements.length > 0 ? elements : cleanLine;

      if (isBullet) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-slate-700 text-xs mt-1 leading-relaxed">
            {finalContent}
          </li>
        );
      }

      if (!line.trim()) {
        return <div key={lineIdx} className="h-1.5" />;
      }

      return (
        <p key={lineIdx} className="text-xs text-slate-700 mt-1 leading-relaxed font-sans">
          {finalContent}
        </p>
      );
    });
  };

  const quickPrompts = [
    { label: "Book Slot Guidelines", text: "How do I book an appointment slot?", icon: <Calendar className="w-3 h-3 text-emerald-600" /> },
    { label: "Headache consultation", text: "I have a headache, which doctor should I consult?", icon: <Activity className="w-3 h-3 text-amber-500 animate-pulse" /> },
    { label: "Active Doctors", text: "Who are your active doctors and specialists?", icon: <Users className="w-3 h-3 text-emerald-600" /> },
    { label: "Facility Hours", text: "What are Greenfield Medical Center's hours and location?", icon: <Clock className="w-3 h-3 text-emerald-600" /> }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end">
      
      {/* 1. CHAT WINDOW PANEL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden mb-4 mr-0"
          >
            {/* Header branding block */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-4 shrink-0 flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="p-2.5 bg-emerald-500/25 rounded-xl border border-emerald-400/20 text-white">
                    <Bot className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                </div>
                
                <div className="text-left">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-xs font-extrabold font-display leading-none tracking-tight">Greenfield Assistant</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[8px] px-1 py-0.5 rounded uppercase tracking-wider">AI Support</span>
                  </div>
                  <p className="text-[10px] text-emerald-250 opacity-90 leading-none mt-1">Ready to assist 24/7</p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-200 hover:text-white transition-colors cursor-pointer"
                  title="Minimize"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages box */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4">
              {messages.map((msg, index) => {
                const isAI = msg.role === "assistant";
                return (
                  <div 
                    key={index}
                    className={`flex items-start gap-2.5 ${isAI ? "justify-start" : "justify-end text-right"}`}
                  >
                    {isAI && (
                      <div className="p-1.5 bg-emerald-50 border border-emerald-100/50 rounded-lg text-emerald-800 shrink-0">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    
                    <div className="max-w-[80%] text-left">
                      <div className={`px-3.5 py-2.5 rounded-2xl ${
                        isAI 
                          ? "bg-white border border-slate-150 rounded-tl-none shadow-xs text-slate-850" 
                          : "bg-emerald-600 text-white rounded-tr-none shadow-xs font-sans"
                      }`}>
                        {isAI ? (
                          <div className="space-y-1">{renderMessageText(msg.text)}</div>
                        ) : (
                          <p className="text-xs leading-relaxed font-sans">{msg.text}</p>
                        )}
                      </div>
                      <span className="text-[8px] font-mono text-slate-400 mt-1 block px-1">
                        {isAI ? "Greenfield System Help" : "Patient Query"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-2.5 justify-start">
                  <div className="p-1.5 bg-emerald-50 border border-emerald-100/50 rounded-lg text-emerald-800 shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white border border-slate-150 px-3.5 py-3 rounded-2xl rounded-tl-none shadow-xs flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100 text-[10px] text-yellow-800 flex items-center gap-1.5 text-left shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Prompts tray */}
            <div className="p-3 bg-white border-t border-slate-100 shrink-0 space-y-1.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono text-left">Common Guidance Queries</p>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    disabled={isLoading}
                    onClick={() => handleSendMessage(prompt.text)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-slate-50 border border-slate-200 hover:border-emerald-500 rounded-lg text-[10px] font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/20 shadow-xs cursor-pointer transition-all shrink-0"
                  >
                    {prompt.icon}
                    <span>{prompt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form Box */}
            <div className="p-3 bg-slate-50 border-t border-slate-200/85 shrink-0 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                placeholder="Type a support message... (e.g., help me book)"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:ring-1.5 focus:ring-emerald-600 disabled:bg-slate-100 transition-all font-sans text-slate-800"
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-xl transition-colors cursor-pointer shrink-0 shadow-sm flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CHAT TRIGGER FLOATING BUTTON WITH GLOW EFFECT */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3.5 sm:p-4 rounded-full text-white shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 group flex items-center space-x-2 relative ${
          isOpen 
            ? "bg-slate-800 hover:bg-slate-700 shadow-slate-900/10" 
            : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 hover:shadow-[0_0_22px_rgba(16,185,129,0.75)]"
        }`}
      >
        <div className="absolute top-0 right-0 -mr-0.5 -mt-0.5 h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white" />
        </div>
        
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <div className="flex items-center space-x-1.5">
            <MessageSquare className="w-5 h-5 group-hover:rotate-6 transition-transform" />
            <span className="text-xs font-bold leading-none hidden md:inline pr-1">Consult AI Assistant</span>
          </div>
        )}
      </button>

    </div>
  );
};
