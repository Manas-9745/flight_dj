import React from 'react';
import { MessageCircle } from 'lucide-react';

const SuggestedQuestions = ({ onSelect }) => {
  const questions = [
    "What is the status of flight SW101?",
    "What should I do if my flight is delayed?",
    "How do I save a trip?",
    "How early should I arrive at the airport?"
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {questions.map((q, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(q)}
          className="flex items-center gap-2 text-xs font-medium text-aero-blue bg-white border border-aero-blue/20 hover:bg-aero-blue/5 px-4 py-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-aero-sky"
        >
          <MessageCircle className="h-3 w-3" />
          {q}
        </button>
      ))}
    </div>
  );
};

export default SuggestedQuestions;
