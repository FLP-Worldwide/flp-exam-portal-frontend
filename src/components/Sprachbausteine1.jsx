"use client";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Robust Sprachbausteine1 for level_4 blanks
 *
 * Expects incoming prop `questions` to be the array: module.content.paragraphs
 * Example paragraph item:
 * {
 *   paragraph: "It is a long ___ fact ...",
 *   blanks: [
 *     { options: ["established","Many","by"], answer: "established" },
 *     { options: ["layout","on","by"], answer: "layout" },
 *     { options: ["as","by","on"], answer: "as" }
 *   ]
 * }
 *
 * Props:
 * - questions: array (module.content.paragraphs)
 * - initialAnswers: { b1: "b1_opt_0", ... }  // optional
 * - disabled: boolean
 * - onSubmitLevel: function(answersForLevel)
 * - testId: string used for localStorage key (exam_answers_{testId})
 */

function makeOptionId(blankId, idx) {
  return `${blankId}_opt_${idx}`;
}

// helper: extract display string and id from raw option value
function normalizeOptionRaw(rawOpt, blankId, idx) {
  // if primitive string/number, use directly
  if (rawOpt === null || rawOpt === undefined) {
    return { id: makeOptionId(blankId, idx), title: String(rawOpt) };
  }
  if (typeof rawOpt === "string" || typeof rawOpt === "number" || typeof rawOpt === "boolean") {
    return { id: makeOptionId(blankId, idx), title: String(rawOpt) };
  }
  // if object: try common fields
  const title = rawOpt.title ?? rawOpt.text ?? rawOpt.label ?? rawOpt.option ?? rawOpt.value ?? JSON.stringify(rawOpt);
  const id = rawOpt.id ?? rawOpt._id ?? makeOptionId(blankId, idx);
  return { id: String(id), title: String(title) };
}

export default function Sprachbausteine1({
  questions: incoming = [], // expected paragraphs array
  initialAnswers = {},
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
}) {
  // Normalize paragraphs and blanks
  const { paragraphs, blanks } = useMemo(() => {
    if (!Array.isArray(incoming)) return { paragraphs: [], blanks: [] };

    const paras = [];
    const blankList = [];
    let blankCounter = 0;

    incoming.forEach((p, pIdx) => {
      const rawParagraph = (p && (p.paragraph ?? p.text)) || "";
      // split by literal "___"
      const parts = rawParagraph.split("___");
      const pBlanks = Array.isArray(p.blanks) ? p.blanks : [];
      const blankIdsForPara = [];

      for (let i = 0; i < Math.max(0, parts.length - 1); i++) {
        blankCounter += 1;
        const bid = `b${blankCounter}`; // e.g. b1, b2
        blankIdsForPara.push(bid);

        const rawBlankDef = pBlanks[i] ?? null;
        let rawOptions = [];

        // rawBlankDef may be object with .options array or array of strings
        if (rawBlankDef == null) {
          rawOptions = [];
        } else if (Array.isArray(rawBlankDef)) {
          // sometimes blanks: ["today","doing"...]
          rawOptions = rawBlankDef;
        } else if (Array.isArray(rawBlankDef.options)) {
          rawOptions = rawBlankDef.options;
        } else {
          // fallback: treat object itself as a single answer option if has 'answer'
          if (rawBlankDef.answer !== undefined) rawOptions = [rawBlankDef.answer];
          else rawOptions = [];
        }

        const normalizedOpts = rawOptions.map((ro, oi) => normalizeOptionRaw(ro, bid, oi));
        const correctAnswer = rawBlankDef?.answer ?? null;

        blankList.push({
          id: bid,
          options: normalizedOpts,
          answer: normalizedOpts.find((o) => o.title === correctAnswer)?.id ?? null,
          raw: rawBlankDef,
        });
      }

      paras.push({ id: `p${pIdx + 1}`, parts, blankIds: blankIdsForPara, raw: p });
    });

    return { paragraphs: paras, blanks: blankList };
  }, [incoming]);

  // local answers state: blankId -> optionId
  const [answers, setAnswers] = useState(() => {
    try {
      if (initialAnswers && Object.keys(initialAnswers).length) return { ...initialAnswers };
      if (testId && typeof window !== "undefined") {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          // only keep keys that look like blanks (b1,b2...)
          const relevant = {};
          Object.keys(parsed || {}).forEach((k) => {
            if (typeof k === "string" && k.startsWith("b")) relevant[k] = parsed[k];
          });
          return relevant;
        }
      }
    } catch (e) {
      // ignore
    }
    return {};
  });

  // persist to localStorage merged
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

  const handleSelect = (blankId, optionId) => {
    if (disabled) return;
    setAnswers((prev) => ({ ...prev, [blankId]: optionId }));
  };

  const handleClear = (blankId) => {
    if (disabled) return;
    setAnswers((prev) => {
      const n = { ...prev };
      delete n[blankId];
      return n;
    });
  };

  const handleSaveProgress = () => {
    if (!testId) {
      alert("No testId provided to save progress.");
      return;
    }
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const merged = { ...parsed, ...answers };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      alert("Progress saved.");
    } catch {
      alert("Failed to save progress.");
    }
  };

  const handleSubmit = () => {
    // out = blankId -> optionId
    const out = {};
    blanks.forEach((b) => {
      if (answers[b.id] !== undefined) out[b.id] = answers[b.id];
    });
    onSubmitLevel(out);
  };

  // If nothing, show friendly message
  if (paragraphs.length === 0 || blanks.length === 0) {
    return (
      <div className="p-6 bg-white rounded shadow-sm text-center">
        <h3 className="text-lg font-semibold text-gray-800">No content available for this level</h3>
        <p className="text-sm text-gray-500 mt-2">This level has no paragraph or blanks.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded shadow p-4 mb-4">
          <h2 className="text-xl font-semibold text-[#004080]">Sprachbausteine – Teil 1</h2>
          <p className="text-sm text-gray-600 mt-1">
            Read the text and decide which word fits into each gap.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: paragraph with numbered blanks */}
          <div className="bg-white rounded shadow p-6">
            {paragraphs.map((p) => (
              <div key={p.id}>
                <div className="prose max-w-none text-gray-800">
                  {p.parts.map((part, idx) => {
                    const blankId = p.blankIds[idx];
                    return (
                      <span key={idx}>
                        <span>{part}</span>
                        {blankId ? (
                          <span className="inline-block ml-2 mr-2 px-2 py-1 rounded text-sm font-semibold text-white bg-[#004080]">
                            [{blankId.replace("b", "")}]
                          </span>
                        ) : null}
                      </span>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>

          {/* RIGHT: options per blank */}
          <div className="bg-white rounded shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Choose the correct word for each blank</h3>

            <div className="space-y-4">
              {blanks.map((b, idx) => (
                <div key={b.id} className="border border-gray-100 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-800">
                      {idx + 1}. Fill blank <span className="text-[#004080]">[{idx + 1}]</span>
                    </div>
                    {answers[b.id] && (
                      <button onClick={() => handleClear(b.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 border border-red-100">
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col gap-2">
                    {Array.isArray(b.options) && b.options.length > 0 ? (
                      b.options.map((opt) => {
                        const selected = answers[b.id] === opt.id;
                        return (
                          <label key={opt.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition ${selected ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50"}`}>
                            <input
                              type="radio"
                              name={b.id}
                              checked={selected}
                              onChange={() => handleSelect(b.id, opt.id)}
                              disabled={disabled}
                              className="form-radio h-4 w-4 text-[#004080]"
                            />
                            <span className="text-sm text-gray-700">{opt.title}</span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-sm text-gray-500">No options provided for this blank.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-6">
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
        </div>
      </div>
    </div>
  );
}
