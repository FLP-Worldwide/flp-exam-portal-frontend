// "use client";
import { useState } from "react";

export default function LabelTwo() {
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      id: 1,
      text: "Die Deutschen verbringen ihre Freizeit meistens...",
      options: [
        "spontan und ohne Planung.",
        "nach einem festen Wochenplan.",
        "nur im Urlaub.",
      ],
    },
    {
      id: 2,
      text: "Laut Text ist Freizeit heute...",
      options: [
        "eine Zeit für Freunde und Familie.",
        "nur zum Schlafen gedacht.",
        "keine wichtige Lebenszeit.",
      ],
    },
    {
      id: 3,
      text: "Was bedeutet 'Freizeitrituale' laut Text?",
      options: [
        "Feste Gewohnheiten in der Freizeit.",
        "Religiöse Zeremonien.",
        "Zeit für Arbeit und Studium.",
      ],
    },
  ];

  const handleSelect = (id, option) => {
    setAnswers({ ...answers, [id]: option });
  };

  return (
    <div className="space-y-8">
      {/* Reading Text */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-[#004080] mb-4">
          Freizeitrituale in Deutschland
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Freizeit bedeutet für viele Menschen heute nicht nur Ruhe, sondern auch
          Aktivität. Viele Deutsche planen ihre Freizeit genau: Am Samstag wird
          eingekauft oder Sport getrieben, am Sonntag besucht man Freunde oder
          Familie. Diese festen Gewohnheiten werden oft „Freizeitrituale“
          genannt.
        </p>
      </div>

      {/* Questions Section */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div
            key={q.id}
            className="border border-gray-200 rounded-lg p-5 hover:shadow transition bg-white"
          >
            <h3 className="font-semibold text-gray-800 mb-3">
              {q.id}. {q.text}
            </h3>
            <div className="space-y-2">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(q.id, opt)}
                  className={`w-full text-left border px-3 py-2 rounded-md transition ${
                    answers[q.id] === opt
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
