'use client';
import { useState } from "react";

export default function Sprachbausteine2() {
    const [usedWords, setUsedWords] = useState({});
    const [selectedWord, setSelectedWord] = useState(null);

    const wordBank = [
        "AN", "AUF", "AUFGRUND", "BEHEBEN", "BESCHEIDEN", "DRASTISCH",
        "ERHÖHEN", "FÜR", "IM", "NACH", "RECHNEN", "STATT",
        "STEIGEN", "ÜBERHEBLICH", "UNSCHWER"
    ];

    const handleWordClick = (word) => {
        setSelectedWord(selectedWord === word ? null : word);
    };

    const fillBlank = (num) => {
        if (!selectedWord) return;
        // prevent duplicate use
        if (Object.values(usedWords).includes(selectedWord)) return;
        setUsedWords(prev => ({ ...prev, [num]: selectedWord }));
        setSelectedWord(null);
    };

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
        
            {/* HEADER */}
            <div className="bg-blue-800 text-white px-6 py-3 text-lg font-semibold">
                Sprachbausteine, TEIL 2
            </div>
            <div className="bg-yellow-100 px-6 py-3 text-gray-800 text-sm border-b border-gray-300">
                Lesen Sie den Text und entscheiden Sie, welches Wort in welche Lücke passt.
                Sie können jedes Wort nur einmal verwenden. Nicht alle Wörter passen in den Text.
            </div>

            {/* CONTENT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* LEFT TEXT */}
                <div className="bg-white shadow rounded-lg p-6 text-gray-900 leading-7">
                    <p>
                        Es gibt immer weniger Deutsche<br /><br />
                        <span className="bg-blue-100 px-2 rounded cursor-pointer" onClick={() => fillBlank(1)}>
                            {usedWords[1] || "...1"}
                        </span>{" "}
                        Angaben des Statistischen Bundesamtes in Wiesbaden wird die Bevölkerungszahl in Deutschland
                        in den nächsten Jahrzehnten{" "}
                        <span className="bg-blue-100 px-2 rounded">AUFGRUND</span>{" "}
                        sinken.
                    </p>
                    <p className="mt-4">
                        Die Statistiker{" "}
                        <span className="bg-blue-100 px-2 rounded cursor-pointer" onClick={() => fillBlank(3)}>
                            {usedWords[3] || "...3"}
                        </span>{" "}
                        damit, dass die Zahl der Deutschen bis zum Jahr 2050 von jetzt 82 Millionen
                        auf nur noch 65 Millionen zurückgehen wird.
                    </p>
                    <p className="mt-4">
                        Diese Entwicklung sei, so kommentieren die Statistiker, deswegen so dramatisch,
                        weil sich gleichzeitig mit dem Rückgang der Einwohnerzahl die Altersstruktur Deutschlands
                        sehr stark verändern wird: Fast die Hälfte der Bevölkerung wird dann im Rentenalter sein.
                        Das Gesundheitssystem und die Altersversorgung werden{" "}
                        <span className="bg-blue-100 px-2 rounded cursor-pointer" onClick={() => fillBlank(4)}>
                            {usedWords[4] || "...4"}
                        </span>{" "}
                        dieser Entwicklung vor großen Problemen stehen.
                    </p>
                    <p className="mt-4">
                        Die Auswirkungen auf das politische und gesellschaftliche Leben lassen sich{" "}
                        <span className="bg-blue-100 px-2 rounded cursor-pointer" onClick={() => fillBlank(6)}>
                            {usedWords[6] || "...6"}
                        </span>{" "}
                        erahnen.
                    </p>
                    <p className="mt-4">
                        Wenn nahezu fünfzig Prozent der Bevölkerung Senioren sind, werden sich Politik und
                        Geschäftswelt{" "}
                        <span className="bg-blue-100 px-2 rounded cursor-pointer" onClick={() => fillBlank(7)}>
                            {usedWords[7] || "...7"}
                        </span>{" "}
                        diesen Personenkreis einstellen.
                    </p>
                    <p className="mt-4">
                        Für junge Leute wird sich das Problem ergeben, dass sich Politiker mehr{" "}
                        <span className="bg-blue-100 px-2 rounded cursor-pointer" onClick={() => fillBlank(8)}>
                            {usedWords[8] || "...8"}
                        </span>{" "}
                        die alten Wähler interessieren werden.
                    </p>
                    <p className="mt-4">
                        Die Produktivität der Wirtschaft wird abnehmen, da der größte Teil ihres Einkommens in die
                        Kranken- und Rentenversicherung fließt. Diese Probleme könne man nur{" "}
                        <span className="bg-blue-100 px-2 rounded cursor-pointer" onClick={() => fillBlank(10)}>
                            {usedWords[10] || "...10"}
                        </span>{" "}
                        , so das Statistische Bundesamt.
                    </p>
                </div>

                {/* RIGHT OPTIONS */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-2">
                        {wordBank.map((word) => {
                            const isUsed = Object.values(usedWords).includes(word);
                            const isSelected = selectedWord === word;
                            return (
                                <div
                                    key={word}
                                    onClick={() => handleWordClick(word)}
                                    className={`cursor-pointer text-center py-2 rounded border transition ${isSelected
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
                </div>
            </div>
        </div>
    );
}
