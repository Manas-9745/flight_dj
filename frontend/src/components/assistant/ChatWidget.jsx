import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { aiService } from '../../services/aiService';
import MessageBubble from './MessageBubble';
import SuggestedQuestions from './SuggestedQuestions';

const ChatWidget = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: "Welcome to the AeroMate Assistant! I can help answer travel questions and explain disruptions.\n\n(Note: I am providing simulated demo responses and do not access real airline APIs.)",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    if (!text.trim() || isTyping) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const responseText = await aiService.mockChatResponse(userMessage.text);
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "Sorry, I encountered an error simulating a response. Please try again.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  return (
    <div className="glass-panel flex flex-col h-[600px] max-h-[75vh] w-full overflow-hidden border border-slate-200 shadow-xl">
      {/* Header */}
      <div className="bg-aero-navy p-4 flex items-center gap-3 shrink-0">
        <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-aero-sky">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">AeroMate Assistant</h2>
          <p className="text-aero-sky text-xs font-medium">Demo AI Mode</p>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
        {messages.length === 1 && (
          <SuggestedQuestions onSelect={(q) => handleSend(q)} />
        )}
        
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {isTyping && (
          <div className="flex w-full justify-start mb-6">
            <div className="flex max-w-[85%] gap-3 flex-row">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-aero-sky text-white flex items-center justify-center mt-1">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="px-5 py-4 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            className="w-full pl-4 pr-14 py-3.5 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-aero-sky transition-shadow text-sm"
            placeholder={isTyping ? "Assistant is typing..." : "Type your travel question..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 h-10 w-10 bg-aero-indigo hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aero-indigo"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          Responses are simulated for demonstration. Do not rely on this for real travel data.
        </p>
      </div>
    </div>
  );
};

export default ChatWidget;
