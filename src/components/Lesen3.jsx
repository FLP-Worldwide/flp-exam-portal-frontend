// components/Lesen3.jsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { DndContext } from "@dnd-kit/core";

export default function Lesen3({
  questions = [],
  initialAnswers = {},
  moduleOptions = [],
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
  levelKey = "level3",
}) {
  // ---------- Normalise questions ----------
  const normalizedQuestions = useMemo(() => {
    return (questions || []).map((q, idx) => {
      const id = q._id ?? q.id ?? `q_${idx}`;
      const text =
        q.paragraph ??
        q.text ??
        q.prompt ??
        q.question ??
        `Situation ${idx + 1}`;

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

  // ---------- Master option pool ----------
  const masterOptions = useMemo(() => {
    const map = new Map();

    // Prefer moduleOptions if provided
    if (Array.isArray(moduleOptions) && moduleOptions.length > 0) {
      moduleOptions.forEach((m, i) => {
        const title = String(m).trim();
        if (!map.has(title) && title) {
          map.set(title, { id: `pool_${i}`, title });
        }
      });
      return Array.from(map.values());
    }

    // Otherwise collect from question-level options
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

  const validTitles = useMemo(
    () => new Set(masterOptions.map((o) => o.title)),
    [masterOptions]
  );

  // ---------- Answers state ----------
  const [answers, setAnswers] = useState(() => {
    let start = {};

    try {
      // 1) from props (if any)
      if (initialAnswers && Object.keys(initialAnswers).length > 0) {
        start = { ...initialAnswers };
      }

      // 2) from localStorage
      if (testId && typeof window !== "undefined") {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        if (raw) {
          const parsed = JSON.parse(raw);

          if (parsed && parsed.levels && parsed.levels[levelKey]) {
            const lvl = parsed.levels[levelKey];
            Object.keys(lvl || {}).forEach((qid) => {
              start[qid] = lvl[qid];
            });
          } else {
            // flat fallback
            Object.keys(parsed || {}).forEach((qid) => {
              if (qid.startsWith("q_") && parsed[qid] != null) {
                start[qid] = parsed[qid];
              }
            });
          }
        }
      }
    } catch (e) {
      // ignore
    }

    // 3) Filter: only keep values that exist in the current option pool
    Object.keys(start).forEach((qid) => {
      const val = start[qid];
      if (typeof val !== "string" || !validTitles.has(val)) {
        delete start[qid];
      }
    });

    // 4) Enforce uniqueness (first occurrence wins)
    const seen = new Set();
    Object.keys(start).forEach((qid) => {
      const val = start[qid];
      if (seen.has(val)) {
        delete start[qid];
      } else {
        seen.add(val);
      }
    });

    return start;
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
    () => new Set(Object.values(answers || {}).filter((v) => validTitles.has(v))),
    [answers, validTitles]
  );

  // ---------- Persist to localStorage ----------
  useEffect(() => {
    if (!testId || typeof window === "undefined") return;
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

  // ---------- DnD (optional, like Level 1) ----------
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

  // ---------- Option click ----------
  const handleOptionClick = (optId) => {
    if (disabled) return;
    const title = optionIdToTitle.get(String(optId));
    if (!title) return;

    if (!activeQ) {
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

  // ---------- Question click ----------
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
      alert("Keine Test-ID zum Speichern vorhanden.");
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
      alert("Fortschritt lokal gespeichert.");
    } catch (e) {
      console.warn(e);
      alert("Speichern fehlgeschlagen.");
    }
  };

  const handleSubmitLevel = () => {
    const payload = {};
    normalizedQuestions.forEach((q) => {
      if (answers[q._id] !== undefined && answers[q._id] !== null) {
        payload[q._id] = answers[q._id];
      }
    });

    if (testId && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        const parsed = raw ? JSON.parse(raw) : {};
        const levels =
          parsed && parsed.levels && typeof parsed.levels === "object"
            ? { ...parsed.levels }
            : {};
        levels[levelKey] = { ...(levels[levelKey] || {}), ...payload };
        const merged = { ...(parsed || {}), levels };
        localStorage.setItem(
          `exam_answers_${testId}`,
          JSON.stringify(merged)
        );
      } catch (e) {
        console.warn("Failed to persist submission:", e);
      }
    }

    onSubmitLevel({ [levelKey]: payload });
  };

  // ---------- UI ----------
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-6">
          {/* Header */}
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-slate-900">
                Niveau 3 – Ordnen Sie die Situationen den richtigen Antworten zu
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
                Schritt 1: Klicken Sie auf eine Situation links. Schritt 2:
                Wählen Sie eine Antwort aus dem Pool. Jede Antwort kann nur
                einmal verwendet werden.
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
            {/* LEFT: Situationen */}
            <div className="space-y-4">
              {normalizedQuestions.length === 0 ? (
                <div className="p-6 text-slate-500 text-sm bg-white rounded-lg border border-dashed border-slate-200 text-center">
                  Keine Situationen für dieses Niveau verfügbar.
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
                            Situation {idx + 1}
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
                              : "Klicken Sie hier, um die Situation auszuwählen, und wählen Sie dann eine Antwort."}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* RIGHT: Antwortpool mit Radio-Stil */}
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
                Klicken Sie zuerst eine Situation links an und wählen Sie dann
                eine Antwort. Jede Antwort kann nur einmal verwendet werden.
              </p>

              {showSelectHint && !disabled && (
                <div className="mb-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
                  Bitte <strong>wählen Sie zuerst eine Situation</strong> aus.
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
                    const isSelectedForActive =
                      activeQ && answers[activeQ] === opt.title;

                    return (
                      <label
                        key={opt.id}
                        className={`p-3 rounded-md border text-sm flex justify-between items-center cursor-pointer select-none transition ${
                          disabledItem
                            ? "bg-slate-50 text-slate-400 border-slate-200"
                            : "bg-white text-slate-800 border-slate-200 hover:bg-blue-50 hover:border-blue-300"
                        }`}
                        onClick={() => {
                          if (disabledItem) return;
                          handleOptionClick(opt.id);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex h-4 w-4 rounded-full border mr-1 ${
                              isSelectedForActive
                                ? "border-blue-600 bg-blue-600"
                                : "border-slate-400 bg-white"
                            }`}
                          />
                          <span>{opt.title}</span>
                        </div>
                        {used && (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            verwendet
                          </span>
                        )}
                      </label>
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
