"use client";
import React, { useMemo, useState } from "react";

/**
 * Dynamic Lesen3 (Leseverstehen Teil 3)
 * Props:
 *  - questions: array of paragraph objects: [{ paragraph: "...", answer: "Answer 1" }, ...]
 *  - initialAnswers, disabled, onSubmitLevel, testId (optional)
 */
export default function Lesen3({
  questions = [],
  initialAnswers = {},
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
}) {
  // leftTexts: transform paragraphs into objects { id: 'A', title?, content }
  const leftTexts = useMemo(() => {
    if (!Array.isArray(questions) || questions.length === 0) return [];
    return questions.map((p, i) => ({
      id: String.fromCharCode(65 + i),
      title: p.title ?? `Text ${String.fromCharCode(65 + i)}`,
      content: p.paragraph ?? "",
    }));
  }, [questions]);

  // rightOptions: use all answers from the paragraphs, shuffle for the option pool
  const rightOptions = useMemo(() => {
    const opts = (questions || []).map((p, i) => {
      // each answer shown as letter (A/B/C...) or the answer string — we'll show letters mapping to left text
      // we want pool to show letters A,B,C (left text ids) — user asked: left side texts A,B,C; right side options are letters
      return String.fromCharCode(65 + i);
    });
    // shuffle for randomness
    return [...opts].sort(() => Math.random() - 0.5);
  }, [questions]);

  // answers: questionId -> selected letter (A/B/C)
  const [answers, setAnswers] = useState(() => ({ ...(initialAnswers || {}) }));

  const handleSelect = (qid, letter) => {
    if (disabled) return;
    setAnswers((prev) => ({ ...prev, [qid]: letter }));
  };

  const handleSubmit = () => {
    onSubmitLevel(answers);
    alert("Level 3 submitted.");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* LEFT: Paragraphs A, B, C */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#004080] mb-2">Leseverstehen – Teil 3</h2>
        <p className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm text-gray-700 rounded">
          Lesen Sie die Texte (A–{String.fromCharCode(65 + Math.max(0, leftTexts.length - 1))}) und die Aufgaben (1–{questions.length}).
          Welcher Text passt zu welcher Situation? Wählen Sie den passenden Buchstaben.
        </p>

        {leftTexts.map((t) => (
          <div key={t.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-[#004080]">{t.id}</span>
              <span className="text-sm text-gray-500">{t.title}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{t.content}</p>
          </div>
        ))}
      </div>

      {/* RIGHT: Questions and option pool (A/B/C letters) */}
      <div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
          <h3 className="font-semibold text-[#004080]">Aufgaben (1–{questions.length})</h3>
          <p className="text-sm text-gray-600">Wählen Sie für jede Situation den passenden Text (A, B, C ...).</p>
        </div>

        <div className="space-y-3">
          {(questions || []).map((q, idx) => {
            const qid = `q_${idx + 1}`;
            return (
              <div key={qid} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow transition">
                <p className="text-sm font-medium text-gray-800 mb-2">{idx + 1}. {q.question ?? q.prompt ?? q.situation ?? q.paragraph ?? `Question ${idx + 1}`}</p>

                <div className="flex gap-2 flex-wrap">
                  {rightOptions.map((letter) => (
                    <button
                      key={`${qid}_${letter}`}
                      onClick={() => handleSelect(qid, letter)}
                      className={`px-3 py-1 border rounded text-sm font-semibold transition ${answers[qid] === letter ? "bg-[#004080] text-white border-[#004080]" : "border-gray-300 hover:bg-blue-100"}`}
                      disabled={disabled}
                    >
                      {letter}
                    </button>
                  ))}
                  <button
                    onClick={() => handleSelect(qid, "x")}
                    className={`px-3 py-1 border rounded text-sm font-semibold transition ${answers[qid] === "x" ? "bg-red-600 text-white border-red-600" : "border-gray-300 hover:bg-red-100"}`}
                    disabled={disabled}
                  >
                    x
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={handleSubmit} disabled={disabled} className={`px-4 py-2 rounded ${disabled ? "bg-gray-300 text-gray-600" : "bg-green-600 text-white"}`}>
            Submit Level
          </button>
        </div>
      </div>
    </div>
  );
}
