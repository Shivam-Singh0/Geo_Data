'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';

const UploadForm = () => {
  const { userId } = useAuth();

  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('geojson');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage(''); // Clear any existing message when a new file is selected
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!file) {
      setMessage('Please select a file');
      setLoading(false); // Stop loading if no file is selected
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', fileType);
    formData.append('userId', userId);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('File uploaded successfully');
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Upload failed: ${error.message}`);
    }

    // Reset the form without requiring a reload
    setFile(null);
    document.getElementById('file').value = null; // Reset file input field
    setFileType('geojson');
    setLoading(false);
  };

  const handleClearForm = () => {
    setFile(null);
    setFileType('geojson');
    setMessage('');
    document.getElementById('file').value = null; // Reset file input field
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-black">
      <div className="bg-gray-800 text-white rounded-lg shadow-2xl p-8 w-[350px]">
        <h1 className="text-center text-xl font-bold mb-4">Upload File</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="file" className="block mb-2">Choose file:</label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              className="w-full p-2 bg-gray-700 text-white rounded"
            />
          </div>
          <div>
            <label htmlFor="type" className="block mb-2">File type:</label>
            <select
              id="type"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded"
            >
              <option value="geojson">GeoJSON</option>
              <option value="kml">KML</option>
              <option value="tiff">TIFF</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
          <button
            type="button"
            onClick={handleClearForm}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded transition mt-2"
          >
            Clear Form
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm">{message}</p>}
      </div>
    </div>
  );
};

export default UploadForm;
