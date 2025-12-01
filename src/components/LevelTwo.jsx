// components/LabelTwo.jsx
"use client";
import React, { useEffect, useMemo, useState } from "react";

/**
 * LabelTwo (Level 2) - multiple-choice reading questions (dynamic paragraph)
 */
export default function LabelTwo({
  questions = [],
  initialAnswers = {},
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
  levelKey = "level2",
}) {
  // ---------- NORMALIZATION ----------
  const normalized = useMemo(() => {
    if (!Array.isArray(questions)) return [];

    const looksLikeModule =
      questions.length > 0 &&
      !!questions[0].paragraph &&
      Array.isArray(questions[0].questions);

    if (looksLikeModule) {
      const out = [];
      questions.forEach((p, pIdx) => {
        const para = p.paragraph ?? "";
        (p.questions || []).forEach((q, qIdx) => {
          const id = q._id ?? q.id ?? `lvl2_p${pIdx}_q${qIdx}`;
          const text = q.question ?? q.text ?? para ?? `Question ${id}`;
          const opts = Array.isArray(q.options) && q.options.length
            ? q.options.map((o, i) =>
                typeof o === "string"
                  ? { id: `${id}_opt_${i}`, title: o }
                  : {
                      id: o.id ?? o._id ?? `${id}_opt_${i}`,
                      title: o.title ?? String(o),
                    }
              )
            : [];
          out.push({
            _id: id,
            text,
            options: opts,
            parentParagraph: para,
            raw: q,
          });
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
          const opts = Array.isArray(q.options) && q.options.length
            ? q.options.map((o, i) =>
                typeof o === "string"
                  ? { id: `${id}_opt_${i}`, title: o }
                  : {
                      id: o.id ?? o._id ?? `${id}_opt_${i}`,
                      title: o.title ?? String(o),
                    }
              )
            : [];
          flat.push({
            _id: id,
            text,
            options: opts,
            parentParagraph: para,
            raw: q,
          });
        });
        return;
      }

      if (
        item &&
        (item._id || item.id || item.text || item.question || item.paragraph)
      ) {
        const id = item._id ?? item.id ?? `lvl2_q_${idx}`;
        const text =
          item.text ??
          item.question ??
          item.paragraph ??
          item.prompt ??
          `Question ${idx + 1}`;
        const opts = Array.isArray(item.options) && item.options.length
          ? item.options.map((o, i) =>
              typeof o === "string"
                ? { id: `${id}_opt_${i}`, title: o }
                : {
                    id: o.id ?? o._id ?? `${id}_opt_${i}`,
                    title: o.title ?? String(o),
                  }
            )
          : [];
        const parentPara =
          item.parentParagraph ??
          item.paragraph ??
          item.raw?.parentParagraph ??
          item.raw?.paragraph ??
          null;
        flat.push({
          _id: id,
          text,
          options: opts,
          parentParagraph: parentPara,
          raw: item,
        });
        return;
      }

      const id = `lvl2_q_fallback_${idx}`;
      const text =
        typeof item === "string"
          ? item
          : JSON.stringify(item).slice(0, 200);
      flat.push({
        _id: id,
        text,
        options: [],
        parentParagraph: null,
        raw: item,
      });
    });

    return flat;
  }, [questions]);

  // ---------- READING PARAGRAPH ----------
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

    if (questions[0]?.paragraph && typeof questions[0].paragraph === "string")
      return questions[0].paragraph;

    const firstRaw = questions[0];
    if (firstRaw) {
      if (firstRaw.content?.paragraph) return firstRaw.content.paragraph;
      if (
        firstRaw.content?.paragraphs &&
        Array.isArray(firstRaw.content.paragraphs) &&
        firstRaw.content.paragraphs[0]?.paragraph
      ) {
        return firstRaw.content.paragraphs[0].paragraph;
      }
    }

    return null;
  }, [questions, normalized]);

  // ---------- ANSWERS STATE ----------
  const [answers, setAnswers] = useState(() => {
    try {
      if (initialAnswers && Object.keys(initialAnswers).length)
        return { ...initialAnswers };

      if (testId && typeof window !== "undefined") {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        if (raw) {
          const parsed = JSON.parse(raw);

          if (parsed && parsed.levels && parsed.levels[levelKey]) {
            const lvl = parsed.levels[levelKey];
            const relevant = {};
            normalized.forEach((q) => {
              const qid = q._id;
              if (qid && lvl && lvl[qid] !== undefined) {
                relevant[qid] = lvl[qid];
              }
            });
            return relevant;
          }

          const relevantFallback = {};
          normalized.forEach((q) => {
            const qid = q._id;
            if (qid && parsed && parsed[qid] !== undefined) {
              relevantFallback[qid] = parsed[qid];
            }
          });
          if (Object.keys(relevantFallback).length > 0)
            return relevantFallback;
        }
      }
    } catch (e) {}
    return {};
  });

  // ---------- PERSIST TO LOCALSTORAGE ----------
  useEffect(() => {
    if (!testId) return;
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const levels =
        parsed && parsed.levels && typeof parsed.levels === "object"
          ? { ...parsed.levels }
          : {};
      levels[levelKey] = { ...(levels[levelKey] || {}), ...(answers || {}) };
      const merged = { ...(parsed || {}), levels };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
    } catch (e) {}
  }, [answers, testId, levelKey]);

  // ---------- HANDLERS ----------
  const handleSelect = (qid, optIdOrTitle) => {
    if (disabled) return;
    const q = normalized.find((x) => x._id === qid);
    if (!q) return;

    let title = null;
    const maybeOptByTitle = q.options?.find((o) => o.title === optIdOrTitle);
    if (maybeOptByTitle) title = maybeOptByTitle.title;
    else {
      const maybe = q.options?.find(
        (o) => String(o.id) === String(optIdOrTitle)
      );
      if (maybe) title = maybe.title;
    }
    if (!title) return;

    setAnswers((prev) => ({ ...(prev || {}), [qid]: title }));
  };

  const handleSaveProgress = () => {
    if (!testId) return alert("Keine testId zum Speichern des Fortschritts angegeben.");
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const levels =
        parsed && parsed.levels && typeof parsed.levels === "object"
          ? { ...parsed.levels }
          : {};
      levels[levelKey] = { ...(levels[levelKey] || {}), ...(answers || {}) };
      const merged = { ...(parsed || {}), levels };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      alert("Fortschritt lokal gespeichert.");
    } catch {
      alert("Fehler beim Speichern des Fortschritts.");
    }
  };

  const handleSubmit = () => {
    const out = {};
    normalized.forEach((q) => {
      if (answers[q._id] !== undefined) out[q._id] = answers[q._id];
    });

    if (testId) {
      try {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        const parsed = raw ? JSON.parse(raw) : {};
        const levels =
          parsed && parsed.levels && typeof parsed.levels === "object"
            ? { ...parsed.levels }
            : {};
        levels[levelKey] = { ...(levels[levelKey] || {}), ...out };
        const merged = { ...(parsed || {}), levels };
        localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      } catch (e) {
        console.warn("Failed to persist submission:", e);
      }
    }

    onSubmitLevel({ [levelKey]: out });
  };

  // ---------- UI ----------
  return (
    <div className="w-full">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Lesen 2 – Multiple-Choice-Fragen
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
              Lesen Sie den Abschnitt sorgfältig durch und wählen Sie die beste Antwort für jede
              Frage aus. Ihre Auswahlen werden lokal für diesen Test gespeichert.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3 md:justify-end">
            {!disabled && (
              <button
                onClick={handleSaveProgress}
                className="px-4 py-1.5 rounded-full text-xs md:text-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Fortschritt speichern
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={disabled}
              className={`px-5 py-1.5 rounded-full text-xs md:text-sm font-medium ${
                disabled
                  ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              Level abschicken
            </button>
          </div>
        </div>

        {/* Reading passage */}
        {readingParagraph && (
          <div className="mb-6 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5">
                Lesepassage
              </span>
            </div>
            <div className="px-4 py-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
              {readingParagraph}
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {normalized.length === 0 ? (
            <div className="p-6 text-slate-500 text-sm bg-white rounded-lg border border-dashed border-slate-200 text-center">
              Keine Fragen für dieses Level verfügbar.
            </div>
          ) : (
            normalized.map((q, idx) => (
              <div
                key={q._id}
                className="border border-slate-200 rounded-lg p-4 md:p-5 bg-white hover:border-slate-300 hover:shadow-sm transition"
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className="mt-0.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">
                    Q{idx + 1}
                  </span>
                  <h3 className="font-medium text-slate-900 text-sm md:text-base">
                    {q.text}
                  </h3>
                </div>

                <div className="space-y-2 mt-2">
                  {q.options && q.options.length > 0 ? (
                    q.options.map((opt, oi) => {
                      const selected = answers[q._id] === opt.title;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelect(q._id, opt.title)}
                          disabled={disabled}
                          className={`w-full text-left border px-3 py-2 rounded-md transition ${
                            selected
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                          } ${
                            disabled ? "cursor-not-allowed opacity-80" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${
                                selected
                                  ? "bg-blue-500 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {String.fromCharCode(65 + oi)}
                            </div>
                            <div className="text-xs md:text-sm text-slate-800">
                              {opt.title}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-500">
                      Keine Optionen für diese Frage verfügbar.
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
