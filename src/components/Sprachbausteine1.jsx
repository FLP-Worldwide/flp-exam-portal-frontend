'use client';
import { useState } from "react";

export default function Sprachbausteine1() {
  const [answers, setAnswers] = useState({});

  const handleSelect = (num, value) => {
    setAnswers(prev => ({ ...prev, [num]: value }));
  };

  const questions = [
    { id: 1, options: ["außerdem", "eigentlich", "überhaupt"] },
    { id: 2, options: ["er", "es", "man"] },
    { id: 3, options: ["der", "dessen", "seiner"] },
    { id: 4, options: ["übersetzen", "überstehen", "übertragen"] },
    { id: 5, options: ["dass", "falls", "ob"] },
    { id: 6, options: ["unternehmen", "verbringen", "verplanen"] },
    { id: 7, options: ["ganz", "recht", "zwar"] },
    { id: 8, options: ["auf", "für", "in"] },
    { id: 9, options: ["bestimmt", "doch", "sicher"] },
    { id: 10, options: ["euch", "sich", "uns"] },
  ];

  return (
    <div className="bg-gray-100 min-h-screen font-sans">

      {/* Section Header */}
      <div className="bg-blue-800 text-white px-6 py-3 text-lg font-semibold">
        Sprachbausteine, TEIL 1
      </div>
      <div className="bg-yellow-100 px-6 py-3 text-gray-800 text-sm border-b border-gray-300">
        Lesen Sie den Text und entscheiden Sie, welches Wort in die jeweilige Lücke passt.
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* LEFT: Text */}
        <div className="bg-white shadow rounded-lg p-6 text-gray-900 leading-7">
          <p>
            Liebe Daniela,<br /><br />
            ich habe schon ein ganz schlechtes Gewissen, denn{" "}
            <span className="inline-block bg-blue-100 text-blue-800 px-2 rounded">1</span>{" "}
            wollte ich dir schon vor zwei Monaten schreiben. Aber du weißt ja, wie das ist:
            Wenn man sich auf eine Prüfung vorbereitet, hat{" "}
            <span className="inline-block bg-blue-100 text-blue-800 px-2 rounded">2</span>{" "}
            überhaupt keine Zeit mehr für seine Hobbys – alles dreht sich nur ums Lernen.
          </p>
          <p className="mt-4">
            Nun habe ich es aber geschafft: Gestern war die Prüfung und ich bin zuversichtlich,
            dass ich sie bestanden habe. Mein Freund, mit{" "}
            <span className="inline-block bg-blue-100 text-blue-800 px-2 rounded">3</span>{" "}
            Hilfe es mir überhaupt nur möglich war, diese ganze Zeit zu{" "}
            <span className="inline-block bg-blue-100 text-blue-800 px-2 rounded">4</span>
            , hat mich für heute Abend in ein tolles Restaurant eingeladen.
          </p>
          <p className="mt-4">
            In deinem letzten Brief hast du mich ja noch gefragt,{" "}
            <span className="inline-block bg-blue-100 text-blue-800 px-2 rounded">5</span>{" "}
            ich Lust hätte, mit dir zusammen ein Wochenende in London zu verbringen.
          </p>
          <p className="mt-4">
            Natürlich habe ich Lust! Nach dem ganzen Stress der letzten Wochen finde ich es super,
            mal wieder etwas Tolles zu{" "}
            <span className="inline-block bg-blue-100 text-blue-800 px-2 rounded">6</span>. London ist eine wunderbare Stadt,
            ich habe schon viele Berichte gelesen. Ich würde mich{" "}
            <span className="inline-block bg-blue-100 text-blue-800 px-2 rounded">7</span>{" "}
            besonders{" "}
            <span className="inline-block bg-blue-100 text-blue-800 px-2 rounded">8</span>{" "}
            die Tate Gallery und das Filmmuseum interessieren.
          </p>
          <p className="mt-4">
            Mach{" "}
            <span className="inline-block bg-blue-100 text-blue-800 px-2 rounded">9</span>{" "}
            einfach ein paar Vorschläge, wann du Zeit hast. Ich bin sicher, dass wir{" "}
            <span className="inline-block bg-blue-100 text-blue-800 px-2 rounded">10</span>{" "}
            auf ein Wochenende einigen können.
          </p>
          <p className="mt-4">Herzliche Grüße</p>
        </div>

        {/* RIGHT: Options */}
        <div className="bg-white shadow rounded-lg p-6">
          {questions.map((q) => (
            <div key={q.id} className="mb-4">
              <div className="font-medium mb-2">{q.id}.</div>
              <div className="flex gap-4 flex-wrap">
                {q.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      checked={answers[q.id] === opt}
                      onChange={() => handleSelect(q.id, opt)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom message area */}
      <div className="bg-white border-t mt-6 p-4 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-600">Meldung:</div>
        <input
          type="text"
          placeholder="Kommentar hier eingeben..."
          className="border border-gray-300 rounded px-3 py-2 w-1/2 text-sm"
        />
      </div>
    </div>
  );
}
