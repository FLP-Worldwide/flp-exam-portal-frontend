// components/LevelOne.jsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { DndContext } from "@dnd-kit/core";

export default function LevelOne({
  questions = [],
  initialAnswers = {},
  moduleOptions = [],
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
  levelKey = "level1",
}) {
  // Normalize incoming questions
  const normalizedQuestions = useMemo(() => {
    return (questions || []).map((q, idx) => {
      const id = q._id ?? q.id ?? `q_${idx}`;
      const text =
        q.paragraph ??
        q.text ??
        q.prompt ??
        q.question ??
        `Passage ${idx + 1}`;
      const opts =
        Array.isArray(q.options) && q.options.length
          ? q.options.map((o, i) =>
              typeof o === "string"
                ? { id: `${id}_opt_${i}`, title: o }
                : {
                    id: o.id ?? o._id ?? `${id}_opt_${i}`,
                    title: o.title ?? o.label ?? String(o),
                  }
            )
          : null;
      return { _id: id, text, options: opts, raw: q };
    });
  }, [questions]);

  // Build master option pool
  const masterOptions = useMemo(() => {
    const map = new Map();

    if (Array.isArray(moduleOptions) && moduleOptions.length > 0) {
      moduleOptions.forEach((m, i) => {
        const title = String(m).trim();
        if (!map.has(title) && title) {
          map.set(title, { id: `pool_${i}`, title });
        }
      });
      return Array.from(map.values());
    }

    normalizedQuestions.forEach((q) => {
      (q.options || []).forEach((o) => {
        const key = String(o.title ?? o.id ?? o).trim();
        if (!map.has(key) && key) {
          map.set(key, { id: o.id ?? `opt_${map.size}`, title: key });
        }
      });
    });

    return Array.from(map.values());
  }, [normalizedQuestions, moduleOptions]);

  // Answers state
  const [answers, setAnswers] = useState(() => {
    try {
      if (initialAnswers && Object.keys(initialAnswers).length > 0) {
        return { ...initialAnswers };
      }
      if (testId && typeof window !== "undefined") {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        if (raw) {
          const parsed = JSON.parse(raw);

          if (parsed && parsed.levels && parsed.levels[levelKey]) {
            const lvl = parsed.levels[levelKey];
            const relevant = {};
            (questions || []).forEach((q) => {
              const qid = q._id ?? q.id;
              if (qid && lvl && lvl[qid] !== undefined) {
                relevant[qid] = lvl[qid];
              }
            });
            return relevant;
          }

          const relevantFallback = {};
          (questions || []).forEach((q) => {
            const qid = q._id ?? q.id;
            if (qid && parsed && parsed[qid] !== undefined) {
              relevantFallback[qid] = parsed[qid];
            }
          });
          if (Object.keys(relevantFallback).length > 0) return relevantFallback;
        }
      }
    } catch (e) {}
    return {};
  });

  const [activeQ, setActiveQ] = useState(null);
  const [showSelectHint, setShowSelectHint] = useState(false);

  // optionId -> title
  const optionIdToTitle = useMemo(() => {
    const m = new Map();
    masterOptions.forEach((o) => m.set(String(o.id), o.title));
    return m;
  }, [masterOptions]);

  const usedTitles = useMemo(
    () => new Set(Object.values(answers || {}).filter(Boolean)),
    [answers]
  );

  // Persist to localStorage
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

  // DnD drag end
  const handleDragEnd = (event) => {
    if (disabled) return;
    const { active, over } = event;
    if (!active || !over) return;
    const optId = active.id;
    const targetQuestionId = over.id;
    const title = optionIdToTitle.get(String(optId));
    if (!title) return;

    setAnswers((prev) => {
      const next = { ...(prev || {}) };
      Object.keys(next).forEach((qid) => {
        if (next[qid] === title) delete next[qid];
      });
      next[targetQuestionId] = title;
      return next;
    });
  };

  // Click option from pool => must have a selected passage
  const handleOptionClick = (optId) => {
    if (disabled) return;
    const title = optionIdToTitle.get(String(optId));
    if (!title) return;

    if (!activeQ) {
      // user must choose paragraph first
      setShowSelectHint(true);
      return;
    }

    setAnswers((prev) => {
      const next = { ...(prev || {}) };
      Object.keys(next).forEach((qid) => {
        if (next[qid] === title) delete next[qid];
      });
      next[activeQ] = title;
      return next;
    });
  };

  const handleQuestionClick = (qid) => {
    if (disabled) return;
    setActiveQ((prev) => (prev === qid ? null : qid));
    setShowSelectHint(false);
  };

  const clearAnswer = (qid) => {
    if (disabled) return;
    setAnswers((prev) => {
      const next = { ...(prev || {}) };
      delete next[qid];
      return next;
    });
  };

  const handleSaveProgress = () => {
    if (!testId) {
      alert("No testId provided for saving.");
      return;
    }
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
      alert("Progress saved locally.");
    } catch (e) {
      console.warn(e);
      alert("Failed to save progress.");
    }
  };

  const handleSubmitLevel = () => {
    const payload = {};
    normalizedQuestions.forEach((q) => {
      if (answers[q._id] !== undefined && answers[q._id] !== null) {
        payload[q._id] = answers[q._id];
      }
    });

    if (testId) {
      try {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        const parsed = raw ? JSON.parse(raw) : {};
        const levels =
          parsed && parsed.levels && typeof parsed.levels === "object"
            ? { ...parsed.levels }
            : {};
        levels[levelKey] = { ...(levels[levelKey] || {}), ...payload };
        const merged = { ...(parsed || {}), levels };
        localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      } catch (e) {
        console.warn("Failed to persist submission:", e);
      }
    }

    onSubmitLevel({ [levelKey]: payload });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full">
  {/* container card-ish */}
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-6">
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

      {/* LEFT: title + description */}
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-900">
          Niveau 1 – Ordnen Sie die Texte den richtigen Antworten zu
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
          Schritt 1: Klicken Sie auf einen Textabschnitt, um ihn auszuwählen.
          Schritt 2: Wählen Sie eine Antwort aus dem Pool aus, um sie zuzuweisen.
          Jede Antwort kann nur einmal verwendet werden.
        </p>
      </div>

      {/* RIGHT: actions */}
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
          onClick={handleSubmitLevel}
          disabled={disabled}
          className={`px-5 py-1.5 rounded-full text-xs md:text-sm font-medium ${
            disabled
              ? "bg-slate-300 text-slate-600 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          Niveau abschließen
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">

      {/* LEFT: Questions */}
      <div className="space-y-4">
        {normalizedQuestions.length === 0 ? (
          <div className="p-6 text-slate-500 text-sm bg-white rounded-lg border border-dashed border-slate-200 text-center">
            Keine Fragen für dieses Niveau verfügbar.
          </div>
        ) : (
          normalizedQuestions.map((q, idx) => {
            const selectedTitle = answers[q._id] ?? null;
            const isActive = activeQ === q._id;

            return (
              <div
                key={q._id}
                id={q._id}
                onClick={() => handleQuestionClick(q._id)}
                className={`rounded-lg border transition shadow-sm cursor-pointer ${
                  isActive
                    ? "border-blue-500 ring-2 ring-blue-200 bg-white"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5">
                      Textabschnitt {idx + 1}
                    </span>
                    {isActive && (
                      <span className="text-[10px] text-blue-600 font-medium uppercase tracking-wide">
                        Ausgewählt
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-3 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed border-t border-slate-100">
                  {q.text}
                </div>

                <div className="px-4 pb-4 border-t border-slate-100">
                  {selectedTitle ? (
                    <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200">
                      <div className="text-xs md:text-sm text-emerald-800">
                        {selectedTitle}
                      </div>
                      {!disabled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearAnswer(q._id);
                          }}
                          className="ml-3 px-2 py-1 text-xs bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100"
                        >
                          Entfernen
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-slate-400">
                      {isActive
                        ? "Wählen Sie jetzt eine Antwort aus dem rechten Pool."
                        : "Klicken Sie hier, um den Text auszuwählen, und wählen Sie dann eine Antwort."}
                    </div>
                  )}

                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {q.options.map((opt) => {
                        const isSelected = answers[q._id] === opt.title;
                        const disabledOpt =
                          disabled ||
                          (usedTitles.has(opt.title) && !isSelected);
                        return (
                          <button
                            key={opt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (disabledOpt) return;
                              handleOptionClick(opt.id);
                            }}
                            className={`px-2.5 py-1 rounded-full text-xs border ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 font-semibold text-blue-700"
                                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                            } ${disabledOpt ? "opacity-60" : ""}`}
                            disabled={disabledOpt}
                          >
                            {opt.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RIGHT: Options Pool */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-slate-900 text-sm md:text-base">
            Antwortpool
          </h3>
          {masterOptions.length > 0 && (
            <span className="text-[11px] text-slate-500">
              {masterOptions.length} Optionen
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 mb-2">
          Klicken Sie zuerst einen Textabschnitt links an und wählen Sie dann eine Antwort.
        </p>

        {showSelectHint && !disabled && (
          <div className="mb-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
            Bitte <strong>wählen Sie zuerst einen Textabschnitt</strong> aus.
          </div>
        )}

        <div className="flex-1 space-y-2 mt-1">
          {masterOptions.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 bg-white rounded-lg border border-dashed border-slate-200 text-center">
              Keine Antwortoptionen vom System bereitgestellt.
            </div>
          ) : (
            masterOptions.map((opt) => {
              const used = usedTitles.has(opt.title);
              const disabledItem = disabled || used;
              return (
                <div
                  key={opt.id}
                  draggable={!disabledItem}
                  onDragStart={(e) => {
                    try {
                      e.dataTransfer.setData("text/plain", String(opt.id));
                    } catch (err) {}
                  }}
                  onClick={() => {
                    if (disabledItem) return;
                    handleOptionClick(opt.id);
                  }}
                  className={`p-3 rounded-md border text-sm flex justify-between items-center cursor-pointer select-none transition ${
                    disabledItem
                      ? "bg-slate-50 text-slate-400 border-slate-200"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-blue-50 hover:border-blue-300"
                  }`}
                >
                  <span>{opt.title}</span>
                  {used && (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      verwendet
                    </span>
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

    </DndContext>
  );
}
