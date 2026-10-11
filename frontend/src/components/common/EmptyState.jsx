import React from 'react';
import { Plane, SearchX, BookmarkX, AlertCircle } from 'lucide-react';

const EmptyState = ({ type = 'search', title, message, actionButton }) => {
  const icons = {
    search: <SearchX className="h-16 w-16 text-slate-300 mx-auto mb-4" />,
    trips: <BookmarkX className="h-16 w-16 text-slate-300 mx-auto mb-4" />,
    default: <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
  };

  return (
    <div className="glass-panel p-12 text-center">
      {icons[type] || icons.default}
      <h3 className="text-xl font-bold text-aero-navy mb-2">{title || "No results found"}</h3>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">
        {message || "We couldn't find what you were looking for."}
      </p>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};

export default EmptyState;
