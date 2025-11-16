"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Sprachbausteine2 (level 5) — saves answers under grouped array: exam_answers_{testId}.levels[levelKey] = [{id, value}, ...]
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
  const paragraphObj =
    Array.isArray(questions) && questions.length > 0 ? questions[0] : null;

  const paragraphText = paragraphObj?.paragraph ?? "";
  const rawBlanks = Array.isArray(paragraphObj?.blanks)
    ? paragraphObj.blanks
    : [];

  // determine per-blank storage keys (stable)
  const blankKeys = useMemo(() => {
    const parentQid =
      paragraphObj?.questionId ??
      paragraphObj?._id ??
      paragraphObj?.id ??
      null;
    const keys = rawBlanks.map((rawBlank, i) => {
      if (rawBlank && typeof rawBlank === "object") {
        const q =
          rawBlank.questionId ??
          rawBlank.question_id ??
          rawBlank._qid ??
          rawBlank._id ??
          rawBlank.id ??
          null;
        if (q) return String(q);
      }
      if (parentQid) {
        if (
          /_?blanks[_-]?\d*_?$/.test(parentQid) ||
          parentQid.includes("_blanks_") ||
          parentQid.includes("blanks")
        ) {
          return `${parentQid}${parentQid.endsWith("_") ? "" : "_"}${i}_`;
        }
        return `${parentQid}_blanks_${i}_`;
      }
      return `b${i + 1}`;
    });
    return keys;
  }, [paragraphObj, rawBlanks]);

  // word bank (shuffled)
  const blanksList = useMemo(() => {
    const list = rawBlanks.map((b) =>
      typeof b === "string"
        ? b
        : b.options
        ? b.options[0]
        : b.text ?? JSON.stringify(b)
    );
    return [...list].sort(() => Math.random() - 0.5);
  }, [rawBlanks, remountKey]);

  // --- INIT & MIGRATION ---
  const loadAndMigrate = () => {
    try {
      const raw =
        testId && typeof window !== "undefined"
          ? localStorage.getItem(`exam_answers_${testId}`)
          : null;
      const parsed = raw ? JSON.parse(raw) : {};

      const initial = {};

      // 1) grouped array
      if (parsed && parsed.levels && Array.isArray(parsed.levels[levelKey])) {
        const arr = parsed.levels[levelKey];
        arr.forEach((it) => {
          if (it && it.id)
            initial[it.id] =
              it.value ??
              it.val ??
              it.answer ??
              (it.value === 0 ? it.value : it.value);
        });
        return initial;
      }

      // 2) grouped object (legacy)
      if (
        parsed &&
        parsed.levels &&
        parsed.levels[levelKey] &&
        typeof parsed.levels[levelKey] === "object"
      ) {
        const obj = parsed.levels[levelKey];
        blankKeys.forEach((k) => {
          if (obj[k] !== undefined) initial[k] = obj[k];
        });
      }

      // 3) flat keys
      blankKeys.forEach((k) => {
        if (initial[k] === undefined && parsed && parsed[k] !== undefined) {
          initial[k] = parsed[k];
        }
      });

      // 4) migration from bN -> blankKeys
      const autoKeys = Object.keys(parsed || {})
        .filter((k) => /^b\d+$/.test(k))
        .sort(
          (a, b) =>
            parseInt(a.replace("b", ""), 10) -
            parseInt(b.replace("b", ""), 10)
        );

      if (autoKeys.length > 0) {
        let aidx = 0;
        for (
          let i = 0;
          i < blankKeys.length && aidx < autoKeys.length;
          i += 1, aidx += 1
        ) {
          const desiredKey = blankKeys[i];
          const autoKey = autoKeys[aidx];
          if (
            initial[desiredKey] === undefined &&
            parsed &&
            parsed[autoKey] !== undefined
          ) {
            initial[desiredKey] = parsed[autoKey];
            delete parsed[autoKey];
          }
        }

        const arrAfter = Object.keys(initial).map((k) => ({
          id: k,
          value: initial[k],
        }));
        const mergedAfter = {
          ...(parsed || {}),
          levels: { ...(parsed.levels || {}), [levelKey]: arrAfter },
        };
        if (testId && typeof window !== "undefined") {
          localStorage.setItem(
            `exam_answers_${testId}`,
            JSON.stringify(mergedAfter)
          );
        }
      }

      return initial;
    } catch (e) {
      return {};
    }
  };

  const [usedWords, setUsedWords] = useState(() => loadAndMigrate());
  const usedValues = useMemo(
    () => new Set(Object.values(usedWords || {})),
    [usedWords]
  );

  // persist grouped array
  useEffect(() => {
    if (!testId || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const existingLevels =
        parsed && parsed.levels && typeof parsed.levels === "object"
          ? { ...parsed.levels }
          : {};

      const arr = Object.keys(usedWords || {}).map((k) => ({
        id: k,
        value: usedWords[k],
      }));
      existingLevels[levelKey] = arr;

      const merged = { ...(parsed || {}), levels: existingLevels };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
    } catch (e) {}
  }, [usedWords, testId, levelKey]);

  // selection handlers
  const [selectedWord, setSelectedWord] = useState(null);

  const handleWordClick = (word) => {
    if (disabled) return;
    if (usedValues.has(word)) return;
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
      const existingLevels =
        parsed && parsed.levels && typeof parsed.levels === "object"
          ? { ...parsed.levels }
          : {};
      const arr = Object.keys(usedWords || {}).map((k) => ({
        id: k,
        value: usedWords[k],
      }));
      existingLevels[levelKey] = arr;
      const merged = { ...(parsed || {}), levels: existingLevels };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      alert("Progress saved.");
    } catch {
      alert("Failed to save progress.");
    }
  };

  const handleSubmit = () => {
    const outArray = blankKeys
      .map((k) =>
        usedWords[k] !== undefined ? { id: k, value: usedWords[k] } : null
      )
      .filter(Boolean);

    try {
      const raw =
        testId && typeof window !== "undefined"
          ? localStorage.getItem(`exam_answers_${testId}`)
          : null;
      const parsed = raw ? JSON.parse(raw) : {};
      const existingLevels =
        parsed && parsed.levels && typeof parsed.levels === "object"
          ? { ...parsed.levels }
          : {};
      existingLevels[levelKey] = outArray;
      const merged = { ...(parsed || {}), levels: existingLevels };
      if (testId) {
        localStorage.setItem(
          `exam_answers_${testId}`,
          JSON.stringify(merged)
        );
      }
    } catch (e) {}

    onSubmitLevel({ [levelKey]: outArray });
    alert("Level submitted.");
  };

  // split paragraph by blanks
  const parts = useMemo(
    () => paragraphText.split("___"),
    [paragraphText]
  );

  // ---------- UI ----------
  return (
    <div className="w-full">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Level 5 – Word bank (Sprachbausteine)
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
              Read the text and decide which word fits each gap. First select a
              word from the word bank on the right, then click on a gap in the
              text. Each word can be used at most once.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3 md:justify-end">
            {!disabled && (
              <button
                onClick={handleSaveProgress}
                className="px-4 py-1.5 rounded-full text-xs md:text-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Save Progress
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
              Submit Level
            </button>
          </div>
        </div>

        {/* Main grid: left text + right word bank */}
        <div
          key={`sb2_${remountKey}`}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2"
        >
          {/* LEFT: paragraph with clickable gaps */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 md:p-5 text-slate-900 leading-7">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5">
                Reading Text
              </span>
              <span className="text-[11px] text-slate-500">
                Click on a gap to insert the selected word.
              </span>
            </div>

            <p className="text-xs md:text-sm whitespace-pre-wrap">
              {parts.map((part, i) => (
                <React.Fragment key={`part_${i}`}>
                  {part}
                  {i < parts.length - 1 && (
                    <span
                      onClick={() => handleFill(i + 1)}
                      className={`inline-block ml-1 mr-1 px-2 py-0.5 rounded cursor-pointer transition text-xs md:text-sm ${
                        usedWords[blankKeys[i]]
                          ? "bg-blue-100 text-blue-900 font-semibold"
                          : "bg-slate-100 text-slate-500 hover:bg-blue-50"
                      }`}
                    >
                      {usedWords[blankKeys[i]] || `...${i + 1}`}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </p>

            
          </div>

          {/* RIGHT: word bank + actions */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 md:p-5 flex flex-col">
            <h3 className="text-sm md:text-base font-semibold text-[#004080] mb-3">
              Word bank
            </h3>
            <p className="text-[11px] md:text-xs text-slate-500 mb-3">
              Click a word to select it, then click on a gap in the text to
              place it. Used words are greyed out.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {blanksList.map((word, idx) => {
                const isUsed = usedValues.has(word);
                const isSelected = selectedWord === word;
                return (
                  <button
                    type="button"
                    key={`word_${idx}_${String(word).slice(0, 8)}`}
                    onClick={() => handleWordClick(word)}
                    disabled={isUsed || disabled}
                    className={`text-center py-2 rounded text-xs md:text-sm font-medium border transition ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-700"
                        : isUsed
                        ? "bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed"
                        : "bg-purple-50 text-slate-900 border-purple-200 hover:bg-purple-100"
                    }`}
                  >
                    {word}
                  </button>
                );
              })}

</div>
              {Object.keys(usedWords).length > 0 && (
              <div className="mt-4 text-xs md:text-sm text-slate-700">
                <h3 className="font-semibold text-[#004080] mb-1">
                  Your choices
                </h3>
                <ul className="list-disc list-inside space-y-0.5">
                  {blankKeys.map((k, idx) => (
                    <li key={`summary_${k}`}>
                      {idx + 1}.{" "}
                      <span className="font-medium">
                        {usedWords[k] ?? "-"}
                      </span>
                      <span className="ml-2 text-[10px] text-slate-400">
                        ({k})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            

            <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={handleClearAll}
                disabled={clearingRef.current || disabled}
                className="px-4 py-1.5 rounded-full text-xs md:text-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Clear All
              </button>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
