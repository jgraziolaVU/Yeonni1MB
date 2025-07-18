import React from 'react';

const FileUpload = ({ onFileUpload }) => {
  const handleChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="p-4 border rounded shadow bg-white dark:bg-gray-800">
      <label className="block mb-2 font-semibold">Upload Mössbauer Data (.xlsx or .txt)</label>
      <input
        type="file"
        accept=".xlsx,.txt"
        onChange={handleChange}
        className="w-full"
      />
    </div>
  );
};

export default FileUpload;
