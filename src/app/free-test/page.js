"use client";

import React, { useState } from "react";
import Link from "next/link";

const questions = [
  {
    id: 1,
    text: "Was passt?\n\nIch habe gestern einen neuen Laptop gekauft, ___ er im Angebot war.",
    options: [
      { value: "a", label: "a) weil" },
      { value: "b", label: "b) damit" },
      { value: "c", label: "c) obwohl" },
    ],
    correct: "a",
  },
  {
    id: 2,
    text: 'Was bedeutet „Veranstaltung“?',
    options: [
      { value: "a", label: "a) ein Treffen oder Event" },
      { value: "b", label: "b) ein Dokument" },
      { value: "c", label: "c) ein Rezept" },
    ],
    correct: "a",
  },
  {
    id: 3,
    text: 'Welche Aussage ist richtig?\n\n„Die Bahn hat Verspätung“ bedeutet…',
    options: [
      { value: "a", label: "a) Der Zug kommt später." },
      { value: "b", label: "b) Der Zug ist zu früh." },
      { value: "c", label: "c) Der Zug fällt aus." },
    ],
    correct: "a",
  },
  {
    id: 4,
    text: "Ergänzen Sie:\n\nMorgen gehe ich zum Arzt, ___ ich seit Tagen Kopfschmerzen habe.",
    options: [
      { value: "a", label: "a) aber" },
      { value: "b", label: "b) weil" },
      { value: "c", label: "c) denn" },
    ],
    correct: "b",
  },
  {
    id: 5,
    text: "Welche Form ist richtig?\n\nWir ___ uns nächste Woche im Café.",
    options: [
      { value: "a", label: "a) treffen" },
      { value: "b", label: "b) getroffen" },
      { value: "c", label: "c) trifft" },
    ],
    correct: "a",
  },
];

export default function FreeTestPage() {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleChange = (qid, value) => {
    if (showResults) return; // lock after submit
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct) correctCount += 1;
    });
    setScore(correctCount);
    setShowResults(true);
  };

  const handleReset = () => {
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const total = questions.length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center px-3 sm:px-4 py-6">
      <div className="w-full max-w-3xl">
        {/* Header / breadcrumb feel */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-xs sm:text-sm text-slate-600 hover:text-blue-600"
          >
            ← Back to Home
          </Link>
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-600 text-xs font-medium text-blue-700 hover:bg-blue-50"
          >
            Login for full tests
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Top banner */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-blue-100">
            <h1 className="text-lg sm:text-2xl font-semibold text-slate-900">
              Free Mini Test – Test Your German in 5 Questions
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
              Beantworte die fünf Fragen und sieh direkt, wie viele du richtig
              hast. Das ist nur ein kleiner Vorgeschmack auf unsere vollständigen
              FLP-Modeltests.
            </p>
          </div>

          {/* Score summary (after submit) */}
          {showResults && (
            <div className="px-4 sm:px-6 pt-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Dein Ergebnis
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {score} / {total} richtig ({percent}%)
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg text-xs sm:text-sm border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                  >
                    Noch einmal testen
                  </button>
                  <Link
                    href="/login"
                    className="px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-blue-600 text-white font-medium hover:bg-blue-700"
                  >
                    Login für mehr Tests
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-5">
            {questions.map((q, idx) => {
              const selected = answers[q.id];
              const isCorrect = showResults && selected === q.correct;
              const isWrong =
                showResults && selected && selected !== q.correct;
              const unanswered = showResults && !selected;

              const statusLabel = isCorrect
                ? "Richtig"
                : isWrong
                ? "Falsch"
                : unanswered
                ? "Keine Antwort"
                : null;

              const statusClass = isCorrect
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isWrong
                ? "bg-red-50 text-red-700 border-red-200"
                : unanswered
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-50 text-slate-500 border-slate-200";

              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-slate-200 bg-white shadow-xs px-3 sm:px-4 py-3 sm:py-4"
                >
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5">
                        Frage {idx + 1}
                      </span>
                    </div>
                    {statusLabel && (
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    )}
                  </div>

                  {/* Question text */}
                  <p className="text-sm sm:text-base text-slate-900 whitespace-pre-line mb-3">
                    {q.text}
                  </p>

                  {/* Options */}
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isSelected = selected === opt.value;
                      const isOptCorrect = showResults && q.correct === opt.value;
                      const isOptWrongSelected =
                        showResults &&
                        selected === opt.value &&
                        opt.value !== q.correct;

                      let optionClasses =
                        "w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm cursor-pointer transition";

                      if (showResults) {
                        if (isOptCorrect) {
                          optionClasses +=
                            " border-emerald-500 bg-emerald-50 text-emerald-900";
                        } else if (isOptWrongSelected) {
                          optionClasses +=
                            " border-red-500 bg-red-50 text-red-900";
                        } else {
                          optionClasses +=
                            " border-slate-200 bg-white text-slate-800 opacity-80";
                        }
                      } else {
                        if (isSelected) {
                          optionClasses +=
                            " border-blue-500 bg-blue-50 text-blue-900";
                        } else {
                          optionClasses +=
                            " border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50";
                        }
                      }

                      return (
                        <label key={opt.value} className={optionClasses}>
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={opt.value}
                            checked={isSelected || false}
                            onChange={() => handleChange(q.id, opt.value)}
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 accent-blue-600"
                            disabled={showResults}
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Correct answer line after results */}
                  {showResults && (
                    <div className="mt-3 text-xs sm:text-sm text-slate-600">
                      <span className="font-semibold">Richtige Antwort: </span>
                      {
                        q.options.find((o) => o.value === q.correct)
                          ?.label
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit button */}
          <div className="px-4 sm:px-6 pb-5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] sm:text-xs text-slate-500 max-w-xs">
              Dieser Mini-Test ist nur ein Beispiel. Für vollständige
              Modellprüfungen mit Lesen, Hören & Schreiben kannst du dich im
              Portal anmelden.
            </p>

            {!showResults ? (
              <button
                onClick={handleSubmit}
                className="px-4 sm:px-6 py-2 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700"
              >
                Auswertung anzeigen
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="px-4 sm:px-6 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                Test zurücksetzen
              </button>
            )}
          </div>
        </div>

        {/* Motivational line */}
        {showResults && (
          <div className="mt-4 text-center text-xs sm:text-sm text-slate-700">
            „Wie viele konntest du lösen? Mit unseren FLP telc-Übungspaketen
            wirst du sicherer, schneller und bereit für deine echte Prüfung.“
          </div>
        )}
      </div>
    </div>
  );
}
