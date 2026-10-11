import React from 'react';
import ChatWidget from '../components/assistant/ChatWidget';
import { BotMessageSquare } from 'lucide-react';

const Assistant = () => {
  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-start">
      
      {/* Informational Sidebar */}
      <div className="w-full md:w-1/3 pt-4">
        <div className="bg-aero-navy text-white p-3 inline-flex rounded-lg mb-6 shadow-md">
          <BotMessageSquare className="h-8 w-8 text-aero-sky" />
        </div>
        <h1 className="text-3xl font-bold text-aero-navy mb-4">AI Travel Assistant</h1>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Need help navigating a delay or finding your way around the airport? Chat with our intelligent travel companion.
        </p>
        
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
          <h3 className="font-bold text-blue-900 mb-2 text-sm">Demonstration Notice</h3>
          <p className="text-xs text-blue-800/80 leading-relaxed">
            This is a simulated AI interface. It parses keywords locally to generate relevant travel advice. It does not use real external NLP models or access live flight APIs.
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-full md:w-2/3">
        <ChatWidget />
      </div>

    </div>
  );
};

export default Assistant;
