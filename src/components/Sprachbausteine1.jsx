"use client";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Sprachbausteine1 (Level 4) — with migration from bN -> API questionId keys
 *
 * Stores answers under grouped shape `levels[levelKey]` as an ARRAY:
 *   exam_answers_{testId}.levels[levelKey] = [{ id: "<blankKey>", value: "<optionTitle>" }, ...]
 */

function makeOptionId(base, idx) {
  return `${base}_opt_${idx}`;
}

// 🔀 helper to shuffle options once per load
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeOptionRaw(rawOpt, base, idx) {
  if (rawOpt === null || rawOpt === undefined)
    return { id: makeOptionId(base, idx), title: String(rawOpt) };
  if (
    typeof rawOpt === "string" ||
    typeof rawOpt === "number" ||
    typeof rawOpt === "boolean"
  ) {
    return { id: makeOptionId(base, idx), title: String(rawOpt) };
  }
  const title =
    rawOpt.title ??
    rawOpt.text ??
    rawOpt.label ??
    rawOpt.option ??
    rawOpt.value ??
    JSON.stringify(rawOpt);
  const id = rawOpt.id ?? rawOpt._id ?? makeOptionId(base, idx);
  return { id: String(id), title: String(title) };
}

export default function Sprachbausteine1({
  questions: incoming = [],
  initialAnswers = {},
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
  levelKey = "level4",
}) {
  const pickId = (obj) => {
    if (!obj || typeof obj !== "object") return null;
    return (
      obj.questionId ??
      obj.question_id ??
      obj._qid ??
      obj._id ??
      obj.id ??
      null
    );
  };

  // normalize paragraphs & blanks
  const { paragraphs, blanks } = useMemo(() => {
    if (!Array.isArray(incoming)) return { paragraphs: [], blanks: [] };

    const paras= [];
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

        let storageKey = null;
        if (rawBlankIdCandidate) {
          storageKey = rawBlankIdCandidate;
        } else if (parentQid) {
          if (
            /_?blanks[_-]?\d*_?$/.test(parentQid) ||
            parentQid.includes("_blanks_") ||
            parentQid.includes("blanks")
          ) {
            storageKey = `${parentQid}${
              parentQid.endsWith("_") ? "" : "_"
            }${i}_`;
          } else {
            storageKey = `${parentQid}_blanks_${i}_`;
          }
        } else {
          auto += 1;
          storageKey = `b${auto}`;
        }

        blankIdsForPara.push(storageKey);

        let rawOptions = [];
        if (rawBlank == null) rawOptions = [];
        else if (Array.isArray(rawBlank)) rawOptions = rawBlank;
        else if (Array.isArray(rawBlank.options)) rawOptions = rawBlank.options;
        else if (rawBlank.answer !== undefined && rawBlank.options == null)
          rawOptions = [rawBlank.answer];
        else rawOptions = [];

        // normalize
        const opts = rawOptions.map((ro, oi) =>
          normalizeOptionRaw(ro, storageKey, oi)
        );

        // compute correct answer title
        let correctTitle = null;
        if (rawBlank && typeof rawBlank === "object" && rawBlank.answer !== undefined) {
          const foundByTitle = opts.find(
            (o) => String(o.title) === String(rawBlank.answer)
          );
          if (foundByTitle) correctTitle = foundByTitle.title;
          else {
            const foundById = opts.find(
              (o) => String(o.id) === String(rawBlank.answer)
            );
            if (foundById) correctTitle = foundById.title;
          }
        }

        // 🔀 shuffle options once here
        const shuffledOpts = shuffleArray(opts);

        blankList.push({
          id: storageKey,
          parentQid,
          options: shuffledOpts,
          correctTitle,
          raw: rawBlank,
        });
      }

      paras.push({
        id: parentQid ?? `p${pIdx + 1}`,
        parts,
        blankIds: blankIdsForPara,
        raw: p,
        parentQid,
      });
    });

    return { paragraphs: paras, blanks: blankList };
  }, [incoming]);

  const blankKeys = useMemo(() => blanks.map((b) => b.id), [blanks]);

  // --- initial load + migration ---
  const getInitial = () => {
    try {
      const start = { ...(initialAnswers || {}) };

      if (testId && typeof window !== "undefined") {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        const parsed = raw ? JSON.parse(raw) : {};

        if (parsed && parsed.levels && Array.isArray(parsed.levels[levelKey])) {
          const arr = parsed.levels[levelKey];
          arr.forEach((it) => {
            if (it && it.id)
              start[it.id] =
                it.value ?? it.val ?? it.answer ?? (it.value === 0 ? it.value : it.value);
          });
        } else if (
          parsed &&
          parsed.levels &&
          parsed.levels[levelKey] &&
          typeof parsed.levels[levelKey] === "object"
        ) {
          const obj = parsed.levels[levelKey];
          blankKeys.forEach((k) => {
            if (obj[k] !== undefined) start[k] = obj[k];
          });
        } else {
          blankKeys.forEach((k) => {
            if (start[k] === undefined && parsed && parsed[k] !== undefined)
              start[k] = parsed[k];
          });

          const autoKeys = Object.keys(parsed || {}).filter((k) =>
            /^b\d+$/.test(k)
          );
          if (autoKeys.length > 0) {
            const availableAuto = autoKeys
              .slice()
              .sort((a, b) => {
                const na = parseInt(a.replace("b", ""), 10);
                const nb = parseInt(b.replace("b", ""), 10);
                return na - nb;
              });

            let ai = 0;
            for (
              let i = 0;
              i < blanks.length && ai < availableAuto.length;
              i += 1, ai += 1
            ) {
              const desiredKey = blanks[i].id;

              const autoKey = availableAuto[ai];
              if (
                start[desiredKey] === undefined &&
                parsed &&
                parsed[autoKey] !== undefined
              ) {
                start[desiredKey] = parsed[autoKey];
                delete parsed[autoKey];
              }
            }

            const arrAfter = Object.keys(start).map((k) => ({
              id: k,
              value: start[k],
            }));
            const mergedAfterMigration = {
              ...(parsed || {}),
              levels: {
                ...(parsed.levels || {}),
                [levelKey]: arrAfter,
              },
            };
            localStorage.setItem(
              `exam_answers_${testId}`,
              JSON.stringify(mergedAfterMigration)
            );
          }
        }
      }

      return start;
    } catch (e) {
      return { ...(initialAnswers || {}) };
    }
  };

  const [answers, setAnswers] = useState(() => getInitial());

  // persist as array
  useEffect(() => {
    if (!testId || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const existingLevels =
        parsed && parsed.levels && typeof parsed.levels === "object"
          ? { ...parsed.levels }
          : {};

      const arr = Object.keys(answers || {}).map((k) => ({
        id: k,
        value: answers[k],
      }));

      existingLevels[levelKey] = arr;

      const merged = { ...(parsed || {}), levels: existingLevels };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
    } catch (e) {}
  }, [answers, testId, levelKey]);

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
      const existingLevels =
        parsed && parsed.levels && typeof parsed.levels === "object"
          ? { ...parsed.levels }
          : {};
      const arr = Object.keys(answers || {}).map((k) => ({
        id: k,
        value: answers[k],
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
    const outArray = Object.keys(answers || {}).map((k) => ({
      id: k,
      value: answers[k],
    }));

    try {
      if (testId) {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        const parsed = raw ? JSON.parse(raw) : {};
        const existingLevels =
          parsed && parsed.levels && typeof parsed.levels === "object"
            ? { ...parsed.levels }
            : {};
        existingLevels[levelKey] = outArray;
        const merged = { ...(parsed || {}), levels: existingLevels };
        localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      }
    } catch (e) {}

    onSubmitLevel({ [levelKey]: outArray });
  };

  if (paragraphs.length === 0 || blanks.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
        <h3 className="text-base md:text-lg font-semibold text-slate-900">
          Für diese Stufe sind keine Inhalte verfügbar.
        </h3>
        <p className="text-xs md:text-sm text-slate-500 mt-2">
          Für diese Stufe sind keine Absätze oder Lücken konfiguriert.
        </p>
      </div>
    );
  }

  // ---------- UI ----------
  return (
    <div className="w-full">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Lesen 4 – Lückentext (Sprachbausteine)
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
              Lesen Sie den Text und wählen Sie für jede Lücke die beste Option aus. Ihre
              Antworten werden lokal für diesen Test gespeichert.
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
              Stufe abschicken
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          {/* LEFT: paragraphs with blank markers */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 md:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5">
                Lesetext
              </span>
              <span className="text-[11px] text-slate-500">
                Lücken sind als [1], [2], [3], … markiert
              </span>
            </div>

            {paragraphs.map((p) => (
              <div
                key={p.id}
                className="text-xs md:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap mb-3"
              >
                {p.parts.map((part, idx) => {
                  const blankKey = p.blankIds[idx];
                  return (
                    <span key={idx}>
                      <span>{part}</span>
                      {blankKey ? (
                        <span className="inline-flex items-center justify-center mx-1 px-1.5 py-0.5 rounded-full text-[11px] md:text-xs font-semibold text-blue-700 bg-blue-50">
                          [{idx + 1}]
                        </span>
                      ) : null}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          {/* RIGHT: options per blank */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 md:p-5">
            <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-3">
              Wählen Sie die richtige Option für jede Lücke
            </h3>

            <div className="space-y-4">
              {blanks.map((b, idx) => {
                const saved = answers[b.id] ?? null;
                return (
                  <div
                    key={b.id}
                    className="border border-slate-100 rounded-lg p-3 md:p-4"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-xs md:text-sm font-medium text-slate-900">
                        Gap <span className="text-blue-700">[{idx + 1}]</span>
                      </div>
                      {saved && (
                        <button
                          type="button"
                          onClick={() => handleClear(b.id)}
                          className="text-[11px] px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="mt-2 flex flex-col gap-1.5">
                      {Array.isArray(b.options) && b.options.length > 0 ? (
                        b.options.map((opt) => {
                          const isSelected = saved === opt.title;
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 cursor-pointer border transition ${
                                isSelected
                                  ? "bg-blue-50 border-blue-200"
                                  : "border-slate-200 hover:bg-slate-50"
                              } ${
                                disabled
                                  ? "opacity-80 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name={b.id}
                                className="h-4 w-4 text-blue-600"
                                checked={isSelected}
                                onChange={() =>
                                  handleSelect(b.id, opt.title)
                                }
                                disabled={disabled}
                              />
                              <span className="text-xs md:text-sm text-slate-800">
                                {opt.title}
                              </span>
                            </label>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-500">
                          Für diese Lücke sind keine Optionen verfügbar.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
