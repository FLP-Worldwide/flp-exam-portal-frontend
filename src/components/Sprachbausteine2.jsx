"use client";
import React, { useMemo, useRef, useState } from "react";

/**
 * Sprachbausteine2 (level 5) — dynamic paragraph + blanks word-bank
 *
 * Props:
 * - questions: array coming from parent (level_5.content.paragraphs)
 * - disabled, onSubmitLevel, testId
 */
export default function Sprachbausteine2({
  questions = [],
  disabled = false,
  onSubmitLevel = () => {},
  testId = null,
}) {
  const [usedWords, setUsedWords] = useState({});
  const [selectedWord, setSelectedWord] = useState(null);
  const clearingRef = useRef(false);

  // remount key: changing this will fully remount the paragraph/word-bank fragment
  const [remountKey, setRemountKey] = useState(0);

  // Extract paragraph and blanks dynamically (the API shape: questions[0].paragraph and questions[0].blanks (array of strings))
  const { paragraphText, blanksList } = useMemo(() => {
    if (!questions || questions.length === 0) return { paragraphText: "", blanksList: [] };
    const para = questions[0]?.paragraph ?? "";
    const blanks = Array.isArray(questions[0]?.blanks) ? questions[0].blanks : [];

    // We want word-bank to be randomized each time the component mounts (but stable while user interacts).
    const shuffled = [...blanks].sort(() => Math.random() - 0.5);
    return { paragraphText: para, blanksList: shuffled };
  }, [questions, remountKey]); // include remountKey so remount causes a new shuffle

  // select/deselect a word
  const handleWordClick = (word) => {
    if (disabled) return;
    setSelectedWord((prev) => (prev === word ? null : word));
  };

  // fill a blank (deferred to avoid DOM race)
  const handleFill = (blankIndex) => {
    if (disabled) return;
    if (!selectedWord) return;
    if (Object.values(usedWords).includes(selectedWord)) return;

    // defer DOM update to next frame to avoid event/DOM race
    requestAnimationFrame(() => {
      setUsedWords((prev) => ({ ...prev, [blankIndex]: selectedWord }));
      setSelectedWord(null);
    });
  };

  const parts = useMemo(() => paragraphText.split("___"), [paragraphText]);

  const handleSubmit = () => {
    onSubmitLevel(usedWords);
    // you may prefer a non-alert UX in production
    alert("Level submitted successfully!");
  };

  // Clear all safely: remount + deferred state reset + small lock to prevent double clicks
  const handleClearAll = () => {
    if (disabled) return;
    if (clearingRef.current) return;

    clearingRef.current = true;

    // defer to next frame to avoid DOM race
    requestAnimationFrame(() => {
      try {
        // bump remountKey so the whole fragment remounts (this avoids partial node removals)
        setRemountKey((k) => k + 1);
        // clear the answers
        setUsedWords({});
        setSelectedWord(null);
      } finally {
        // release lock shortly after React has applied updates
        setTimeout(() => {
          clearingRef.current = false;
        }, 30);
      }
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <div className="bg-blue-800 text-white px-6 py-3 text-lg font-semibold">
        Sprachbausteine – Teil 2
      </div>
      <div className="bg-yellow-100 px-6 py-3 text-gray-800 text-sm border-b border-gray-300">
        Lesen Sie den Text und entscheiden Sie, welches Wort in welche Lücke passt.
        Sie können jedes Wort nur einmal verwenden. Nicht alle Wörter passen in den Text.
      </div>

      {/* REMOUNT FRAGMENT: using key forces React to replace children nodes */}
      <div key={`sb2_${remountKey}`} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* LEFT: paragraph with blanks */}
        <div className="bg-white shadow rounded-lg p-6 text-gray-900 leading-7">
          <p>
            {parts.map((part, i) => (
              <React.Fragment key={`part_${i}`}>
                {part}
                {i < parts.length - 1 && (
                  <span
                    onClick={() => handleFill(i + 1)}
                    className={`inline-block ml-1 mr-1 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-200 transition ${
                      usedWords[i + 1] ? "text-blue-900 font-semibold bg-blue-100" : "text-gray-500 bg-gray-50"
                    }`}
                  >
                    {usedWords[i + 1] || `...${i + 1}`}
                  </span>
                )}
              </React.Fragment>
            ))}
          </p>

          {/* filled summary */}
          <div className="mt-6 text-sm text-gray-700">
            {Object.keys(usedWords).length > 0 && (
              <div>
                <h3 className="font-semibold mb-1 text-[#004080]">Ihre Auswahl:</h3>
                <ul className="list-disc list-inside">
                  {Object.entries(usedWords).map(([idx, word]) => (
                    <li key={`summary_${idx}`}>
                      {idx}. <span className="font-medium">{word}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: word bank */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="font-semibold text-[#004080] mb-3">
            Wählen Sie ein Wort und klicken Sie auf die Lücke.
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {blanksList.map((word, idx) => {
              const isUsed = Object.values(usedWords).includes(word);
              const isSelected = selectedWord === word;
              return (
                <div
                  key={`word_${idx}_${String(word).slice(0,6)}`}
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
  );
}
