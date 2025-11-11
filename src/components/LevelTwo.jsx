// components/LabelTwo.jsx
"use client";
import React, { useEffect, useMemo, useState } from "react";

/**
 * LabelTwo (Level 2) - multiple-choice reading questions (dynamic paragraph)
 *
 * Props:
 * - questions: array (from parent) — expected shapes:
 *    1) module shape: [{ paragraph: "...", questions: [...] }, ...]
 *    2) flat mcq items: [{ _id, text, options: [...], parentParagraph }, ...]
 * - initialAnswers: { questionId: selectedOptionTitle, ... }  // note: titles (strings)
 * - disabled: boolean
 * - onSubmitLevel: function(answersForLevel) // will be called with { [levelKey]: { questionId: title } }
 * - testId: optional string for localStorage key `exam_answers_{testId}`
 * - levelKey: string, defaults to "level2"
 */
export default function LabelTwo({
  questions = [],
  initialAnswers = {},
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
  levelKey = "level2",
}) {
  // Normalization: produce flat list of questions { _id, text, options: [{id,title}], parentParagraph?, raw }
  const normalized = useMemo(() => {
    if (!Array.isArray(questions)) return [];

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
          out.push({ _id: id, text, options: opts, parentParagraph: para, raw: q });
        });
      });
      return out;
    }

    const flat = [];
    questions.forEach((item, idx) => {
      if (item && item.paragraph && Array.isArray(item.questions)) {
        const para = item.paragraph;
        item.questions.forEach((q, qIdx) => {
          const id = q._id ?? q.id ?? `${idx}_q${qIdx}`;
          const text = q.question ?? q.text ?? para ?? `Question ${id}`;
          const opts =
            Array.isArray(q.options) && q.options.length
              ? q.options.map((o, i) => (typeof o === "string" ? { id: `${id}_opt_${i}`, title: o } : { id: o.id ?? o._id ?? `${id}_opt_${i}`, title: o.title ?? String(o) }))
              : [];
          flat.push({ _id: id, text, options: opts, parentParagraph: para, raw: q });
        });
        return;
      }

      if (item && (item._id || item.id || item.text || item.question || item.paragraph)) {
        const id = item._id ?? item.id ?? `lvl2_q_${idx}`;
        const text = item.text ?? item.question ?? item.paragraph ?? item.prompt ?? `Question ${idx + 1}`;
        const opts =
          Array.isArray(item.options) && item.options.length
            ? item.options.map((o, i) => (typeof o === "string" ? { id: `${id}_opt_${i}`, title: o } : { id: o.id ?? o._id ?? `${id}_opt_${i}`, title: o.title ?? String(o) }))
            : [];
        const parentPara = item.parentParagraph ?? item.paragraph ?? item.raw?.parentParagraph ?? item.raw?.paragraph ?? null;
        flat.push({ _id: id, text, options: opts, parentParagraph: parentPara, raw: item });
        return;
      }

      const id = `lvl2_q_fallback_${idx}`;
      const text = typeof item === "string" ? item : JSON.stringify(item).slice(0, 200);
      flat.push({ _id: id, text, options: [], parentParagraph: null, raw: item });
    });

    return flat;
  }, [questions]);

  // Robust reading paragraph derivation
  const readingParagraph = useMemo(() => {
    if (!Array.isArray(questions) || questions.length === 0) return null;

    if (normalized[0]?.parentParagraph) return normalized[0].parentParagraph;
    if (normalized[0]?.paragraph) return normalized[0].paragraph;

    for (const it of normalized) {
      if (it?.parentParagraph) return it.parentParagraph;
      if (it?.paragraph) return it.paragraph;
      if (it?.raw?.parentParagraph) return it.raw.parentParagraph;
      if (it?.raw?.paragraph) return it.raw.paragraph;
    }

    if (questions[0]?.paragraph && typeof questions[0].paragraph === "string") return questions[0].paragraph;

    const firstRaw = questions[0];
    if (firstRaw) {
      if (firstRaw.content?.paragraph) return firstRaw.content.paragraph;
      if (firstRaw.content?.paragraphs && Array.isArray(firstRaw.content.paragraphs) && firstRaw.content.paragraphs[0]?.paragraph) {
        return firstRaw.content.paragraphs[0].paragraph;
      }
    }

    return null;
  }, [questions, normalized]);

  // Answers state (store titles)
  const [answers, setAnswers] = useState(() => {
    try {
      // prefer explicit initialAnswers prop if provided
      if (initialAnswers && Object.keys(initialAnswers).length) return { ...initialAnswers };

      if (testId && typeof window !== "undefined") {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        if (raw) {
          const parsed = JSON.parse(raw);

          // 1) prefer grouped shape: parsed.levels[levelKey]
          if (parsed && parsed.levels && parsed.levels[levelKey]) {
            const lvl = parsed.levels[levelKey];
            const relevant = {};
            normalized.forEach((q) => {
              const qid = q._id;
              if (qid && lvl && lvl[qid] !== undefined) relevant[qid] = lvl[qid];
            });
            return relevant;
          }

          // 2) fallback - support older flat shape (top-level keys)
          const relevantFallback = {};
          normalized.forEach((q) => {
            const qid = q._id;
            if (qid && parsed && parsed[qid] !== undefined) relevantFallback[qid] = parsed[qid];
          });
          if (Object.keys(relevantFallback).length > 0) return relevantFallback;
        }
      }
    } catch (e) {
      // ignore
    }
    return {};
  });

  // Persist answers into localStorage exam_answers_{testId} under levels[levelKey]
  useEffect(() => {
    if (!testId) return;
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const levels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};
      levels[levelKey] = { ...(levels[levelKey] || {}), ...(answers || {}) };
      const merged = { ...(parsed || {}), levels };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
    } catch (e) {
      // ignore
    }
  }, [answers, testId, levelKey]);

  // handleSelect accepts opt.id or title but stores title
  const handleSelect = (qid, optIdOrTitle) => {
    if (disabled) return;

    const q = normalized.find((x) => x._id === qid);
    if (!q) return;

    let title = null;
    const maybeOptByTitle = q.options?.find((o) => o.title === optIdOrTitle);
    if (maybeOptByTitle) title = maybeOptByTitle.title;
    else {
      const maybe = q.options?.find((o) => String(o.id) === String(optIdOrTitle));
      if (maybe) title = maybe.title;
    }
    if (!title) return;

    setAnswers((prev) => ({ ...(prev || {}), [qid]: title }));
  };

  // Save progress (button) - persisted under levels[levelKey]
  const handleSaveProgress = () => {
    if (!testId) return alert("No testId provided to save progress.");
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const levels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};
      levels[levelKey] = { ...(levels[levelKey] || {}), ...(answers || {}) };
      const merged = { ...(parsed || {}), levels };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      alert("Progress saved locally.");
    } catch {
      alert("Failed saving progress.");
    }
  };

  // Submit: persist and call parent with { [levelKey]: { qid: title } }
  const handleSubmit = () => {
    const out = {};
    normalized.forEach((q) => {
      if (answers[q._id] !== undefined) out[q._id] = answers[q._id];
    });

    if (testId) {
      try {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        const parsed = raw ? JSON.parse(raw) : {};
        const levels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};
        levels[levelKey] = { ...(levels[levelKey] || {}), ...out };
        const merged = { ...(parsed || {}), levels };
        localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      } catch (e) {
        console.warn("Failed to persist submission:", e);
      }
    }

    onSubmitLevel({ [levelKey]: out });
  };

  return (
    <div className="space-y-8">
      {/* Reading passage */}
      {readingParagraph ? (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-[#004080] mb-4">Reading Passage</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{readingParagraph}</p>
        </div>
      ) : null}

      {/* Questions list */}
      <div className="space-y-4">
        {normalized.length === 0 ? (
          <div className="p-6 text-gray-500">No questions available for this level.</div>
        ) : (
          normalized.map((q, idx) => (
            <div key={q._id} className="border border-gray-200 rounded-lg p-5 hover:shadow transition bg-white">
              <h3 className="font-semibold text-gray-800 mb-3">{idx + 1}. {q.text}</h3>

              <div className="space-y-2">
                {q.options && q.options.length > 0 ? (
                  q.options.map((opt, oi) => {
                    const selected = answers[q._id] === opt.title;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelect(q._id, opt.title)}
                        className={`w-full text-left border px-3 py-2 rounded-md transition ${selected ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:bg-gray-100"}`}
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
            <button onClick={handleSaveProgress} className="px-4 py-2 rounded bg-gray-100 text-gray-800 mr-3">
              Save Progress
            </button>
          )}
        </div>

        <div>
          <button onClick={handleSubmit} disabled={disabled} className={`px-4 py-2 rounded ${disabled ? "bg-gray-300 text-gray-600" : "bg-green-600 text-white"}`}>
            Submit Level
          </button>
        </div>
      </div>
    </div>
  );
}
