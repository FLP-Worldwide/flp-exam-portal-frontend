"use client";
import React, { useEffect, useMemo, useState } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

/**
 * LevelOne - accepts questions from parent and supports DnD + click assignment
 *
 * Props:
 * - questions: array of question objects (from parent normalized `questionsByTab.lesen1`)
 * - initialAnswers: { questionId: optionId, ... }
 * - disabled: boolean
 * - onSubmitLevel: function(answersForLevel) => void
 * - testId: optional string to persist draft answers to localStorage under exam_answers_{testId}
 *
 * Expected question shape (flexible):
 * { _id: "...", text: "...", options: [{ id, title }, ...] }
 * If a question doesn't provide options, LevelOne will try to use a common pool from props.questions (union).
 */

function DraggableItem({ option, disabled, onClick }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: option.id,
    disabled,
  });

  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!disabled ? listeners : {})}
      {...attributes}
      onClick={() => !disabled && onClick(option.id)}
      className={`p-2 border rounded shadow select-none transition-colors
        ${disabled ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-white cursor-pointer hover:bg-blue-50"}`}
    >
      <div className="flex gap-3 items-start">
        {/* <div className="font-mono font-semibold">{option.id}</div> */}
        <div className="text-sm">{option.title}</div>
      </div>
    </div>
  );
}

function DroppableBox({ id, children, active, onClick }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      onClick={() => onClick(id)}
      className={`p-4 min-h-[110px] border rounded cursor-pointer transition-all
        ${isOver ? "bg-blue-50" : "bg-white"}
        ${active ? "border-4 border-blue-500 bg-blue-50" : ""}`}
    >
      {children}
    </div>
  );
}

export default function LevelOne({
  questions = [], // from parent
  initialAnswers = {},
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
}) {
  // Normalize incoming questions: ensure _id and text and options[]
  const normalizedQuestions = useMemo(() => {
    return (questions || []).map((q, idx) => {
      const id = q._id ?? q.id ?? `q_${idx}`;
      const text = q.text ?? q.paragraph ?? q.question ?? q.prompt ?? `Question ${idx + 1}`;
      // if q.options present as array of strings -> convert to {id,title}
      const opts =
        Array.isArray(q.options) && q.options.length
          ? q.options.map((o, i) => (typeof o === "string" ? { id: `${id}_opt_${i}`, title: o } : { id: o.id ?? o._id ?? `opt_${i}`, title: o.title ?? o.label ?? String(o) }))
          : null;
      return { _id: id, text, options: opts, raw: q };
    });
  }, [questions]);

  // Build master option pool (union of per-question options if available)
  const masterOptions = useMemo(() => {
    const map = new Map();
    normalizedQuestions.forEach((q) => {
      (q.options || []).forEach((o) => {
        if (!map.has(o.id)) map.set(o.id, o);
      });
    });
    // If no per-question options, attempt to build a pool from question.raw.pool or the question.answer list
    if (map.size === 0) {
      // look for top-level pool in first question raw (flexible)
      const pool = (questions && questions[0] && questions[0].pool) || (questions && questions[0] && questions[0].content && questions[0].content.options) || null;
      if (Array.isArray(pool)) {
        pool.forEach((p, i) => {
          if (typeof p === "string") map.set(`pool_${i}`, { id: `pool_${i}`, title: p });
          else map.set(p.id ?? p._id ?? `pool_${i}`, { id: p.id ?? p._id ?? `pool_${i}`, title: p.title ?? p.label ?? String(p) });
        });
      }
    }
    return Array.from(map.values());
  }, [normalizedQuestions, questions]);

  // initial answers: prefer explicit initialAnswers prop, else load from localStorage (for testId)
  const [answers, setAnswers] = useState(() => {
    try {
      // prefer initialAnswers prop (parent-provided)
      if (initialAnswers && Object.keys(initialAnswers).length > 0) return { ...initialAnswers };
      if (testId && typeof window !== "undefined") {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          // take only relevant question ids
          const relevant = {};
          normalizedQuestions.forEach((q) => {
            if (parsed[q._id] !== undefined) relevant[q._id] = parsed[q._id];
          });
          return relevant;
        }
      }
    } catch (e) {
      // ignore
    }
    return {};
  });

  const [activeQ, setActiveQ] = useState(null);

  // persist answers locally for the whole test when they change (merge with existing)
  useEffect(() => {
    if (!testId) return;
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const merged = { ...parsed, ...answers };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
    } catch (e) {
      // ignore storage errors
    }
  }, [answers, testId]);

  // Helper: which option ids are already used
  const usedOptionIds = useMemo(() => new Set(Object.values(answers || {})), [answers]);

  // DnD handler: active.id is optionId, over.id is questionId
  const handleDragEnd = (event) => {
    if (disabled) return;
    const { active, over } = event;
    if (!active || !over) return;
    const optId = active.id;
    const targetQuestionId = over.id;
    // assign option to that questionId, removing from other questions first
    setAnswers((prev) => {
      const next = { ...prev };
      // remove optId from other questions
      Object.keys(next).forEach((qid) => {
        if (next[qid] === optId) delete next[qid];
      });
      next[targetQuestionId] = optId;
      return next;
    });
  };

  // Click an option -> assign to activeQ
  const handleOptionClick = (optId) => {
    if (disabled) return;
    if (!activeQ) return;
    setAnswers((prev) => {
      const next = { ...prev };
      // remove optId wherever it is
      Object.keys(next).forEach((qid) => {
        if (next[qid] === optId) delete next[qid];
      });
      next[activeQ] = optId;
      return next;
    });
  };

  // Click question to make active
  const handleQuestionClick = (qid) => {
    if (disabled) return;
    setActiveQ(qid);
  };

  // Clear a question's answer
  const clearAnswerForQuestion = (qid) => {
    if (disabled) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qid];
      return next;
    });
  };

  // Submit this level
  const handleSubmit = () => {
    // Collate only relevant answers (for questions present)
    const answersForLevel = {};
    normalizedQuestions.forEach((q) => {
      if (answers[q._id] !== undefined) answersForLevel[q._id] = answers[q._id];
    });
    onSubmitLevel(answersForLevel);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 gap-6 p-6 bg-gray-100 min-h-[60vh]">
        {/* LEFT: Questions */}
        <div className="space-y-6">
          {normalizedQuestions.length === 0 ? (
            <div className="p-6 text-gray-500">No questions for this level.</div>
          ) : (
            normalizedQuestions.map((q) => (
              <DroppableBox key={q._id} id={q._id} active={activeQ === q._id} onClick={handleQuestionClick}>
                <h3 className="font-bold mb-2">{q.text}</h3>

                {answers[q._id] ? (
                  <div className="p-2 border rounded bg-green-100 flex items-center justify-between">
                    <div>
                      {/* <strong>{answers[q._id]}</strong> */}
                      <div className="text-sm">
                        { ( (q.options || masterOptions).find((o) => String(o.id) === String(answers[q._id])) || {} ).title ?? "" }
                      </div>
                    </div>

                    {!disabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAnswerForQuestion(q._id);
                        }}
                        className="ml-4 px-2 py-1 bg-red-100 text-red-700 rounded"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">{activeQ === q._id ? "Click an answer or drag here" : "Drop / Click answer here"}</p>
                )}
              </DroppableBox>
            ))
          )}
        </div>

        {/* RIGHT: Options Pool */}
        <div>
          <h3 className="font-bold mb-2">Answer Pool</h3>

          <div className="space-y-2">
            {(masterOptions.length === 0) && <div className="text-sm text-gray-500">No option pool provided by API.</div>}
            {masterOptions.map((o) => {
              const used = usedOptionIds.has(o.id);
              const disabledItem = disabled || used;
              return <DraggableItem key={o.id} option={o} disabled={disabledItem} onClick={handleOptionClick} />;
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4">
        <div>
          {!disabled && (
            <button
              onClick={() => {
                if (!testId) {
                  alert("No testId provided for local save.");
                  return;
                }
                try {
                  const raw = localStorage.getItem(`exam_answers_${testId}`);
                  const parsed = raw ? JSON.parse(raw) : {};
                  const merged = { ...parsed, ...answers };
                  localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
                  alert("Progress saved locally.");
                } catch (e) {
                  alert("Failed to save progress.");
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
    </DndContext>
  );
}
