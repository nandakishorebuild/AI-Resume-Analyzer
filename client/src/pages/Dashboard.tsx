
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import api from "../config/api";

interface Analysis {
  score: number;
  matchScore?: number;
  summary: string;
  strengths?: string[];
  weaknesses?: string[];
  missingSkills?: string[];
  suggestions?: string[];
}

interface HistoryItem {
  id: number;
  analysis: Analysis | null;
  created_at: string;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-400 border-emerald-400";
  if (score >= 60) return "text-amber-400 border-amber-400";
  return "text-red-400 border-red-400";
}

function getScoreBackground(score: number) {
  if (score >= 80) return "bg-emerald-400/10";
  if (score >= 60) return "bg-amber-400/10";
  return "bg-red-400/10";
}

function DetailSection({
  title,
  subtitle,
  items,
  color,
  bulletColor,
}: {
  title: string;
  subtitle: string;
  items: string[];
  color: string;
  bulletColor: string;
}) {
  return (
    <div className="rounded-xl border border-[#3A3A3A] bg-[#222222] p-5">
      <h3 className={`mb-1 text-base font-semibold ${color}`}>
        {title}
      </h3>

      <p className="mb-4 text-sm text-[#A8A29E]">{subtitle}</p>

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={`${index}-${item}`}
              className="flex items-start gap-3 text-sm leading-6 text-[#E7E5E4]"
            >
              <span
                className={`mt-2 h-2 w-2 shrink-0 rounded-full ${bulletColor}`}
              />
              <span className="break-words">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#78716C]">
          No information available.
        </p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const navigate = useNavigate();

  // Scroll to the top whenever the Dashboard page opens.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadDashboardData() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      try {
        const [meResponse, historyResponse] = await Promise.all([
          api.get("/auth/me", config),
          api.get("/resumes/history", config),
        ]);

        if (!isActive) return;

        if (!meResponse.data) {
          throw new Error("Authentication verification failed");
        }

        const historyData = historyResponse.data.history;

        setHistory(
          Array.isArray(historyData) ? historyData : []
        );
      } catch (err: unknown) {
        if (!isActive) return;

        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        setError("Unable to load your dashboard. Please try again.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isActive = false;
    };
  }, [navigate]);

  function toggleExpanded(id: number) {
    setExpandedId((current) => (current === id ? null : id));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171717] px-4 pt-24 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#3A3A3A] border-t-[#F59E0B]" />

        <p className="mt-4 text-sm text-[#A8A29E]">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#171717] px-4 pt-24">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-[#252525] p-8 text-center">
          <div className="mb-4 text-4xl">⚠️</div>

          <h2 className="text-xl font-bold text-[#FAFAF9]">
            Something went wrong
          </h2>

          <p className="mt-2 text-sm text-[#A8A29E]">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-[#D97706] px-5 py-2.5 font-semibold text-white transition hover:bg-[#F59E0B]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#171717] px-4 py-8 text-[#FAFAF9] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Dashboard heading */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#FBBF24]">
              Your workspace
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-[#A8A29E] sm:text-base">
              Manage your resume analyses and track your improvements.
            </p>
          </div>

          <button
            onClick={() => navigate("/analyze")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D97706] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-900/10 transition hover:bg-[#F59E0B] active:scale-[0.98]"
          >
            Upload Resume
          </button>
        </div>

        {/* History heading */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              Analysis History
            </h2>

            <p className="mt-1 text-sm text-[#A8A29E]">
              Your previously analyzed resumes.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-[#6B450F] bg-[#D97706]/10 px-3 py-1.5 text-sm font-semibold text-[#FBBF24]">
            {history.length} {history.length === 1 ? "Report" : "Reports"}
          </span>
        </div>

        {/* Empty state */}
        {history.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#454545] bg-[#222222] px-6 py-16 text-center">
            <div className="mb-5 text-5xl">📄</div>

            <h3 className="text-xl font-semibold">
              No analyses yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#A8A29E]">
              Upload your first resume and get AI-powered insights into
              your strengths, missing skills and job match.
            </p>

            <button
              onClick={() => navigate("/analyze")}
              className="mt-6 rounded-lg bg-[#D97706] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#F59E0B]"
            >
              Analyze your first resume
            </button>
          </div>
        )}

        {/* Analysis history cards */}
        <div className="space-y-5">
          {history.map((historyItem, historyIndex) => {
            const analysis = historyItem.analysis;

            const score = Math.min(
              100,
              Math.max(0, Number(analysis?.score) || 0)
            );

            const isExpanded = expandedId === historyItem.id;

            const strengths = Array.isArray(analysis?.strengths)
              ? analysis.strengths
              : [];

            const weaknesses = Array.isArray(analysis?.weaknesses)
              ? analysis.weaknesses
              : [];

            const missingSkills = Array.isArray(analysis?.missingSkills)
              ? analysis.missingSkills
              : [];

            const suggestions = Array.isArray(analysis?.suggestions)
              ? analysis.suggestions
              : [];

            return (
              <article
                key={historyItem.id}
                className="overflow-hidden rounded-2xl border border-[#3A3A3A] bg-[#252525] shadow-sm transition hover:border-[#6B4B20]"
              >
                {/* Card header */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(historyItem.id)}
                  aria-expanded={isExpanded}
                  className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:p-6"
                >
                  {/* Resume score */}
                  <div
                    className={`flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center rounded-full border-[3px] ${getScoreColor(score)} ${getScoreBackground(score)}`}
                  >
                    <span className="text-xl font-bold tabular-nums">
                      {score}
                    </span>

                    <span className="text-[9px] font-semibold uppercase">
                      Score
                    </span>
                  </div>

                  {/* Resume information */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">
                        Resume #{historyIndex + 1}
                      </h3>

                      <span className="rounded-md border border-[#454545] px-2 py-1 text-[11px] text-[#A8A29E]">
                        AI Analysis
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-[#A8A29E]">
                      {historyItem.created_at
                        ? new Date(historyItem.created_at).toLocaleString()
                        : "Date unavailable"}
                    </p>

                    <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-[#D6D3D1]">
                      {analysis?.summary || "No summary available."}
                    </p>
                  </div>

                  {/* Job match score and expand */}
                  <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[#3A3A3A] pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    {analysis?.matchScore !== undefined && (
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-[#A8A29E]">
                          Job match
                        </p>

                        <p className="mt-1 text-lg font-bold text-emerald-400">
                          {Math.min(
                            100,
                            Math.max(0, Number(analysis.matchScore) || 0)
                          )}
                          %
                        </p>
                      </div>
                    )}

                    <span className="text-sm font-semibold text-[#FBBF24]">
                      {isExpanded ? "Show less ▲" : "View details ▼"}
                    </span>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-[#3A3A3A] bg-[#1D1D1D] p-5 sm:p-6">
                    {!analysis ? (
                      <p className="text-sm text-[#A8A29E]">
                        Analysis details are unavailable for this report.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <DetailSection
                          title="Strengths"
                          subtitle="Positive points identified in your resume"
                          items={strengths}
                          color="text-emerald-400"
                          bulletColor="bg-emerald-400"
                        />

                        <DetailSection
                          title="Areas to improve"
                          subtitle="Potential gaps identified in your resume"
                          items={weaknesses}
                          color="text-red-400"
                          bulletColor="bg-red-400"
                        />

                        <DetailSection
                          title="Missing skills"
                          subtitle="Skills you may need to strengthen"
                          items={missingSkills}
                          color="text-amber-400"
                          bulletColor="bg-amber-400"
                        />

                        <DetailSection
                          title="Recommendations"
                          subtitle="Practical ways to improve your resume"
                          items={suggestions}
                          color="text-[#FBBF24]"
                          bulletColor="bg-[#FBBF24]"
                        />
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <p className="mt-8 text-center text-xs text-[#78716C]">
            Your resume analysis history is stored securely in your account.
          </p>
        )}
      </div>
    </main>
  );
}
