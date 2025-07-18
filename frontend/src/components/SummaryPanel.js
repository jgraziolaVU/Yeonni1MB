import React from 'react';

const SummaryPanel = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="p-4 mt-4 border rounded bg-white dark:bg-gray-800 shadow">
      <h2 className="text-lg font-bold mb-2">AI Summary</h2>
      <p className="whitespace-pre-wrap">{summary}</p>
    </div>
  );
};

export default SummaryPanel;
