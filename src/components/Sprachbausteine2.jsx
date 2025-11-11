"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sprachbausteine2 (level 5) — saves answers under grouped array: exam_answers_{testId}.levels[levelKey] = [{id, value}, ...]
 *
 * Props:
 * - questions: array (expecting module.content.paragraphs or single paragraph object)
 * - disabled, onSubmitLevel, testId
 *
 * Behavior:
 * - Uses per-blank keys (prefer blank.questionId or paragraph-based fallback)
 * - Internal state `usedWords` is a { [blankKey]: word } map for UI
 * - Persisted storage for the level is an ARRAY under levels[levelKey]
 */

export default function Sprachbausteine2({
  questions = [],
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
  levelKey = "level5",
}) {
  const clearingRef = useRef(false);
  const [remountKey, setRemountKey] = useState(0);

  // Read paragraph object (we expect questions to be the raw paragraphs array)
  const paragraphObj = (Array.isArray(questions) && questions.length > 0) ? questions[0] : null;

  // paragraph text and raw blanks (could be array of strings or array of blank-objects)
  const paragraphText = paragraphObj?.paragraph ?? "";
  const rawBlanks = Array.isArray(paragraphObj?.blanks) ? paragraphObj.blanks : [];

  // determine per-blank storage keys (stable)
  const blankKeys = useMemo(() => {
    const parentQid = paragraphObj?.questionId ?? paragraphObj?._id ?? paragraphObj?.id ?? null;
    const keys = rawBlanks.map((rawBlank, i) => {
      // if blank is object and has questionId-like fields, prefer it
      if (rawBlank && typeof rawBlank === "object") {
        const q = rawBlank.questionId ?? rawBlank.question_id ?? rawBlank._qid ?? rawBlank._id ?? rawBlank.id ?? null;
        if (q) return String(q);
      }
      // else if parent paragraph id exists, form per-blank key
      if (parentQid) {
        if (/_?blanks[_-]?\d*_?$/.test(parentQid) || parentQid.includes("_blanks_") || parentQid.includes("blanks")) {
          return `${parentQid}${parentQid.endsWith("_") ? "" : "_"}${i}_`;
        }
        return `${parentQid}_blanks_${i}_`;
      }
      // final fallback `b{n}`
      return `b${i + 1}`;
    });
    return keys;
  }, [paragraphObj, rawBlanks]);

  // word bank (shuffled on mount/remount)
  const blanksList = useMemo(() => {
    const list = rawBlanks.map((b) => (typeof b === "string" ? b : (b.options ? b.options[0] : (b.text ?? JSON.stringify(b)))));
    // shuffle copy
    return [...list].sort(() => Math.random() - 0.5);
  }, [rawBlanks, remountKey]);

  // --- INIT & MIGRATION: read grouped array if present, else fall back to object or bN ---
  const loadAndMigrate = () => {
    try {
      const raw = testId && typeof window !== "undefined" ? localStorage.getItem(`exam_answers_${testId}`) : null;
      const parsed = raw ? JSON.parse(raw) : {};

      const initial = {};

      // 1) If grouped array exists for our levelKey, load into initial map
      if (parsed && parsed.levels && Array.isArray(parsed.levels[levelKey])) {
        const arr = parsed.levels[levelKey];
        arr.forEach((it) => {
          if (it && it.id) initial[it.id] = it.value ?? it.val ?? it.answer ?? it.value === 0 ? it.value : it.value;
        });
        return initial;
      }

      // 2) If grouped object exists (legacy), use those keys
      if (parsed && parsed.levels && parsed.levels[levelKey] && typeof parsed.levels[levelKey] === "object") {
        const obj = parsed.levels[levelKey];
        blankKeys.forEach((k) => {
          if (obj[k] !== undefined) initial[k] = obj[k];
        });
      }

      // 3) Fallback: load top-level flat keys
      blankKeys.forEach((k) => {
        if (initial[k] === undefined && parsed && parsed[k] !== undefined) initial[k] = parsed[k];
      });

      // 4) Migration from bN generated keys -> our blankKeys in order (if any)
      const autoKeys = Object.keys(parsed || {}).filter((k) => /^b\d+$/.test(k)).sort((a, b) => parseInt(a.replace("b", ""), 10) - parseInt(b.replace("b", ""), 10));

      if (autoKeys.length > 0) {
        let aidx = 0;
        for (let i = 0; i < blankKeys.length && aidx < autoKeys.length; i += 1, aidx += 1) {
          const desiredKey = blankKeys[i];
          const autoKey = autoKeys[aidx];
          if (initial[desiredKey] === undefined && parsed && parsed[autoKey] !== undefined) {
            initial[desiredKey] = parsed[autoKey];
            // remove autoKey to avoid duplication later
            delete parsed[autoKey];
          }
        }

        // persist merged result as grouped array to avoid future confusion
        const arrAfter = Object.keys(initial).map((k) => ({ id: k, value: initial[k] }));
        const mergedAfter = { ...(parsed || {}), levels: { ...(parsed.levels || {}), [levelKey]: arrAfter } };
        if (testId && typeof window !== "undefined") localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(mergedAfter));
      }

      return initial;
    } catch (e) {
      return {};
    }
  };

  const [usedWords, setUsedWords] = useState(() => loadAndMigrate());

  // derived set for quick checks
  const usedValues = useMemo(() => new Set(Object.values(usedWords || {})), [usedWords]);

  // persist when usedWords changes: write grouped array under levels[levelKey]
  useEffect(() => {
    if (!testId || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const existingLevels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};

      const arr = Object.keys(usedWords || {}).map((k) => ({ id: k, value: usedWords[k] }));

      existingLevels[levelKey] = arr;

      const merged = { ...(parsed || {}), levels: existingLevels };

      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
    } catch (e) {
      // ignore
    }
  }, [usedWords, testId, levelKey]);

  // select/deselect word and fill blanks
  const [selectedWord, setSelectedWord] = useState(null);
  const handleWordClick = (word) => {
    if (disabled) return;
    if (usedValues.has(word)) return; // can't select a used word
    setSelectedWord((s) => (s === word ? null : word));
  };

  const handleFill = (blankIndexOneBased) => {
    if (disabled) return;
    if (!selectedWord) return;
    const idx = blankIndexOneBased - 1;
    const key = blankKeys[idx];
    if (!key) return;
    if (usedValues.has(selectedWord)) return;

    setUsedWords((prev) => {
      const next = { ...(prev || {}) };
      next[key] = selectedWord;
      return next;
    });

    setSelectedWord(null);
  };

  const handleClearAll = () => {
    if (disabled) return;
    if (clearingRef.current) return;
    clearingRef.current = true;
    requestAnimationFrame(() => {
      setRemountKey((k) => k + 1);
      setUsedWords({});
      setSelectedWord(null);
      setTimeout(() => (clearingRef.current = false), 30);
    });
  };

  const handleSaveProgress = () => {
    if (!testId) return alert("No testId provided to save progress.");
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const existingLevels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};
      const arr = Object.keys(usedWords || {}).map((k) => ({ id: k, value: usedWords[k] }));
      existingLevels[levelKey] = arr;
      const merged = { ...(parsed || {}), levels: existingLevels };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      alert("Progress saved.");
    } catch {
      alert("Failed to save progress.");
    }
  };

  const handleSubmit = () => {
    // Build array payload only for these blankKeys
    const outArray = blankKeys.map((k) => (usedWords[k] !== undefined ? { id: k, value: usedWords[k] } : null)).filter(Boolean);

    // persist
    try {
      const raw = testId && typeof window !== "undefined" ? localStorage.getItem(`exam_answers_${testId}`) : null;
      const parsed = raw ? JSON.parse(raw) : {};
      const existingLevels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};
      existingLevels[levelKey] = outArray;
      const merged = { ...(parsed || {}), levels: existingLevels };
      if (testId) localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
    } catch (e) {
      // ignore
    }

    onSubmitLevel({ [levelKey]: outArray });
    alert("Level submitted.");
  };

  // UI parts: split paragraph text by "___"
  const parts = useMemo(() => paragraphText.split("___"), [paragraphText]);

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <div className="bg-blue-800 text-white px-6 py-3 text-lg font-semibold">
        Sprachbausteine – Teil 2
      </div>
      <div className="bg-yellow-100 px-6 py-3 text-gray-800 text-sm border-b border-gray-300">
        Lesen Sie den Text und entscheiden Sie, welches Wort in welche Lücke passt.
        Sie können jedes Wort nur einmal verwenden. Nicht alle Wörter passen in den Text.
      </div>

      <div key={`sb2_${remountKey}`} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="bg-white shadow rounded-lg p-6 text-gray-900 leading-7">
          <p>
            {parts.map((part, i) => (
              <React.Fragment key={`part_${i}`}>
                {part}
                {i < parts.length - 1 && (
                  <span
                    onClick={() => handleFill(i + 1)}
                    className={`inline-block ml-1 mr-1 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-200 transition ${
                      usedWords[blankKeys[i]] ? "text-blue-900 font-semibold bg-blue-100" : "text-gray-500 bg-gray-50"
                    }`}
                  >
                    {usedWords[blankKeys[i]] || `...${i + 1}`}
                  </span>
                )}
              </React.Fragment>
            ))}
          </p>

          <div className="mt-6 text-sm text-gray-700">
            {Object.keys(usedWords).length > 0 && (
              <div>
                <h3 className="font-semibold mb-1 text-[#004080]">Ihre Auswahl:</h3>
                <ul className="list-disc list-inside">
                  {blankKeys.map((k, idx) => (
                    <li key={`summary_${k}`}>
                      {idx + 1}. <span className="font-medium">{usedWords[k] ?? "-"}</span> <span className="text-xs text-gray-400 ml-2">({k})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="font-semibold text-[#004080] mb-3">
            Wählen Sie ein Wort und klicken Sie auf die Lücke.
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {blanksList.map((word, idx) => {
              const isUsed = usedValues.has(word);
              const isSelected = selectedWord === word;
              return (
                <div
                  key={`word_${idx}_${String(word).slice(0, 8)}`}
                  onClick={() => handleWordClick(word)}
                  className={`cursor-pointer text-center py-2 rounded border text-sm font-medium transition ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-700"
                      : isUsed
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-purple-100 hover:bg-purple-200 border-purple-200"
                  }`}
                >
                  {word}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleClearAll}
              disabled={clearingRef.current || disabled}
              className="px-4 py-2 bg-gray-100 border rounded text-gray-800 hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Clear All
            </button>

            <div className="flex gap-2">
              {!disabled && (
                <button
                  onClick={handleSaveProgress}
                  className="px-4 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
                >
                  Save Progress
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={disabled}
                className={`px-4 py-2 rounded ${
                  disabled ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                Submit Level
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
