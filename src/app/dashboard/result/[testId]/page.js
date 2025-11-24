"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../utils/axios";

export default function ResultModule() {
  const { testId } = useParams();
  const router = useRouter();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- helpers ----
  const formatDateTime = (value) => {
    if (!value) return "--";
    try {
      return new Date(value).toLocaleString();
    } catch (e) {
      return String(value);
    }
  };

  const getStatusBadgeClasses = (status) => {
    if (!status) return "bg-slate-100 text-slate-700";
    if (status === "graded")
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    if (status === "pending")
      return "bg-amber-50 text-amber-700 border border-amber-100";
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  const getQuestionModule = (q) => {
    const id = String(q.questionId || "");
    if (id.includes("audio_questions")) return "audio";
    if (id.includes("writing_task")) return "writing";
    return "reading";
  };

  const getModuleLabel = (key) => {
    if (key === "reading") return "Reading";
    if (key === "audio") return "Listening";
    if (key === "writing") return "Writing";
    return key;
  };

  const getQuestionBadge = (q) => {
    if (q.isCorrect === true)
      return {
        label: "Correct",
        classes: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      };
    if (q.isCorrect === false)
      return {
        label: "Incorrect",
        classes: "bg-red-50 text-red-700 border border-red-200",
      };
    return {
      label: "Not auto-graded",
      classes: "bg-slate-50 text-slate-600 border border-slate-200",
    };
  };

  // ---- fetch result ----
  useEffect(() => {
    if (!testId) return;

    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/course-test/result/${testId}`);
        const data =
          (res && res.data && res.data.data) ||
          (res && res.data) ||
          null;

        if (!isMounted) return;

        if (!data) {
          setError("Could not load test result.");
          setResult(null);
        } else {
          setResult(data);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load result:", err?.response || err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load test result.";
        setError(msg);
        setResult(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [testId]);

  const groupedQuestions = useMemo(() => {
    const g = { reading: [], audio: [], writing: [] };
    if (!result || !Array.isArray(result.perQuestion)) return g;

    result.perQuestion.forEach((q) => {
      const mod = getQuestionModule(q);
      if (!g[mod]) g[mod] = [];
      g[mod].push(q);
    });
    return g;
  }, [result]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
          <p className="text-sm text-slate-600">Loading result...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-2">
            Unable to load result
          </h2>
          <p className="text-sm text-slate-700 mb-4">
            {error || "Something went wrong while fetching your test result."}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
            >
              Back to dashboard
            </button>
            <button
              onClick={() => router.refresh()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    test,
    status,
    submittedAt,
    totalPoints,
    maxPoints,
    percentage,
    perModuleSummary = {},
  } = result;

  const statusClasses = getStatusBadgeClasses(status);
  const overallPercent =
    typeof percentage === "number" && !Number.isNaN(percentage)
      ? percentage
      : maxPoints > 0
      ? Math.round((totalPoints / maxPoints) * 100)
      : null;

  const moduleOrder = ["reading", "audio", "writing"];

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 md:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <button
                className="mb-2 inline-flex items-center text-xs text-slate-500 hover:text-slate-700"
                onClick={() => router.push("/dashboard")}
              >
                <span className="mr-1">←</span> Back to dashboard
              </button>
              <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
                {test?.testName || "Test Result"}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Language:{" "}
                <span className="font-medium">
                  {test?.language || "–"}
                </span>{" "}
                · Duration:{" "}
                <span className="font-medium">
                  {test?.duration
                    ? `${Math.floor(test.duration / 60)} min`
                    : "--"}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Submitted at: {formatDateTime(submittedAt)}
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusClasses}`}
              >
                {status || "unknown"}
              </span>

              {overallPercent !== null && (
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14">
                    <svg
                      className="h-14 w-14 -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <path
                        className="text-slate-200"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845
                           a 15.9155 15.9155 0 0 1 0 31.831
                           a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-blue-500"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${overallPercent}, 100`}
                        fill="none"
                        d="M18 2.0845
                           a 15.9155 15.9155 0 0 1 0 31.831
                           a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-slate-800">
                        {overallPercent}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">
                      Overall score
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {totalPoints} / {maxPoints}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Overall stats row */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Total questions
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {Array.isArray(result.perQuestion)
                  ? result.perQuestion.length
                  : "--"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Total marks
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {maxPoints}
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Earned marks
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {totalPoints}
              </div>
              {overallPercent !== null && (
                <div className="text-[11px] text-slate-500">
                  {overallPercent}% overall
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Module breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Module breakdown
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {moduleOrder.map((key) => {
              const mod = perModuleSummary[key] || {};
              const points = mod.points ?? 0;
              const max = mod.maxPoints ?? 0;
              const p = max > 0 ? Math.round((points / max) * 100) : 0;
              return (
                <div
                  key={key}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="text-xs font-medium text-slate-700">
                    {getModuleLabel(key)}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {points} / {max}
                  </div>
                  <div className="text-[11px] text-slate-500">{p}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed questions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-slate-900">
              Detailed review
            </h2>
            <p className="text-xs text-slate-500">
              See each question with your answer and the correct answer.
            </p>
          </div>

          {moduleOrder.map((modKey) => {
            const questions = groupedQuestions[modKey] || [];
            if (!questions.length) return null;

            return (
              <div key={modKey} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-800">
                    {getModuleLabel(modKey)}
                  </h3>
                </div>

                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const badge = getQuestionBadge(q);

                    const baseId = String(q.questionId || "");
                    const isBlank = baseId.startsWith("level_4_p0_blanks_")
                      || baseId.startsWith("level_5_p0_blanks_");

                    return (
                      <div
                        key={`${q.questionId}_${idx}`}
                        className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold px-2 py-0.5">
                                Q{idx + 1}
                              </span>
                              {typeof q.blankIndex === "number" && (
                                <span className="text-[11px] text-slate-500">
                                  Blank {q.blankIndex + 1}
                                </span>
                              )}
                            </div>
                            {q.questionText && (
                              <p className="mt-1 text-xs md:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                                {q.questionText}
                              </p>
                            )}
                          </div>

                          <span
                            className={`inline-flex h-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Answers row */}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="rounded-lg bg-white border border-slate-100 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                              Your answer
                            </div>
                            <div className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                              {q.answerSubmitted === "" ||
                              q.answerSubmitted === null ||
                              q.answerSubmitted === undefined
                                ? "—"
                                : String(q.answerSubmitted)}
                            </div>
                          </div>

                          <div className="rounded-lg bg-white border border-slate-100 p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
                              Correct answer
                            </div>
                            <div className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                              {q.correctAnswer === "" ||
                              q.correctAnswer === null ||
                              q.correctAnswer === undefined
                                ? "—"
                                : String(q.correctAnswer)}
                            </div>
                          </div>
                        </div>

                        {/* Points & feedback */}
                        <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="text-xs text-slate-500">
                            Points:{" "}
                            <span className="font-semibold text-slate-800">
                              {q.points ?? 0}
                            </span>
                            {modKey !== "writing" && " / 1"}
                          </div>

                          {modKey === "writing" && (q.feedback || q.suggestion) && (
                            <div className="text-xs text-slate-600 md:text-right">
                              {q.feedback && (
                                <p className="mb-1">
                                  <span className="font-semibold">
                                    Feedback:
                                  </span>{" "}
                                  {q.feedback}
                                </p>
                              )}
                              {q.suggestion && (
                                <p>
                                  <span className="font-semibold">
                                    Suggestion:
                                  </span>{" "}
                                  {q.suggestion}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white hover:bg-slate-50"
          >
            Back to dashboard
          </button>
          {/* <button
            onClick={() => router.push(`/dashboard/exam/${testId}/start`)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
          >
            Retake exam
          </button> */}
        </div>
      </div>
    </div>
  );
}
