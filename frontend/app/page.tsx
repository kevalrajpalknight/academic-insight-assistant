// frontend/app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "./config";

interface PaperListItem {
    id: string;
    filename: string;
    upload_date: string;
    status: string;
}

export default function Home() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState("");
    const [uploadedPaperId, setUploadedPaperId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [papers, setPapers] = useState<PaperListItem[]>([]);
    const [loadingPapers, setLoadingPapers] = useState(true);
    const [papersError, setPapersError] = useState<string | null>(null);

    const fetchPapers = async () => {
        setLoadingPapers(true);
        setPapersError(null);
        try {
            const response = await fetch(`${BACKEND_URL}/papers`);
            if (response.ok) {
                const data: PaperListItem[] = await response.json();
                setPapers(data);
            } else {
                setPapersError(
                    `Failed to fetch papers: ${response.statusText}`
                );
            }
        } catch (err) {
            setPapersError(
                `Network error fetching papers: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        } finally {
            setLoadingPapers(false);
        }
    };

    useEffect(() => {
        fetchPapers();
    }, []); // Fetch papers on component mount

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleUpload = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile) {
            setUploadStatus("Please select a file first.");
            return;
        }

        setUploading(true);
        setUploadStatus("Uploading and processing...");
        setUploadedPaperId(null);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await fetch(`${BACKEND_URL}/upload-paper/`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setUploadStatus(`Success: ${data.message}`);
                setUploadedPaperId(data.paper_id);
                // Re-fetch the list of papers to include the new one
                fetchPapers();
            } else {
                const errorData = await response.json();
                setUploadStatus(
                    `Error: ${errorData.detail || "Upload failed."}`
                );
            }
        } catch (error) {
            setUploadStatus(
                `Network error: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        } finally {
            setUploading(false);
            setSelectedFile(null); // Clear selected file after upload attempt
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100 text-gray-800">
            <h1 className="text-5xl font-extrabold mb-10 text-blue-700">
                Academic Insight Assistant
            </h1>

            <section className="w-full max-w-xl bg-white p-8 rounded-lg shadow-xl mb-12">
                <h2 className="text-3xl font-semibold mb-6 text-gray-700">
                    Upload New Paper
                </h2>
                <form onSubmit={handleUpload} className="flex flex-col gap-6">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="file-input file-input-bordered w-full text-lg p-3 rounded-md border-2 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
                    />
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full text-xl font-bold py-3 rounded-md shadow-lg transition-transform transform hover:scale-105 active:scale-95"
                        disabled={uploading || !selectedFile}
                    >
                        {uploading ? "Processing..." : "Upload & Process PDF"}
                    </button>
                </form>

                {uploadStatus && (
                    <p className="mt-6 text-center text-lg">{uploadStatus}</p>
                )}
                {uploadedPaperId && (
                    <p className="mt-4 text-center text-lg">
                        Paper ID:{" "}
                        <span className="font-mono bg-gray-200 p-1 rounded text-sm">
                            {uploadedPaperId}
                        </span>
                        <br />
                        <Link
                            href={`/paper/${uploadedPaperId}`}
                            className="text-blue-600 hover:underline font-medium mt-2 block"
                        >
                            View Paper Details
                        </Link>
                    </p>
                )}
            </section>

            <section className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-xl">
                <h2 className="text-3xl font-semibold mb-6 text-gray-700">
                    Your Uploaded Papers
                </h2>

                {loadingPapers ? (
                    <p className="text-center text-lg">Loading papers...</p>
                ) : papersError ? (
                    <p className="text-center text-lg text-red-500">
                        Error: {papersError}
                    </p>
                ) : papers.length === 0 ? (
                    <p className="text-center text-lg text-gray-500">
                        No papers uploaded yet. Upload one above!
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Filename</th>
                                    <th>Upload Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {papers.map((paper) => (
                                    <tr key={paper.id}>
                                        <td>{paper.filename}</td>
                                        <td>
                                            {new Date(
                                                paper.upload_date
                                            ).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${
                                                    paper.status === "processed"
                                                        ? "badge-success"
                                                        : paper.status ===
                                                          "pending"
                                                        ? "badge-warning"
                                                        : "badge-error"
                                                }`}
                                            >
                                                {paper.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <Link
                                                href={`/paper/${paper.id}`}
                                                className="btn btn-sm btn-info"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
