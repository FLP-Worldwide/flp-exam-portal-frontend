// components/LevelOne.jsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { DndContext } from "@dnd-kit/core";

/**
 * LevelOne (drag-and-drop + click)
 *
 * Props:
 * - questions: array of question objects (from parent normalized `questionsByTab.lesen1`)
 *   expected each question to contain _id, paragraph/text, options (optional)
 * - initialAnswers: { [questionId]: selectedTitle }  // optional
 * - moduleOptions: optional array of option strings (module-level pool)
 * - disabled: boolean
 * - onSubmitLevel: function(answersForLevel) => void
 * - testId: optional string (for localStorage key exam_answers_{testId})
 * - levelKey: string to group answers in localStorage under `levels[levelKey]` (default "level1")
 */
export default function LevelOne({
  questions = [],
  initialAnswers = {},
  moduleOptions = [], // optional pool from parent
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
  levelKey = "level1",
}) {
  // Normalize incoming questions: ensure _id, text, options (id + title)
  const normalizedQuestions = useMemo(() => {
    return (questions || []).map((q, idx) => {
      const id = q._id ?? q.id ?? `q_${idx}`;
      const text = q.paragraph ?? q.text ?? q.prompt ?? q.question ?? `Passage ${idx + 1}`;
      // if q.options present as array of strings -> convert to {id,title}
      const opts =
        Array.isArray(q.options) && q.options.length
          ? q.options.map((o, i) =>
              typeof o === "string"
                ? { id: `${id}_opt_${i}`, title: o }
                : { id: o.id ?? o._id ?? `${id}_opt_${i}`, title: o.title ?? o.label ?? String(o) }
            )
          : null;
      return { _id: id, text, options: opts, raw: q };
    });
  }, [questions]);

  // Build master option pool (prefer moduleOptions, else union of per-question options)
  const masterOptions = useMemo(() => {
    const map = new Map();

    // If moduleOptions (strings) are provided, use them (and create stable ids)
    if (Array.isArray(moduleOptions) && moduleOptions.length > 0) {
      moduleOptions.forEach((m, i) => {
        const title = String(m).trim();
        if (!map.has(title) && title) map.set(title, { id: `pool_${i}`, title });
      });
      return Array.from(map.values());
    }

    // Fallback: union of per-question options
    normalizedQuestions.forEach((q) => {
      (q.options || []).forEach((o) => {
        const key = String(o.title ?? o.id ?? o).trim();
        if (!map.has(key) && key) map.set(key, { id: o.id ?? `opt_${map.size}`, title: key });
      });
    });

    return Array.from(map.values());
  }, [normalizedQuestions, moduleOptions]);

  // Answers state: map questionId -> selectedOptionTitle (human-friendly)
  const [answers, setAnswers] = useState(() => {
    try {
      // prefer explicit initialAnswers prop if provided
      if (initialAnswers && Object.keys(initialAnswers).length > 0) {
        return { ...initialAnswers };
      }
      // else read from localStorage if testId provided
      if (testId && typeof window !== "undefined") {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        if (raw) {
          const parsed = JSON.parse(raw);

          // 1) If new grouped shape exists, pick from parsed.levels[levelKey]
          if (parsed && parsed.levels && parsed.levels[levelKey]) {
            const lvl = parsed.levels[levelKey];
            const relevant = {};
            (questions || []).forEach((q) => {
              const qid = q._id ?? q.id;
              if (qid && lvl && lvl[qid] !== undefined) relevant[qid] = lvl[qid];
            });
            return relevant;
          }

          // 2) Backwards-compatibility: fallback to flat shape where answers are top-level keys
          const relevantFallback = {};
          (questions || []).forEach((q) => {
            const qid = q._id ?? q.id;
            if (qid && parsed && parsed[qid] !== undefined) relevantFallback[qid] = parsed[qid];
          });
          if (Object.keys(relevantFallback).length > 0) return relevantFallback;
        }
      }
    } catch (e) {
      // ignore errors
    }
    return {};
  });

  // active focused question id (for click-to-assign)
  const [activeQ, setActiveQ] = useState(null);

  // Helper: map optionId -> title (masterOptions)
  const optionIdToTitle = useMemo(() => {
    const m = new Map();
    masterOptions.forEach((o) => m.set(String(o.id), o.title));
    return m;
  }, [masterOptions]);

  // Which option titles are currently used (to disable duplicates)
  const usedTitles = useMemo(() => new Set(Object.values(answers || {}).filter(Boolean)), [answers]);

  // Persist answers merged into localStorage exam_answers_{testId} whenever answers changes
  useEffect(() => {
    if (!testId) return;
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      // Ensure levels object exists
      const levels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};
      // Merge this level's answers into stored levels[levelKey]
      levels[levelKey] = { ...(levels[levelKey] || {}), ...(answers || {}) };
      const merged = { ...(parsed || {}), levels };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
    } catch (e) {
      // ignore
    }
  }, [answers, testId, levelKey]);

  // DnD: handle drag end where active.id is optionId and over.id is questionId
  const handleDragEnd = (event) => {
    if (disabled) return;
    const { active, over } = event;
    if (!active || !over) return;
    const optId = active.id; // e.g. pool_0 or q_0_opt_1
    const targetQuestionId = over.id;
    // find title from optId
    const title = optionIdToTitle.get(String(optId));
    if (!title) return;

    // assign title to targetQuestionId ensuring uniqueness (remove title from other questions)
    setAnswers((prev) => {
      const next = { ...(prev || {}) };
      // remove this title from previous owners
      Object.keys(next).forEach((qid) => {
        if (next[qid] === title) delete next[qid];
      });
      next[targetQuestionId] = title;
      return next;
    });
  };

  // Click option (from pool) => if activeQ exists assign to it; else assign to first empty question or first question
  const handleOptionClick = (optId) => {
    if (disabled) return;
    const title = optionIdToTitle.get(String(optId));
    if (!title) return;

    if (activeQ) {
      // assign to focused question
      setAnswers((prev) => {
        const next = { ...(prev || {}) };
        // remove title from any other question
        Object.keys(next).forEach((qid) => {
          if (next[qid] === title) delete next[qid];
        });
        next[activeQ] = title;
        return next;
      });
      return;
    }

    // no focus: assign to first unanswered question
    const firstEmpty = normalizedQuestions.find((q) => !answers[q._id]);
    if (firstEmpty) {
      setAnswers((prev) => {
        const next = { ...(prev || {}) };
        Object.keys(next).forEach((qid) => {
          if (next[qid] === title) delete next[qid];
        });
        next[firstEmpty._id] = title;
        return next;
      });
      return;
    }

    // otherwise assign to the first question
    if (normalizedQuestions[0]) {
      setAnswers((prev) => {
        const next = { ...(prev || {}) };
        Object.keys(next).forEach((qid) => {
          if (next[qid] === title) delete next[qid];
        });
        next[normalizedQuestions[0]._id] = title;
        return next;
      });
    }
  };

  // Click question to focus for assign
  const handleQuestionClick = (qid) => {
    if (disabled) return;
    setActiveQ((prev) => (prev === qid ? null : qid));
  };

  // Clear answer for a question
  const clearAnswer = (qid) => {
    if (disabled) return;
    setAnswers((prev) => {
      const next = { ...(prev || {}) };
      delete next[qid];
      return next;
    });
  };

  // Save progress locally (merge) - updated to persist under levels[levelKey]
  const handleSaveProgress = () => {
    if (!testId) {
      alert("No testId provided for saving.");
      return;
    }
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const levels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};
      levels[levelKey] = { ...(levels[levelKey] || {}), ...(answers || {}) };
      const merged = { ...(parsed || {}), levels };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      alert("Progress saved locally.");
    } catch (e) {
      console.warn(e);
      alert("Failed to save progress.");
    }
  };

  // Submit level: call parent with questionId -> selectedTitle mapping for currently displayed questions
  const handleSubmitLevel = () => {
    const payload = {};
    normalizedQuestions.forEach((q) => {
      if (answers[q._id] !== undefined && answers[q._id] !== null) payload[q._id] = answers[q._id];
    });

    // Persist the payload in localStorage under levels[levelKey] as well (merge safely)
    if (testId) {
      try {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        const parsed = raw ? JSON.parse(raw) : {};
        const levels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};
        levels[levelKey] = { ...(levels[levelKey] || {}), ...payload };
        const merged = { ...(parsed || {}), levels };
        localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      } catch (e) {
        console.warn("Failed to persist submission:", e);
      }
    }

    // call parent with a neat object under levelKey
    onSubmitLevel({ [levelKey]: payload });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 gap-6 p-6 bg-gray-100 min-h-[60vh]">
        {/* LEFT: Questions */}
        <div className="space-y-6">
          {normalizedQuestions.length === 0 ? (
            <div className="p-6 text-gray-500">No questions for this level.</div>
          ) : (
            normalizedQuestions.map((q, idx) => {
              const selectedTitle = answers[q._id] ?? null;
              return (
                <div
                  key={q._id}
                  id={q._id /* droppable id */}
                  onClick={() => handleQuestionClick(q._id)}
                  className={`p-4 border rounded cursor-pointer transition ${activeQ === q._id ? "ring-2 ring-blue-400 bg-white" : "bg-white"}`}
                >
                  <h4 className="font-semibold mb-3">Passage {idx + 1}</h4>
                  <div className="text-gray-800 whitespace-pre-wrap mb-3" style={{ lineHeight: 1.6 }}>
                    {q.text}
                  </div>

                  {selectedTitle ? (
                    <div className="flex items-center justify-between p-2 rounded bg-green-50 border">
                      <div className="text-sm text-green-800">{selectedTitle}</div>
                      {!disabled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearAnswer(q._id);
                          }}
                          className="ml-3 px-2 py-1 bg-red-100 text-red-700 rounded"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400"> {activeQ === q._id ? "Click an option or drag here" : "Drop / Click answer here"}</div>
                  )}

                  {/* optional per-question inline options (if provided) */}
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {q.options.map((opt) => {
                        const isSelected = answers[q._id] === opt.title;
                        const disabledOpt = disabled || (usedTitles.has(opt.title) && !isSelected);
                        return (
                          <button
                            key={opt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (disabledOpt) return;
                              // assign this option title
                              handleOptionClick(opt.id);
                            }}
                            className={`px-3 py-1 rounded text-sm ${isSelected ? "font-semibold" : ""}`}
                            style={{
                              border: "1px solid #e5e7eb",
                              background: isSelected ? "#e6f0ff" : "#fff",
                              opacity: disabledOpt ? 0.6 : 1,
                            }}
                            disabled={disabledOpt}
                          >
                            {opt.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT: Options Pool */}
        <div>
          <h3 className="font-bold mb-2">Answer Pool</h3>
          <div className="text-sm text-gray-600 mb-3">
            {masterOptions.length === 0 ? "No option pool provided by API." : "Click or drag an option to assign it to a passage."}
          </div>

          <div className="space-y-2">
            {masterOptions.map((opt) => {
              const used = usedTitles.has(opt.title);
              const disabledItem = disabled || used;
              // The draggable id must be unique and stable; we use opt.id
              return (
                <div
                  key={opt.id}
                  draggable={!disabledItem}
                  onDragStart={(e) => {
                    // In pure HTML drag (fallback) set id in dataTransfer so DnDContext might not need this, but @dnd-kit handles native drag
                    try {
                      e.dataTransfer.setData("text/plain", String(opt.id));
                    } catch (err) {}
                  }}
                  onClick={() => {
                    if (disabledItem) return;
                    handleOptionClick(opt.id);
                  }}
                  className={`p-3 border rounded cursor-pointer select-none ${disabledItem ? "bg-gray-100 text-gray-500" : "bg-white hover:bg-blue-50"}`}
                >
                  <div className="flex justify-between items-center">
                    <div>{opt.title}</div>
                    {used && <div className="text-xs text-green-700">{/* show small used mark */}✓</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 px-6">
        <div>
          {!disabled && (
            <button
              onClick={handleSaveProgress}
              className="px-4 py-2 rounded bg-gray-100 text-gray-800 mr-3"
            >
              Save Progress
            </button>
          )}
        </div>

        <div>
          <button
            onClick={handleSubmitLevel}
            disabled={disabled}
            className={`px-4 py-2 rounded ${disabled ? "bg-gray-300 text-gray-600" : "bg-green-600 text-white"}`}
          >
            Submit Level
          </button>
        </div>
      </div>
    </DndContext>
  );
}
