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
  // leftTexts: transform paragraphs into objects { id: 'A', title, content }
  const leftTexts = useMemo(() => {
    if (!Array.isArray(questions) || questions.length === 0) return [];
    return questions.map((p, i) => ({
      id: String.fromCharCode(65 + i), // 'A','B',...
      title: p.title ?? `Text ${String.fromCharCode(65 + i)}`,
      content: p.paragraph ?? "",
    }));
  }, [questions]);

  // option pool (letters), optionally shuffled
  const rightOptions = useMemo(() => {
    const opts = (questions || []).map((_, i) => String.fromCharCode(65 + i));
    return [...opts].sort(() => Math.random() - 0.5);
  }, [questions]);

  // Build stable questionIds (prefer API questionId)
  const renderedItems = useMemo(() => {
    return (questions || []).map((p, i) => {
      const qid = p.questionId ?? p._id ?? p.id ?? `q_${i + 1}`;
      // Visible prompt for the task (if provided)
      const prompt = p.question ?? p.prompt ?? p.situation ?? p.paragraph ?? `Question ${i + 1}`;
      return { index: i, qid, prompt, paragraph: p.paragraph ?? "", raw: p };
    });
  }, [questions]);

  const renderedQuestionIds = useMemo(() => renderedItems.map((it) => it.qid), [renderedItems]);

  // initial state: prefer initialAnswers, else pick from localStorage grouped shape or fallback flat
  const getInitialState = () => {
    try {
      const start = { ...(initialAnswers || {}) };

      if (testId && typeof window !== "undefined") {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        if (raw) {
          const parsed = JSON.parse(raw);

          // 1) grouped shape
          if (parsed && parsed.levels && parsed.levels[levelKey]) {
            const lvl = parsed.levels[levelKey];
            renderedQuestionIds.forEach((qid) => {
              if (start[qid] === undefined && lvl && lvl[qid] !== undefined) start[qid] = lvl[qid];
            });
          } else {
            // 2) fallback flat shape (older saves)
            renderedQuestionIds.forEach((qid) => {
              if (start[qid] === undefined && parsed && parsed[qid] !== undefined) start[qid] = parsed[qid];
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

  // persist whenever answers change (merge into grouped storage levels[levelKey])
  useEffect(() => {
    if (!testId) return;
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      const parsed = raw ? JSON.parse(raw) : {};
      const levels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};
      levels[levelKey] = { ...(levels[levelKey] || {}), ...(answers || {}) };
      const merged = { ...(parsed || {}), levels };
      localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
    } catch (e) {
      // ignore
    }
  }, [answers, testId, levelKey]);

  // helper: map letter -> leftText title
  const letterToTitle = (letter) => leftTexts.find((t) => t.id === letter)?.title ?? letter;

  // select handler: stores under real questionId. We store title by default.
  const handleSelect = (qid, letter) => {
    if (disabled) return;

    // Choose what to store:
    // - storeTitle = true  -> save left-text title (default)
    // - storeTitle = false -> save letter (A/B/C)
    const storeTitle = true;
    const valueToStore = storeTitle ? letterToTitle(letter) : letter;

    setAnswers((prev) => {
      const next = { ...(prev || {}) };
      next[qid] = valueToStore;
      return next;
    });
  };

  // optional unique selection handler (uncomment use if required)
  const handleSelectUnique = (qid, letter) => {
    if (disabled) return;
    const storeTitle = true;
    const valueToStore = storeTitle ? letterToTitle(letter) : letter;

    setAnswers((prev) => {
      const next = { ...(prev || {}) };
      // remove same value from other qids
      Object.keys(next).forEach((k) => {
        if (next[k] === valueToStore) delete next[k];
      });
      next[qid] = valueToStore;
      return next;
    });
  };

  const handleSubmit = () => {
    // Only include the rendered qids in the payload
    const payload = {};
    renderedQuestionIds.forEach((qid) => {
      if (answers[qid] !== undefined) payload[qid] = answers[qid];
    });

    // Merge one last time into localStorage under grouped shape
    try {
      if (testId) {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        const parsed = raw ? JSON.parse(raw) : {};
        const levels = parsed && parsed.levels && typeof parsed.levels === "object" ? { ...parsed.levels } : {};
        levels[levelKey] = { ...(levels[levelKey] || {}), ...payload };
        const merged = { ...(parsed || {}), levels };
        localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      }
    } catch (e) {
      // ignore
    }

    // call parent with grouped payload similar to other levels
    onSubmitLevel({ [levelKey]: payload });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* LEFT: Paragraphs A, B, C */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#004080] mb-2">Leseverstehen – Teil 3</h2>
        <p className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm text-gray-700 rounded">
          Lesen Sie die Texte (A–{String.fromCharCode(65 + Math.max(0, leftTexts.length - 1))}) und die Aufgaben (1–{questions.length}).
          Welcher Text passt zu welcher Situation? Wählen Sie den passenden Buchstaben.
        </p>

        {leftTexts.map((t) => (
          <div key={t.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-[#004080]">{t.id}</span>
              <span className="text-sm text-gray-500">{t.title}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{t.content}</p>
          </div>
        ))}
      </div>

      {/* RIGHT: Questions and option pool */}
      <div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
          <h3 className="font-semibold text-[#004080]">Aufgaben (1–{questions.length})</h3>
          <p className="text-sm text-gray-600">Wählen Sie für jede Situation den passenden Text (A, B, C ...).</p>
        </div>

        <div className="space-y-3">
          {renderedItems.map((item, idx) => {
            const qid = item.qid;
            const displayedValue = answers[qid] ?? null;
            return (
              <div key={qid} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow transition">
                <p className="text-sm font-medium text-gray-800 mb-2">{idx + 1}. {item.prompt}</p>

                <div className="flex gap-2 flex-wrap">
                  {rightOptions.map((letter) => {
                    // show selected state by comparing stored title or letter
                    const storeTitle = true;
                    const expected = storeTitle ? letterToTitle(letter) : letter;
                    const isSelected = displayedValue === expected;
                    return (
                      <button
                        key={`${qid}_${letter}`}
                        onClick={() => handleSelect(qid, letter)} // use handleSelectUnique if you want uniqueness
                        className={`px-3 py-1 border rounded text-sm font-semibold transition ${isSelected ? "bg-[#004080] text-white border-[#004080]" : "border-gray-300 hover:bg-blue-100"}`}
                        disabled={disabled}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>

                {/* show selected stored label for debug */}
                {displayedValue ? <div className="mt-2 text-sm text-gray-600">Selected: <span className="font-medium">{displayedValue}</span></div> : null}

              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={handleSubmit} disabled={disabled} className={`px-4 py-2 rounded ${disabled ? "bg-gray-300 text-gray-600" : "bg-green-600 text-white"}`}>
            Submit Level
          </button>
        </div>
      </div>
    </div>
  );
}
