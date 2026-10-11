import React from 'react';
import { User, Sparkles } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isAi = message.sender === 'ai';

  return (
    <div className={`flex w-full ${isAi ? 'justify-start' : 'justify-end'} mb-6`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 ${
          isAi ? 'bg-aero-sky text-white' : 'bg-slate-200 text-slate-500'
        }`}>
          {isAi ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>

        {/* Message Content */}
        <div className="flex flex-col">
          <div className={`px-5 py-3.5 rounded-2xl ${
            isAi 
              ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm' 
              : 'bg-aero-indigo text-white rounded-tr-sm shadow-sm'
          }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
          </div>
          
          <span className={`text-[10px] text-slate-400 mt-1.5 ${isAi ? 'text-left ml-1' : 'text-right mr-1'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

      </div>
    </div>
  );
};

export default MessageBubble;
