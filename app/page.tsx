"use client";

import { useState, FormEvent, useRef } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, Sparkles } from "lucide-react";

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // 1. Updated the state to include the new feedback string from Gemini
  const [result, setResult] = useState<{ score: number; verified_years: number; feedback: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a valid PDF file.");
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
    }
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Please upload a resume PDF.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData, 
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze resume.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 flex flex-col items-center font-sans">
      <div className="max-w-4xl w-full bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
            Agentic Resume Analyzer
          </h1>
          <p className="text-gray-500 font-medium">Upload a candidate's PDF and evaluate them instantly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Job Description Input */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">
              Job Description Constraints
            </label>
            <textarea
              required
              className="w-full p-5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-700 placeholder-gray-400"
              rows={4}
              placeholder="Paste the technical requirements, skills, and constraints here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {/* PDF Upload Zone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">
              Candidate Resume (PDF)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`w-full relative overflow-hidden group cursor-pointer flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl transition-all ${
                file ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 bg-gray-50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
              {file ? (
                <div className="flex flex-col items-center text-indigo-600">
                  <FileText className="w-12 h-12 mb-3" />
                  <p className="font-semibold text-lg">{file.name}</p>
                  <p className="text-sm text-indigo-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500 group-hover:text-indigo-500 transition-colors">
                  <UploadCloud className="w-12 h-12 mb-3" />
                  <p className="font-semibold text-lg mb-1">Click to upload PDF</p>
                  <p className="text-sm">or drag and drop here</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-5 rounded-2xl font-bold text-lg text-white transition-all flex items-center justify-center gap-3 ${
              isLoading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:-translate-y-1"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Running Multi-Agent Validation...
              </>
            ) : (
              "Analyze Candidate"
            )}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mt-8 p-5 bg-red-50 text-red-700 border border-red-200 rounded-2xl font-medium flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="mt-10 p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl animate-in fade-in slide-in-from-bottom-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h2 className="text-2xl font-bold text-green-800">Analysis Complete</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-2">
                  Overall Match
                </p>
                <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-emerald-800">
                  {result.score}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-2">
                  Verified Experience
                </p>
                <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-emerald-800">
                  {result.verified_years} <span className="text-2xl text-gray-400 font-semibold tracking-normal">Yrs</span>
                </p>
              </div>
            </div>

            {/* 2. NEW FEATURE: AI Career Coach Feedback Section */}
            {result.feedback && (
              <div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-6 h-6 text-indigo-500" />
                  <h3 className="text-lg font-bold text-indigo-900">AI Career Coach</h3>
                </div>
                <p className="text-indigo-800/80 leading-relaxed font-medium">
                  {result.feedback}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}