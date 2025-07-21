// frontend/app/paper/[id]/page.tsx
"use client";

import { BACKEND_URL } from "@/app/config";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Definition {
    term: string;
    definition: string;
}

interface Question {
    question: string;
    type: "multiple_choice" | "short_answer";
    options?: string[];
    correct_answer: string;
}

interface PaperDetails {
    id: string;
    filename: string;
    upload_date: string;
    status: string;
    summary?: string;
    extracted_definitions?: Definition[];
    generated_questions?: Question[];
}

export default function PaperDetailPage() {
    const params = useParams();
    const paperId = params.id as string;
    const [paper, setPaper] = useState<PaperDetails | null>(null);
    const [loadingPaper, setLoadingPaper] = useState(true);
    const [paperError, setPaperError] = useState<string | null>(null);

    const [loadingSummary, setLoadingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const [loadingDefinitions, setLoadingDefinitions] = useState(false);
    const [definitionsError, setDefinitionsError] = useState<string | null>(
        null
    );

    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [questionsError, setQuestionsError] = useState<string | null>(null);

    const [answeredQuestions, setAnsweredQuestions] = useState<{
        [key: number]: string | null;
    }>({});
    const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

    // Function to fetch paper details
    const fetchPaperDetails = useCallback(async () => {
        if (!paperId) return;

        setLoadingPaper(true);
        setPaperError(null);
        try {
            const response = await fetch(`${BACKEND_URL}/papers/${paperId}`);
            if (response.ok) {
                const data: PaperDetails = await response.json();
                setPaper(data);
                // If the paper is still pending, poll for updates
                if (data.status === "pending") {
                    // No need to clear interval immediately, useCallback handles consistency
                    setTimeout(fetchPaperDetails, 5000); // Poll every 5 seconds
                }
            } else {
                setPaperError(
                    `Failed to fetch paper details: ${response.statusText}`
                );
            }
        } catch (err) {
            setPaperError(
                `Network error: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        } finally {
            setLoadingPaper(false);
        }
    }, [paperId]); // Depend on paperId

    useEffect(() => {
        fetchPaperDetails();
    }, [fetchPaperDetails]); // Call fetchPaperDetails when the memoized function changes

    // Feature specific handlers
    const handleGenerateSummary = async () => {
        setLoadingSummary(true);
        setSummaryError(null);
        try {
            const response = await fetch(
                `${BACKEND_URL}/papers/${paperId}/summarize`,
                { method: "POST" }
            );
            if (response.ok) {
                const data = await response.json();
                setPaper((prev) =>
                    prev ? { ...prev, summary: data.summary } : null
                );
            } else {
                const errorData = await response.json();
                setSummaryError(
                    `Failed to generate summary: ${
                        errorData.detail || response.statusText
                    }`
                );
            }
        } catch (err) {
            setSummaryError(
                `Network error generating summary: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleExtractDefinitions = async () => {
        setLoadingDefinitions(true);
        setDefinitionsError(null);
        try {
            const response = await fetch(
                `${BACKEND_URL}/papers/${paperId}/extract-definitions`,
                { method: "POST" }
            );
            if (response.ok) {
                const data = await response.json();
                setPaper((prev) =>
                    prev
                        ? {
                              ...prev,
                              extracted_definitions: data.extracted_definitions,
                          }
                        : null
                );
            } else {
                const errorData = await response.json();
                setDefinitionsError(
                    `Failed to extract definitions: ${
                        errorData.detail || response.statusText
                    }`
                );
            }
        } catch (err) {
            setDefinitionsError(
                `Network error extracting definitions: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        } finally {
            setLoadingDefinitions(false);
        }
    };

    const handleGenerateQuestions = async () => {
        setLoadingQuestions(true);
        setQuestionsError(null);
        setAnsweredQuestions({}); // Reset answers when generating new questions
        setShowCorrectAnswers(false); // Hide answers initially
        try {
            const response = await fetch(
                `${BACKEND_URL}/papers/${paperId}/generate-questions`,
                { method: "POST" }
            );
            if (response.ok) {
                const data = await response.json();
                setPaper((prev) =>
                    prev
                        ? {
                              ...prev,
                              generated_questions: data.generated_questions,
                          }
                        : null
                );
            } else {
                const errorData = await response.json();
                setQuestionsError(
                    `Failed to generate questions: ${
                        errorData.detail || response.statusText
                    }`
                );
            }
        } catch (err) {
            setQuestionsError(
                `Network error generating questions: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        } finally {
            setLoadingQuestions(false);
        }
    };

    const handleAnswerChange = (questionIndex: number, answer: string) => {
        setAnsweredQuestions((prev) => ({ ...prev, [questionIndex]: answer }));
    };

    if (loadingPaper)
        return (
            <div className="flex justify-center items-center h-screen text-xl text-gray-700">
                Loading paper details...
            </div>
        );
    if (paperError)
        return (
            <div className="flex justify-center items-center h-screen text-xl text-red-500">
                Error: {paperError}
            </div>
        );
    if (!paper)
        return (
            <div className="flex justify-center items-center h-screen text-xl text-gray-500">
                Paper not found.
            </div>
        );

    return (
        <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100 text-gray-800">
            <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-xl mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold text-blue-700">
                        Paper: {paper.filename}
                    </h1>
                    <Link href="/" className="btn btn-ghost">
                        ← Back to Home
                    </Link>
                </div>

                <div className="text-lg">
                    <p>
                        <strong>ID:</strong>{" "}
                        <span className="font-mono bg-gray-100 p-1 rounded text-sm">
                            {paper.id}
                        </span>
                    </p>
                    <p>
                        <strong>Uploaded On:</strong>{" "}
                        {new Date(paper.upload_date).toLocaleString()}
                    </p>
                    <p>
                        <strong>Status:</strong>{" "}
                        <span
                            className={`badge badge-lg font-semibold ${
                                paper.status === "processed"
                                    ? "badge-success"
                                    : paper.status === "pending"
                                    ? "badge-warning"
                                    : "badge-error"
                            }`}
                        >
                            {paper.status.toUpperCase()}
                        </span>
                        {paper.status === "pending" && (
                            <span className="ml-2 text-gray-500">
                                (Processing in progress...)
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {paper.status === "processed" && (
                <div className="w-full max-w-4xl">
                    {/* Section for Summarization */}
                    <div className="card bg-white shadow-xl mb-8">
                        <div className="card-body">
                            <h2 className="card-title text-2xl text-gray-700 mb-4">
                                Summary
                            </h2>
                            {paper.summary ? (
                                <p className="whitespace-pre-wrap text-gray-700">
                                    {paper.summary}
                                </p>
                            ) : (
                                <p className="text-gray-500">
                                    No summary generated yet. Click the button
                                    below.
                                </p>
                            )}
                            <div className="card-actions justify-end">
                                <button
                                    onClick={handleGenerateSummary}
                                    className="btn btn-primary"
                                    disabled={loadingSummary}
                                >
                                    {loadingSummary ? (
                                        <span className="loading loading-spinner"></span>
                                    ) : paper.summary ? (
                                        "Regenerate Summary"
                                    ) : (
                                        "Generate Summary"
                                    )}
                                </button>
                            </div>
                            {summaryError && (
                                <p className="text-red-500 mt-2">
                                    {summaryError}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Section for Definitions */}
                    <div className="card bg-white shadow-xl mb-8">
                        <div className="card-body">
                            <h2 className="card-title text-2xl text-gray-700 mb-4">
                                Key Definitions & Concepts
                            </h2>
                            {paper.extracted_definitions &&
                            paper.extracted_definitions.length > 0 ? (
                                <ul className="list-disc pl-5 text-gray-700">
                                    {paper.extracted_definitions.map(
                                        (def, index) => (
                                            <li key={index} className="mb-2">
                                                <strong className="text-blue-600">
                                                    {def.term}:
                                                </strong>{" "}
                                                {def.definition}
                                            </li>
                                        )
                                    )}
                                </ul>
                            ) : (
                                <p className="text-gray-500">
                                    No definitions extracted yet. Click the
                                    button below.
                                </p>
                            )}
                            <div className="card-actions justify-end">
                                <button
                                    onClick={handleExtractDefinitions}
                                    className="btn btn-primary"
                                    disabled={loadingDefinitions}
                                >
                                    {loadingDefinitions ? (
                                        <span className="loading loading-spinner"></span>
                                    ) : paper.extracted_definitions ? (
                                        "Regenerate Definitions"
                                    ) : (
                                        "Extract Definitions"
                                    )}
                                </button>
                            </div>
                            {definitionsError && (
                                <p className="text-red-500 mt-2">
                                    {definitionsError}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Section for Practice Questions */}
                    <div className="card bg-white shadow-xl mb-8">
                        <div className="card-body">
                            <h2 className="card-title text-2xl text-gray-700 mb-4">
                                Practice Questions
                            </h2>
                            {paper.generated_questions &&
                            paper.generated_questions.length > 0 ? (
                                <div className="flex flex-col gap-6">
                                    {paper.generated_questions.map(
                                        (q, index) => (
                                            <div
                                                key={index}
                                                className="border-b pb-4 last:border-b-0 last:pb-0"
                                            >
                                                <p className="font-semibold text-lg mb-2">
                                                    {index + 1}. {q.question}
                                                </p>
                                                {q.type ===
                                                    "multiple_choice" && (
                                                    <div className="flex flex-col gap-2">
                                                        {q.options?.map(
                                                            (
                                                                option,
                                                                optIndex
                                                            ) => (
                                                                <label
                                                                    key={
                                                                        optIndex
                                                                    }
                                                                    className="flex items-center space-x-2 cursor-pointer"
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name={`question-${index}`}
                                                                        value={
                                                                            option
                                                                        }
                                                                        checked={
                                                                            answeredQuestions[
                                                                                index
                                                                            ] ===
                                                                            option
                                                                        }
                                                                        onChange={() =>
                                                                            handleAnswerChange(
                                                                                index,
                                                                                option
                                                                            )
                                                                        }
                                                                        className="radio radio-primary"
                                                                    />
                                                                    <span>
                                                                        {option}
                                                                    </span>
                                                                    {showCorrectAnswers &&
                                                                        option ===
                                                                            q.correct_answer && (
                                                                            <span className="text-green-600 ml-2 font-bold">
                                                                                ✓
                                                                                Correct
                                                                            </span>
                                                                        )}
                                                                    {showCorrectAnswers &&
                                                                        answeredQuestions[
                                                                            index
                                                                        ] ===
                                                                            option &&
                                                                        option !==
                                                                            q.correct_answer && (
                                                                            <span className="text-red-600 ml-2 font-bold">
                                                                                ✗
                                                                                Incorrect
                                                                            </span>
                                                                        )}
                                                                </label>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                                {q.type === "short_answer" && (
                                                    <>
                                                        <input
                                                            type="text"
                                                            placeholder="Your answer"
                                                            value={
                                                                answeredQuestions[
                                                                    index
                                                                ] || ""
                                                            }
                                                            onChange={(e) =>
                                                                handleAnswerChange(
                                                                    index,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="input input-bordered w-full mt-2"
                                                        />
                                                        {showCorrectAnswers && (
                                                            <p className="mt-2 text-green-600 font-bold">
                                                                Correct Answer:{" "}
                                                                {
                                                                    q.correct_answer
                                                                }
                                                            </p>
                                                        )}
                                                        {showCorrectAnswers &&
                                                            answeredQuestions[
                                                                index
                                                            ] &&
                                                            answeredQuestions[
                                                                index
                                                            ]?.toLowerCase() !==
                                                                q.correct_answer.toLowerCase() && (
                                                                <p className="mt-1 text-red-600 font-bold">
                                                                    Your Answer:{" "}
                                                                    {
                                                                        answeredQuestions[
                                                                            index
                                                                        ]
                                                                    }{" "}
                                                                    (Incorrect)
                                                                </p>
                                                            )}
                                                    </>
                                                )}
                                            </div>
                                        )
                                    )}
                                    <div className="flex justify-between items-center mt-4">
                                        <button
                                            onClick={() =>
                                                setShowCorrectAnswers(
                                                    !showCorrectAnswers
                                                )
                                            }
                                            className="btn btn-info"
                                        >
                                            {showCorrectAnswers
                                                ? "Hide Answers"
                                                : "Show Answers"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAnsweredQuestions({}); // Clear answers
                                                setShowCorrectAnswers(false); // Hide answers
                                            }}
                                            className="btn btn-warning"
                                        >
                                            Clear Answers
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500">
                                    No practice questions generated yet. Click
                                    the button below.
                                </p>
                            )}
                            <div className="card-actions justify-end">
                                <button
                                    onClick={handleGenerateQuestions}
                                    className="btn btn-primary"
                                    disabled={loadingQuestions}
                                >
                                    {loadingQuestions ? (
                                        <span className="loading loading-spinner"></span>
                                    ) : paper.generated_questions ? (
                                        "Regenerate Questions"
                                    ) : (
                                        "Generate Questions"
                                    )}
                                </button>
                            </div>
                            {questionsError && (
                                <p className="text-red-500 mt-2">
                                    {questionsError}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
