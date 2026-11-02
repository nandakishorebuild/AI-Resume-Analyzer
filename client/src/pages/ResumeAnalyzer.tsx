import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../config/api";
import useLocalStorage from "../hooks/useLocalStorage";

interface Analysis {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  suggestions: string[];
  matchScore?: number;
  matchedKeywords?: string[];
  missingKeywords?: string[];
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      fallback
    );
  }

  return fallback;
}

function ScoreCard({
  title,
  score,
  description,
  accent,
}: {
  title: string;
  score: number;
  description: string;
  accent: "amber" | "green";
}) {
  const safeScore = Math.max(0, Math.min(100, score));
  const color = accent === "amber" ? "#FBBF24" : "#10B981";

  return (
    <section className="bg-[#292929] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-lg">
      <p className="text-stone-400 text-sm font-medium">{title}</p>

      <div className="flex items-center gap-4 mt-4">
        <div
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: `conic-gradient(${color} ${safeScore * 3.6}deg, #44403C 0deg)`,
          }}
        >
          <div className="absolute inset-[7px] rounded-full bg-[#292929] flex items-center justify-center">
            <span
              className="text-2xl sm:text-3xl font-bold"
              style={{ color }}
            >
              {safeScore}
            </span>
          </div>
        </div>

        <div>
          <p className="text-stone-100 font-semibold text-base sm:text-lg">
            {title}
          </p>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

function ResultCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-[#292929] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-lg min-w-0 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-stone-100 text-base sm:text-lg font-semibold">
          {title}
        </h3>

        {subtitle && (
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function ResultList({
  items,
  emptyMessage,
  color = "stone",
}: {
  items: string[];
  emptyMessage: string;
  color?: "green" | "red" | "amber" | "stone";
}) {
  const bulletColors = {
    green: "bg-emerald-400",
    red: "bg-red-400",
    amber: "bg-amber-400",
    stone: "bg-stone-400",
  };

  if (items.length === 0) {
    return (
      <p className="text-stone-500 text-sm py-2">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-3">
          <span
            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${bulletColors[color]}`}
          />
          <span className="text-stone-300 text-sm leading-relaxed break-words">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function KeywordList({
  items,
  color,
  emptyMessage,
}: {
  items: string[];
  color: "green" | "amber";
  emptyMessage: string;
}) {
  const styles =
    color === "green"
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
      : "bg-amber-500/10 border-amber-500/20 text-amber-300";

  if (items.length === 0) {
    return (
      <p className="text-stone-500 text-sm">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((keyword, index) => (
        <span
          key={`${keyword}-${index}`}
          className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium break-all ${styles}`}
        >
          {keyword}
        </span>
      ))}
    </div>
  );
}

export default function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"uploading" | "analyzing">("uploading");
  const [error, setError] = useState("");

  const resultsRef = useRef<HTMLDivElement | null>(null);

  const token = useLocalStorage("token");
  const navigate = useNavigate();

  // Scroll to the loading indicator and then to the results.
  useEffect(() => {
    if (loading || analysis) {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [loading, analysis]);

  // Automatically analyze after successful upload.
  useEffect(() => {
    if (!resumeId || !token.value) return;

    let cancelled = false;

    async function analyzeResume() {
      setLoading(true);
      setStage("analyzing");
      setError("");

      try {
        const response = await api.get(
          `/resumes/analyze/${resumeId}`,
          {
            headers: {
              Authorization: `Bearer ${token.value}`,
            },
          }
        );

        if (!cancelled) {
          const result = response.data?.analysis;

          if (!result || typeof result !== "object") {
            throw new Error("The server returned an invalid analysis.");
          }

          setAnalysis({
            score: Number(result.score) || 0,
            matchScore:
              typeof result.matchScore === "number"
                ? result.matchScore
                : undefined,
            summary:
              typeof result.summary === "string"
                ? result.summary
                : "No summary available.",
            strengths: Array.isArray(result.strengths)
              ? result.strengths
              : [],
            weaknesses: Array.isArray(result.weaknesses)
              ? result.weaknesses
              : [],
            missingSkills: Array.isArray(result.missingSkills)
              ? result.missingSkills
              : [],
            suggestions: Array.isArray(result.suggestions)
              ? result.suggestions
              : [],
            matchedKeywords: Array.isArray(result.matchedKeywords)
              ? result.matchedKeywords
              : [],
            missingKeywords: Array.isArray(result.missingKeywords)
              ? result.missingKeywords
              : [],
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Analysis failed. Please try again."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    analyzeResume();

    return () => {
      cancelled = true;
    };
  }, [resumeId, token.value]);

  // File selection and validation.
  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const extension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (!["pdf", "docx"].includes(extension || "")) {
      setError("Please select a PDF or DOCX file.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setAnalysis(null);
    setResumeId(null);
    setError("");
    setLoading(false);
  }

  // Upload resume.
  async function handleUpload() {
    if (!file) {
      setError("Please select your resume first.");
      return;
    }

    if (!token.value) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setStage("uploading");
    setError("");
    setAnalysis(null);

    try {
      const formData = new FormData();

      formData.append("resume", file);

      // Job description is optional.
      if (jdText.trim()) {
        formData.append("jobDescription", jdText.trim());
      }

      const response = await api.post(
        "/resumes/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        }
      );

      const uploadedResumeId = response.data?.resumeId;

      if (
        uploadedResumeId === undefined ||
        uploadedResumeId === null
      ) {
        throw new Error("The server did not return a resume ID.");
      }

      setResumeId(Number(uploadedResumeId));
    } catch (err) {
      setError(getErrorMessage(err, "Resume upload failed. Please try again."));
      setLoading(false);
    }
  }

  // Start a fresh analysis.
  function resetAll() {
    setFile(null);
    setJdText("");
    setResumeId(null);
    setAnalysis(null);
    setError("");
    setLoading(false);
    setStage("uploading");
  }

  return (
    <main className="min-h-screen bg-[#171717] text-stone-100 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="max-w-6xl mx-auto">

        {/* Page heading */}
        <header className="text-center mb-9 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            AI-POWERED RESUME REVIEW
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-100">
            Resume <span className="text-amber-400">Analyzer</span>
          </h1>

          <p className="max-w-xl mx-auto text-stone-400 text-sm sm:text-base mt-4 leading-relaxed">
            Understand your resume, identify skill gaps, and discover how
            well your profile aligns with your target job.
          </p>
        </header>

        {/* Upload section */}
        <section className="max-w-3xl mx-auto space-y-5">

          {/* Resume upload card */}
          <div className="bg-[#292929] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold">
                01
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-100">
                  Upload your resume
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  Select your latest resume to get started
                </p>
              </div>
            </div>

            <label
              htmlFor="resume-file"
              className="group flex flex-col items-center justify-center text-center min-h-44 sm:min-h-48 border-2 border-dashed border-stone-600 hover:border-amber-500/70 bg-[#202020] hover:bg-amber-500/[0.03] rounded-xl px-4 py-7 cursor-pointer transition-all duration-200"
            >
              <input
                id="resume-file"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="sr-only"
              />

              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3 group-hover:bg-amber-500/15 transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.7}
                    d="M12 16V4m0 0L7 9m5-5l5 5M5 16v3h14v-3"
                  />
                </svg>
              </div>

              {file ? (
                <>
                  <p className="text-amber-300 font-semibold text-sm break-all">
                    {file.name}
                  </p>
                  <p className="text-stone-500 text-xs mt-2">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · Selected
                  </p>
                  <span className="text-amber-400 text-xs mt-3 underline">
                    Choose another file
                  </span>
                </>
              ) : (
                <>
                  <p className="text-stone-200 font-semibold text-sm">
                    Click to browse your files
                  </p>
                  <p className="text-stone-500 text-xs mt-2">
                    PDF or DOCX format
                  </p>
                  <span className="text-amber-400 text-xs mt-3 font-medium">
                    Browse files
                  </span>
                </>
              )}
            </label>
          </div>

          {/* Job description card */}
          <div className="bg-[#292929] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold">
                02
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-100">
                  Job description{" "}
                  <span className="text-amber-400 text-sm">(Optional)</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500">
                  Add a job posting to get a personalized job match score
                </p>
              </div>
            </div>

            <textarea
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
              rows={7}
              placeholder="Paste a job description here if you want to check how well your resume matches a particular job. This field is optional..."
              className="w-full min-h-40 bg-[#202020] border border-white/10 rounded-xl p-4 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/10 resize-y transition-all"
            />

            <div className="flex justify-between items-center mt-2">
              <p className="text-stone-600 text-xs">
                Optional: Add a job description to receive a job match analysis.
              </p>
              <span className="text-stone-500 text-xs tabular-nums">
                {jdText.length} characters
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-4 text-sm"
            >
              <span className="text-red-400">!</span>
              <p>{error}</p>
            </div>
          )}

          {/* Analyze button */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-[#171717] font-bold text-sm sm:text-base py-4 px-6 rounded-xl shadow-lg shadow-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 rounded-full border-2 border-[#171717]/30 border-t-[#171717] animate-spin" />
                {stage === "uploading"
                  ? "Uploading resume..."
                  : "Analyzing your resume..."}
              </>
            ) : (
              <>
                Analyze my resume
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>

          <p className="text-center text-stone-600 text-xs">
            Your analysis is an AI-generated estimate, not a guarantee
            of any employer's ATS result.
          </p>
        </section>

        {/* Loading state */}
        {loading && (
          <div
            ref={resultsRef}
            className="max-w-3xl mx-auto mt-8 scroll-mt-8 bg-[#292929] border border-white/10 rounded-2xl p-6 text-center"
          >
            <div
              role="status"
              aria-label="Processing"
              className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-4"
            />

            <h3 className="text-stone-100 font-semibold">
              {stage === "uploading"
                ? "Uploading your resume"
                : "Analyzing your resume"}
            </h3>

            <p className="text-stone-500 text-sm mt-2">
              Please wait while we process your information.
            </p>
          </div>
        )}

        {/* Analysis results */}
        {analysis && (
          <section
            ref={resultsRef}
            className="mt-12 sm:mt-16 scroll-mt-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
              <div>
                <p className="text-amber-400 text-xs font-semibold tracking-wider uppercase mb-2">
                  Analysis report
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-100">
                  Your resume insights
                </h2>
                <p className="text-stone-500 text-sm mt-2">
                  Review your results and identify opportunities to improve.
                </p>
              </div>

              <span className="text-xs text-stone-500 border border-white/10 rounded-lg px-3 py-2 w-fit">
                Resume #{resumeId}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">

              {/* Score cards */}
              <ScoreCard
                title="Resume score"
                score={analysis.score}
                description="Estimated overall resume quality"
                accent="amber"
              />

              {jdText.trim() && typeof analysis.matchScore === "number" && (
                <ScoreCard
                  title="Job match score"
                  score={analysis.matchScore}
                  description="Estimated match with the job description"
                  accent="green"
                />
              )}

              {/* Summary */}
              <ResultCard
                title="Candidate summary"
                subtitle="An overview of your professional profile"
                className="md:col-span-2"
              >
                <p className="text-stone-300 text-sm leading-7">
                  {analysis.summary}
                </p>
              </ResultCard>

              {/* Strengths */}
              <ResultCard
                title="Strengths"
                subtitle="Positive points identified in your resume"
              >
                <ResultList
                  items={analysis.strengths}
                  emptyMessage="No strengths were provided."
                  color="green"
                />
              </ResultCard>

              {/* Weaknesses */}
              <ResultCard
                title="Areas to improve"
                subtitle="Potential gaps identified in your resume"
              >
                <ResultList
                  items={analysis.weaknesses}
                  emptyMessage="No weaknesses were identified."
                  color="red"
                />
              </ResultCard>

              {/* Job description keyword comparison */}
              {jdText.trim() && (
                <>
                  {/* Matched keywords */}
                  <ResultCard
                    title="Matched keywords"
                    subtitle="Skills and terms found in your resume"
                  >
                    <KeywordList
                      items={analysis.matchedKeywords || []}
                      color="green"
                      emptyMessage="No matched keywords were identified."
                    />
                  </ResultCard>

                  {/* Missing keywords */}
                  <ResultCard
                    title="Missing keywords"
                    subtitle="Job description terms not identified in your resume"
                  >
                    <KeywordList
                      items={analysis.missingKeywords || []}
                      color="amber"
                      emptyMessage="No missing keywords were identified."
                    />
                  </ResultCard>
                </>
              )}

              {/* Missing skills */}
              <ResultCard
                title="Skills to develop"
                subtitle="Potential skills to strengthen for your target role"
              >
                <ResultList
                  items={analysis.missingSkills}
                  emptyMessage="No additional skills were suggested."
                  color="amber"
                />
              </ResultCard>

              {/* Suggestions */}
              <ResultCard
                title="Recommendations"
                subtitle="Practical ways to improve your resume"
              >
                <ResultList
                  items={analysis.suggestions}
                  emptyMessage="No recommendations available."
                  color="stone"
                />
              </ResultCard>

              {/* Action buttons */}
              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAll}
                  className="flex-1 bg-[#292929] hover:bg-[#333333] border border-white/10 text-stone-200 font-semibold py-3.5 px-5 rounded-xl transition-colors"
                >
                  Analyze another resume
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-[#171717] font-bold py-3.5 px-5 rounded-xl transition-colors shadow-lg shadow-amber-500/10"
                >
                  View analysis history →
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}