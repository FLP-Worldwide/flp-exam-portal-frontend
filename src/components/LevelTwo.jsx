"use client";
import React, { useEffect, useMemo, useState } from "react";

/**
 * LabelTwo (Level 2) - multiple-choice reading questions (dynamic paragraph)
 *
 * Props:
 * - questions: array (from parent) — expected shapes:
 *    1) array of module paragraphs: [{ paragraph: "...", questions: [...] }, ...]
 *    2) OR flat questions: [{ _id, text, options: [...] }, ...]
 * - initialAnswers: { questionId: selectedOption, ... }
 * - disabled: boolean
 * - onSubmitLevel: function(answersForLevel)
 * - testId: optional string for localStorage key `exam_answers_{testId}`
 */
export default function LabelTwo({
  questions = [],
  initialAnswers = {},
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
}) {
  // Normalize incoming questions into flat list: [{ _id, text, options: [{id,title}] }]
  const normalized = useMemo(() => {
    if (!Array.isArray(questions)) return [];

    // detect module shape (paragraph + questions array)
    const looksLikeModule = questions.length > 0 && !!questions[0].paragraph && Array.isArray(questions[0].questions);

    if (looksLikeModule) {
      const out = [];
      questions.forEach((p, pIdx) => {
        const para = p.paragraph ?? "";
        (p.questions || []).forEach((q, qIdx) => {
          const id = q._id ?? q.id ?? `lvl2_p${pIdx}_q${qIdx}`;
          const text = q.question ?? q.text ?? para ?? `Question ${id}`;
          const opts =
            Array.isArray(q.options) && q.options.length
              ? q.options.map((o, i) => (typeof o === "string" ? { id: `${id}_opt_${i}`, title: o } : { id: o.id ?? o._id ?? `${id}_opt_${i}`, title: o.title ?? String(o) }))
              : [];
          out.push({ _id: id, text, options: opts, raw: q });
        });
      });
      return out;
    }

    // otherwise normalize each item as question
    return questions.map((q, idx) => {
      const id = q._id ?? q.id ?? `lvl2_q_${idx}`;
      const text = q.text ?? q.question ?? q.paragraph ?? `Question ${idx + 1}`;
      const opts =
        Array.isArray(q.options) && q.options.length
          ? q.options.map((o, i) => (typeof o === "string" ? { id: `${id}_opt_${i}`, title: o } : { id: o.id ?? o._id ?? `${id}_opt_${i}`, title: o.title ?? String(o) }))
          : [];
      return { _id: id, text, options: opts, raw: q };
    });
  }, [questions]);

  // derive reading paragraph (use first paragraph from module shape if present)
const readingParagraph = useMemo(() => {
  if (!Array.isArray(questions) || questions.length === 0) return null;

  // if the parentParagraph was attached in fetch
  if (questions[0]?.parentParagraph) return questions[0].parentParagraph;

  // If module-shaped (first item may be a paragraph object)
  if (questions[0] && questions[0].paragraph) return questions[0].paragraph;

  // Try to find any parentParagraph on any question
  for (const it of questions) {
    if (it?.parentParagraph) return it.parentParagraph;
    if (it?.raw?.parentParagraph) return it.raw.parentParagraph;
    if (it?.raw?.paragraph) return it.raw.paragraph;
    if (it?.content && typeof it.content === "string") return it.content;
    if (it?.content?.paragraph) return it.content.paragraph;
  }
  return null;
}, [questions]);

  // Answers state for this level
  const [answers, setAnswers] = useState(() => {
    try {
      if (initialAnswers && Object.keys(initialAnswers).length) return { ...initialAnswers };
      if (testId && typeof window !== "undefined") {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          const relevant = {};
          normalized.forEach((q) => {
            if (parsed[q._id] !== undefined) relevant[q._id] = parsed[q._id];
          });
          return relevant;
        }
      }
    } catch (e) {
      // ignore storage errors
    }
    return {};
  });

  // persist changes for the whole test into localStorage
  useEffect(() => {
    if (!testId) return;
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const merged = { ...parsed, ...answers };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
    } catch (e) {
      // ignore
    }
  }, [answers, testId]);

  const handleSelect = (qid, optId) => {
    if (disabled) return;
    setAnswers((prev) => ({ ...prev, [qid]: optId }));
  };

  const handleSubmit = () => {
    // prepare only answers for questions present here
    const out = {};
    normalized.forEach((q) => {
      if (answers[q._id] !== undefined) out[q._id] = answers[q._id];
    });
    onSubmitLevel(out);
  };

  return (
    <div className="space-y-8">
      {/* dynamic reading paragraph (if present) */}
      {readingParagraph && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-[#004080] mb-4">Reading Passage</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{readingParagraph}</p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {normalized.length === 0 ? (
          <div className="p-6 text-gray-500">No questions available for this level.</div>
        ) : (
          normalized.map((q, idx) => (
            <div
              key={q._id}
              className="border border-gray-200 rounded-lg p-5 hover:shadow transition bg-white"
            >
              <h3 className="font-semibold text-gray-800 mb-3">
                {idx + 1}. {q.text}
              </h3>

              <div className="space-y-2">
                {q.options && q.options.length > 0 ? (
                  q.options.map((opt, oi) => {
                    const selected = answers[q._id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelect(q._id, opt.id)}
                        className={`w-full text-left border px-3 py-2 rounded-md transition ${
                          selected ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:bg-gray-100"
                        }`}
                        disabled={disabled}
                      >
                        <div className="flex items-start gap-3">
                          <div className="font-mono font-semibold">{String.fromCharCode(65 + oi)}</div>
                          <div className="text-sm">{opt.title}</div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500">No options provided for this question.</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4">
        <div>
          {!disabled && (
            <button
              onClick={() => {
                // save progress to localStorage for this test
                if (!testId) return alert("No testId provided to save progress.");
                try {
                  const raw = localStorage.getItem(`exam_answers_${testId}`);
                  const parsed = raw ? JSON.parse(raw) : {};
                  const merged = { ...parsed, ...answers };
                  localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
                  alert("Progress saved locally.");
                } catch {
                  alert("Failed saving progress.");
                }
              }}
              className="px-4 py-2 rounded bg-gray-100 text-gray-800 mr-3"
            >
              Save Progress
            </button>
          )}
        </div>

        <div>
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className={`px-4 py-2 rounded ${disabled ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-green-600 text-white"}`}
          >
            Submit Level
          </button>
        </div>
      </div>
    </div>
  );
}
