'use client';

import { useState } from 'react';
import { BACKEND_URL } from './config';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [paperId, setPaperId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setUploadStatus('Please select a file first.');
      return;
    }

    setLoading(true);
    setUploadStatus('Uploading and processing...');
    setPaperId(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${BACKEND_URL}/upload-paper/`, {
        method: 'POST',
        body: formData,
        // No 'Content-Type' header needed for FormData; browser sets it correctly.
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus(`Success: ${data.message}`);
        setPaperId(data.paper_id);
        // Optionally redirect to paper details page: router.push(`/paper/${data.paper_id}`);
      } else {
        const errorData = await response.json();
        setUploadStatus(`Error: ${errorData.detail || 'Upload failed.'}`);
      }
    } catch (error) {
      setUploadStatus(`Network error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Academic Insight Assistant</h1>

      <form onSubmit={handleUpload} className="flex flex-col gap-4">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="file-input file-input-bordered w-full max-w-xs"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !selectedFile}
        >
          {loading ? 'Processing...' : 'Upload & Process PDF'}
        </button>
      </form>

      {uploadStatus && <p className="mt-4 text-center">{uploadStatus}</p>}
      {paperId && (
        <p className="mt-2 text-center">
          Paper ID: <span className="font-mono">{paperId}</span>.
          <br />
          <a href={`/paper/${paperId}`} className="text-blue-500 hover:underline">
            View Paper Details
          </a>
        </p>
      )}

      {/* Add a basic paper list / dashboard later */}
      <h2 className="text-2xl font-semibold mt-12 mb-4">Your Uploaded Papers</h2>
      {/* This would be fetched from /papers endpoint */}
      <p>List of papers will appear here.</p>
    </main>
  );
}