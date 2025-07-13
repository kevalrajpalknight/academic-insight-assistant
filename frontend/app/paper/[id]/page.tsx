'use client';

import { BACKEND_URL } from '@/app/config';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface PaperDetails {
  id: string;
  filename: string;
  upload_date: string;
  status: string;
  summary?: string; // Will be added later
  // Other fields as you add them (definitions, questions)
}

export default function PaperDetailPage() {
  const params = useParams();
  const paperId = params.id as string;
  const [paper, setPaper] = useState<PaperDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paperId) return;

    const fetchPaperDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${BACKEND_URL}/papers/${paperId}`);
        if (response.ok) {
          const data: PaperDetails = await response.json();
          setPaper(data);
          // If the paper is still pending, poll for updates (basic polling for demo)
          if (data.status === 'pending') {
            const interval = setInterval(() => {
              fetchPaperDetails(); // Re-fetch to check status
            }, 5000); // Poll every 5 seconds
            return () => clearInterval(interval); // Clear on unmount
          }
        } else {
          setError(`Failed to fetch paper details: ${response.statusText}`);
        }
      } catch (err) {
        setError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPaperDetails();
  }, [paperId]);

  if (loading) return <div className="flex justify-center items-center h-screen text-xl">Loading paper details...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-xl text-red-500">Error: {error}</div>;
  if (!paper) return <div className="flex justify-center items-center h-screen text-xl">Paper not found.</div>;

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-6">Paper: {paper.filename}</h1>
      <div className="card w-full max-w-2xl bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Details</h2>
          <p><strong>ID:</strong> {paper.id}</p>
          <p><strong>Uploaded On:</strong> {new Date(paper.upload_date).toLocaleString()}</p>
          <p>
            <strong>Status:</strong>{' '}
            <span
              className={`font-semibold ${
                paper.status === 'processed' ? 'text-green-600' :
                paper.status === 'pending' ? 'text-yellow-600' :
                'text-red-600'
              }`}
            >
              {paper.status.toUpperCase()}
            </span>
            {paper.status === 'pending' && ' (Please wait while we process your paper.)'}
          </p>
        </div>
      </div>

      {paper.status === 'processed' && (
        <div className="w-full max-w-2xl">
          {/* Section for Summarization */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title">Summary</h2>
              {/* This is where the summary will be displayed, and a button to trigger it */}
              <p>Summary will appear here.</p>
              <button className="btn btn-secondary mt-4">Generate Summary</button>
            </div>
          </div>

          {/* Section for Definitions */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title">Key Definitions & Concepts</h2>
              <p>Definitions will appear here.</p>
              <button className="btn btn-secondary mt-4">Extract Definitions</button>
            </div>
          </div>

          {/* Section for Practice Questions */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title">Practice Questions</h2>
              <p>Questions will appear here.</p>
              <button className="btn btn-secondary mt-4">Generate Questions</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}