"use client";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Sprachbausteine1 (Level 4) — with migration from bN -> API questionId keys
 *
 * Stores answers under grouped shape `levels[levelKey]` as an ARRAY:
 *   exam_answers_{testId}.levels[levelKey] = [{ id: "<blankKey>", value: "<optionTitle>" }, ...]
 *
 * Internal component still uses an object map for quick lookups: { [blankKey]: title }
 */

function makeOptionId(base, idx) {
  return `${base}_opt_${idx}`;
}

function normalizeOptionRaw(rawOpt, base, idx) {
  if (rawOpt === null || rawOpt === undefined) return { id: makeOptionId(base, idx), title: String(rawOpt) };
  if (typeof rawOpt === "string" || typeof rawOpt === "number" || typeof rawOpt === "boolean") {
    return { id: makeOptionId(base, idx), title: String(rawOpt) };
  }
  const title = rawOpt.title ?? rawOpt.text ?? rawOpt.label ?? rawOpt.option ?? rawOpt.value ?? JSON.stringify(rawOpt);
  const id = rawOpt.id ?? rawOpt._id ?? makeOptionId(base, idx);
  return { id: String(id), title: String(title) };
}

export default function Sprachbausteine1({
  questions: incoming = [],
  initialAnswers = {},
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
  levelKey = "level4", // default now level4; change if needed
}) {
  // helper: pick possible id fields
  const pickId = (obj) => {
    if (!obj || typeof obj !== "object") return null;
    return obj.questionId ?? obj.question_id ?? obj._qid ?? obj._id ?? obj.id ?? null;
  };

  // normalize paragraphs & blanks and derive a stable storage key for each blank
  const { paragraphs, blanks } = useMemo(() => {
    if (!Array.isArray(incoming)) return { paragraphs: [], blanks: [] };

    const paras = [];
    const blankList = [];
    let auto = 0;

    incoming.forEach((p, pIdx) => {
      const parentQidCandidate = pickId(p);
      const parentQid = parentQidCandidate ?? null;

      const rawParagraph = (p && (p.paragraph ?? p.text)) || "";
      const parts = rawParagraph.split("___");
      const pBlanks = Array.isArray(p.blanks) ? p.blanks : [];
      const blankIdsForPara = [];

      for (let i = 0; i < Math.max(0, parts.length - 1); i++) {
        const rawBlank = pBlanks[i] ?? null;
        const rawBlankIdCandidate = pickId(rawBlank);

        // choose storage key:
        let storageKey = null;
        if (rawBlankIdCandidate) {
          storageKey = rawBlankIdCandidate;
        } else if (parentQid) {
          if (/_?blanks[_-]?\d*_?$/.test(parentQid) || parentQid.includes("_blanks_") || parentQid.includes("blanks")) {
            storageKey = `${parentQid}${parentQid.endsWith("_") ? "" : "_"}${i}_`;
          } else {
            storageKey = `${parentQid}_blanks_${i}_`;
          }
        } else {
          auto += 1;
          storageKey = `b${auto}`;
        }

        blankIdsForPara.push(storageKey);

        // derive options
        let rawOptions = [];
        if (rawBlank == null) rawOptions = [];
        else if (Array.isArray(rawBlank)) rawOptions = rawBlank;
        else if (Array.isArray(rawBlank.options)) rawOptions = rawBlank.options;
        else if (rawBlank.answer !== undefined && rawBlank.options == null) rawOptions = [rawBlank.answer];
        else rawOptions = [];

        const opts = rawOptions.map((ro, oi) => normalizeOptionRaw(ro, storageKey, oi));

        // detect correct title if supplied
        let correctTitle = null;
        if (rawBlank && typeof rawBlank === "object" && rawBlank.answer !== undefined) {
          const foundByTitle = opts.find((o) => String(o.title) === String(rawBlank.answer));
          if (foundByTitle) correctTitle = foundByTitle.title;
          else {
            const foundById = opts.find((o) => String(o.id) === String(rawBlank.answer));
            if (foundById) correctTitle = foundById.title;
          }
        }

        blankList.push({
          id: storageKey,
          parentQid,
          options: opts,
          correctTitle,
          raw: rawBlank,
        });
      }

      paras.push({ id: parentQid ?? `p${pIdx + 1}`, parts, blankIds: blankIdsForPara, raw: p, parentQid });
    });

    return { paragraphs: paras, blanks: blankList };
  }, [incoming]);

  const blankKeys = useMemo(() => blanks.map((b) => b.id), [blanks]);

  // ---- INITIAL LOAD + MIGRATION ----
  // We want internal answers as { [blankKey]: title }
  const getInitial = () => {
    try {
      const start = { ...(initialAnswers || {}) };

      if (testId && typeof window !== "undefined") {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        const parsed = raw ? JSON.parse(raw) : {};

        // 1) If grouped array exists: load that array into start map
        if (parsed && parsed.levels && Array.isArray(parsed.levels[levelKey])) {
          const arr = parsed.levels[levelKey];
          arr.forEach((it) => {
            if (it && it.id) start[it.id] = it.value ?? it.val ?? it.answer ?? it.value === 0 ? it.value : it.value;
          });
        } else if (parsed && parsed.levels && parsed.levels[levelKey] && typeof parsed.levels[levelKey] === "object") {
          // 2) If grouped object exists, use it (backwards compat)
          const obj = parsed.levels[levelKey];
          blankKeys.forEach((k) => {
            if (obj[k] !== undefined) start[k] = obj[k];
          });
        } else {
          // 3) fallback: if parsed top-level has flat keys (or old bN keys), load them
          blankKeys.forEach((k) => {
            if (start[k] === undefined && parsed && parsed[k] !== undefined) start[k] = parsed[k];
          });

          // 4) migration from bN generated keys -> desired blankKeys (only if present)
          const autoKeys = Object.keys(parsed || {}).filter((k) => /^b\d+$/.test(k));
          if (autoKeys.length > 0) {
            const availableAuto = autoKeys.slice().sort((a, b) => {
              const na = parseInt(a.replace("b", ""), 10);
              const nb = parseInt(b.replace("b", ""), 10);
              return na - nb;
            });

            let ai = 0;
            for (let i = 0; i < blanks.length && ai < availableAuto.length; i += 1, ai += 1) {
              const desiredKey = blanks[i].id;
              const autoKey = availableAuto[ai];
              if (start[desiredKey] === undefined && parsed && parsed[autoKey] !== undefined) {
                start[desiredKey] = parsed[autoKey];
                // remove autoKey from parsed so it doesn't remain top-level (we will persist merged later)
                delete parsed[autoKey];
              }
            }

            // persist migration result back as grouped array to avoid future confusion
            const arrAfter = Object.keys(start).map((k) => ({ id: k, value: start[k] }));
            const mergedAfterMigration = { ...(parsed || {}), levels: { ...(parsed.levels || {}), [levelKey]: arrAfter } };
            localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(mergedAfterMigration));
          }
        }
      }

      return start;
    } catch (e) {
      return { ...(initialAnswers || {}) };
    }
  };

  const [answers, setAnswers] = useState(() => getInitial());

  // persist merged answers but write the LEVEL as an ARRAY
  useEffect(() => {
    if (!testId || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};

      // preserve other parsed.levels keys
      const existingLevels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};

      // convert answers map to array: [{id, value}, ...]
      const arr = Object.keys(answers || {}).map((k) => ({ id: k, value: answers[k] }));

      existingLevels[levelKey] = arr;

      const merged = { ...(parsed || {}), levels: existingLevels };

      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
    } catch (e) {
      // ignore
    }
  }, [answers, testId, levelKey]);

  // store OPTION TITLE under the API key (answers map)
  const handleSelect = (blankKey, optTitle) => {
    if (disabled) return;
    if (typeof optTitle !== "string") return;
    setAnswers((prev) => ({ ...(prev || {}), [blankKey]: optTitle }));
  };

  const handleClear = (blankKey) => {
    if (disabled) return;
    setAnswers((prev) => {
      const n = { ...(prev || {}) };
      delete n[blankKey];
      return n;
    });
  };

  const handleSaveProgress = () => {
    if (!testId) return alert("No testId provided to save progress.");
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const existingLevels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};
      const arr = Object.keys(answers || {}).map((k) => ({ id: k, value: answers[k] }));
      existingLevels[levelKey] = arr;
      const merged = { ...(parsed || {}), levels: existingLevels };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      alert("Progress saved.");
    } catch {
      alert("Failed to save progress.");
    }
  };

  const handleSubmit = () => {
    const outArray = Object.keys(answers || {}).map((k) => ({ id: k, value: answers[k] }));

    // persist array
    try {
      if (testId) {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        const parsed = raw ? JSON.parse(raw) : {};
        const existingLevels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};
        existingLevels[levelKey] = outArray;
        const merged = { ...(parsed || {}), levels: existingLevels };
        localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      }
    } catch (e) {
      // ignore
    }

    // call parent with grouped array payload, consistent with storage shape
    onSubmitLevel({ [levelKey]: outArray });
  };

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
          <h2 className="text-xl font-semibold text-[#004080]">Sprachbausteine – Teil 1 (Level 4)</h2>
          <p className="text-sm text-gray-600 mt-1">Fill the gaps. Answers are saved under <code>levels.{levelKey}</code> as an array of objects (<code>{'{id,value}'}</code>).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: paragraphs */}
          <div className="bg-white rounded shadow p-6">
            {paragraphs.map((p) => (
              <div key={p.id} className="prose max-w-none text-gray-800 mb-4">
                {p.parts.map((part, idx) => {
                  const blankKey = p.blankIds[idx];
                  return (
                    <span key={idx}>
                      <span>{part}</span>
                      {blankKey ? (
                        <span className="inline-block ml-2 mr-2 px-2 py-1 rounded text-sm font-semibold text-white bg-[#004080]">
                          [{String(idx + 1)}]
                        </span>
                      ) : null}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          {/* RIGHT: options per blank */}
          <div className="bg-white rounded shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Choose the correct option for each gap</h3>

            <div className="space-y-4">
              {blanks.map((b, idx) => {
                const saved = answers[b.id] ?? null;
                return (
                  <div key={b.id} className="border border-gray-100 rounded p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-800">
                        {idx + 1}. Gap <span className="text-[#004080]">[{idx + 1}]</span>
                      </div>
                      {saved && (
                        <button onClick={() => handleClear(b.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 border border-red-100">
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="mt-2 flex flex-col gap-2">
                      {Array.isArray(b.options) && b.options.length > 0 ? (
                        b.options.map((opt) => {
                          const isSelected = saved === opt.title;
                          return (
                            <label key={opt.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition ${isSelected ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50"}`}>
                              <input
                                type="radio"
                                name={b.id}
                                checked={isSelected}
                                onChange={() => handleSelect(b.id, opt.title)}
                                disabled={disabled}
                                className="form-radio h-4 w-4 text-[#004080]"
                              />
                              <span className="text-sm text-gray-700">{opt.title}</span>
                            </label>
                          );
                        })
                      ) : (
                        <div className="text-sm text-gray-500">No options provided for this gap.</div>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                      Saved key: <code>{b.id}</code>
                    </div>
                  </div>
                );
              })}
            </div>

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
