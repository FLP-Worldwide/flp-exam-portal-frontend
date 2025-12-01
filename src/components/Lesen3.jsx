"use client";
import React, { useMemo, useState, useEffect } from "react";

/**
 * Lesen3 — persist answers keyed by real questionId from API
 *
 * Stores: { [questionId]: selectedTitle } into localStorage `exam_answers_{testId}`
 * Uses grouped shape: { levels: { level3: { qid: "Answer" } } }
 */
export default function Lesen3({
  questions = [],
  initialAnswers = {},
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
  levelKey = "level3",
}) {
  // LEFT: texts A, B, C...
  const leftTexts = useMemo(() => {
    if (!Array.isArray(questions) || questions.length === 0) return [];
    return questions.map((p, i) => ({
      id: String.fromCharCode(65 + i), // 'A','B',...
      title: p.title ?? `Text ${String.fromCharCode(65 + i)}`,
      content: p.paragraph ?? "",
    }));
  }, [questions]);

  // pool of letters (shuffled)
  const rightOptions = useMemo(() => {
    const opts = (questions || []).map((_, i) => String.fromCharCode(65 + i));
    return [...opts].sort(() => Math.random() - 0.5);
  }, [questions]);

  // questions for RIGHT side
  const renderedItems = useMemo(() => {
    const list = Array.isArray(questions) ? questions : [];
    const shuffled = [...list].sort(() => Math.random() - 0.5);

    return shuffled.map((p, i) => {
      const qid = p.questionId ?? p._id ?? p.id ?? `q_${i + 1}`;

      const prompt =
        typeof p.answer === "string" && p.answer.trim().length > 0
          ? p.answer
          : p.question ??
            p.prompt ??
            p.situation ??
            `Question ${i + 1}`;

      return { index: i, qid, prompt, raw: p };
    });
  }, [questions]);

  const renderedQuestionIds = useMemo(
    () => renderedItems.map((it) => it.qid),
    [renderedItems]
  );

  // initial answers
  const getInitialState = () => {
    try {
      const start = { ...(initialAnswers || {}) };

      if (testId && typeof window !== "undefined") {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        if (raw) {
          const parsed = JSON.parse(raw);

          // grouped
          if (parsed && parsed.levels && parsed.levels[levelKey]) {
            const lvl = parsed.levels[levelKey];
            renderedQuestionIds.forEach((qid) => {
              if (
                start[qid] === undefined &&
                lvl &&
                lvl[qid] !== undefined
              ) {
                start[qid] = lvl[qid];
              }
            });
          } else {
            // fallback flat
            renderedQuestionIds.forEach((qid) => {
              if (
                start[qid] === undefined &&
                parsed &&
                parsed[qid] !== undefined
              ) {
                start[qid] = parsed[qid];
              }
            });
          }
        }
      }
      return start;
    } catch (e) {
      return { ...(initialAnswers || {}) };
    }
  };

  const [answers, setAnswers] = useState(() => getInitialState());

  // persist grouped
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

  // helpers
  const letterToTitle = (letter) =>
    leftTexts.find((t) => t.id === letter)?.title ?? letter;

  // simple select (no uniqueness across questions)
  const handleSelect = (qid, letter) => {
    if (disabled) return;
    const storeTitle = true;
    const valueToStore = storeTitle ? letterToTitle(letter) : letter;

    setAnswers((prev) => {
      const next = { ...(prev || {}) };
      next[qid] = valueToStore;
      return next;
    });
  };

  // optional unique version (kept for future use)
  const handleSelectUnique = (qid, letter) => {
    if (disabled) return;
    const storeTitle = true;
    const valueToStore = storeTitle ? letterToTitle(letter) : letter;

    setAnswers((prev) => {
      const next = { ...(prev || {}) };
      Object.keys(next).forEach((k) => {
        if (next[k] === valueToStore) delete next[k];
      });
      next[qid] = valueToStore;
      return next;
    });
  };

  const handleSubmit = () => {
    const payload = {};
    renderedQuestionIds.forEach((qid) => {
      if (answers[qid] !== undefined) payload[qid] = answers[qid];
    });

    try {
      if (testId) {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        const parsed = raw ? JSON.parse(raw) : {};
        const levels =
          parsed && parsed.levels && typeof parsed.levels === "object"
            ? { ...parsed.levels }
            : {};
        levels[levelKey] = { ...(levels[levelKey] || {}), ...payload };
        const merged = { ...(parsed || {}), levels };
        localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      }
    } catch (e) {}

    onSubmitLevel({ [levelKey]: payload });
  };

  // ---------- UI ----------
  return (
    <div className="w-full">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Lesen 3 – Texte Situationen zuordnen
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
              Lesen Sie die Texte auf der linken Seite (A, B, C, …) und die Situationen auf der
              rechten Seite. Wählen Sie für jede Situation den Text aus, der am besten passt.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3 md:justify-end">
            {/* no manual save button here — answers auto-save, but you could add one if you want */}
            
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          {/* LEFT: Texts A, B, C... */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-1">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5">
                  Lesetexte
                </span>
              </div>
              <div className="px-4 py-3 text-xs md:text-sm text-slate-700 leading-relaxed">
                Lesen Sie jeden Text sorgfältig durch. Sie werden später entscheiden, welcher Text
                zu jeder Situation auf der rechten Seite passt.
              </div>
            </div>

            {leftTexts.length === 0 ? (
              <div className="p-6 text-slate-500 text-sm bg-white rounded-lg border border-dashed border-slate-200 text-center">
                Keine Texte für dieses Level verfügbar.
              </div>
            ) : (
              leftTexts.map((t) => (
                <div
                  key={t.id}
                  className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm hover:border-slate-300 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-0.5">
                      {t.id}
                    </span>
                    <span className="text-xs md:text-sm text-slate-500 truncate max-w-[60%]">
                      {t.title}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {t.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* RIGHT: Situations and letter choices */}
          <div className="flex flex-col h-full">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
              <h3 className="font-semibold text-[#004080] text-sm md:text-base">
                Situationen (1–{renderedItems.length})
              </h3>
              <p className="text-xs md:text-sm text-slate-600 mt-1">
                Wählen Sie für jede der untenstehenden Situationen den Buchstaben des Textes (A, B,
                C, …) aus, der am besten passt.
              </p>
            </div>

            <div className="space-y-3 flex-1">
              {renderedItems.length === 0 ? (
                <div className="p-6 text-slate-500 text-sm bg-white rounded-lg border border-dashed border-slate-200 text-center">
                  Keine Situationen für dieses Level verfügbar.
                </div>
              ) : (
                renderedItems.map((item, idx) => {
                  const qid = item.qid;
                  const storedValue = answers[qid] ?? null;

                  return (
                    <div
                      key={qid}
                      className="border border-slate-200 rounded-lg p-3 md:p-4 bg-white shadow-sm hover:border-slate-300 hover:shadow transition"
                    >
                      <p className="text-xs md:text-sm font-medium text-slate-900 mb-2">
                        {idx + 1}. {item.prompt}
                      </p>

                      <div className="flex gap-2 flex-wrap mt-1">
                        {rightOptions.map((letter) => {
                          const storeTitle = true;
                          const expected = storeTitle
                            ? letterToTitle(letter)
                            : letter;
                          const isSelected = storedValue === expected;

                          return (
                            <button
                              key={`${qid}_${letter}`}
                              onClick={() => handleSelect(qid, letter)} // use handleSelectUnique for uniqueness if needed
                              disabled={disabled}
                              className={`px-3 py-1 rounded-full text-xs md:text-sm font-semibold border transition ${
                                isSelected
                                  ? "bg-[#004080] text-white border-[#004080]"
                                  : "border-slate-300 bg-white text-slate-800 hover:bg-blue-50 hover:border-blue-400"
                              } ${
                                disabled
                                  ? "cursor-not-allowed opacity-80"
                                  : ""
                              }`}
                            >
                              {letter}
                            </button>
                          );
                        })}
                      </div>

                      {storedValue && (
                        <div className="mt-2 text-[11px] md:text-xs text-slate-600">
                          Ausgewählter Text:{" "}
                          <span className="font-medium">{storedValue}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
