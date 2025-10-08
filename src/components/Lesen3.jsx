"use client";
import { useState } from "react";

export default function Lesen3() {
    const [answers, setAnswers] = useState({});

    const texts = [
        {
            id: "A",
            title: "Reisetermine",
            content:
                "Von Mai bis September. Wer in Göteborg oder Stockholm bleiben will, kann weitere Übernachtungen buchen.",
        },
        {
            id: "B",
            title: "Weitere Infos",
            content:
                "Schweden-Werbung, Lilienstr. 19, D-20095 Hamburg. Tel. 040 / 32 55 13 55. Web: www.gotacanal.se (Reederei).",
        },
        {
            id: "C",
            title: "Laufen für die Forschung",
            content:
                "Straßenlauf in Frankfurt am Main: Alle Teilnehmer haben ihren Sponsor; das Geld stiftet für Aufklärung und Forschung zum Thema Brustkrebs.",
        },
    ];

    const questions = [
        {
            id: 1,
            text: "Ein Bekannter möchte Schweden per Schiff kennenlernen.",
        },
        {
            id: 2,
            text: "Ein Freund möchte sich im Inline-Skaten perfektionieren.",
        },
        {
            id: 3,
            text: "Ein Kollege möchte sich über Gesundheitsrisiken in Ägypten informieren.",
        },
        {
            id: 4,
            text: "Eine Bekannte möchte einen Kurs über Naturkosmetik besuchen.",
        },
        {
            id: 5,
            text: "Ihre 17-jährige Freundin würde gerne armen Menschen in anderen Ländern helfen.",
        },
    ];

    const handleSelect = (qid, tid) => {
        setAnswers({ ...answers, [qid]: tid });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* --- LEFT COLUMN (Reading Texts) --- */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[#004080] mb-2">
                    Leseverstehen – Teil 3
                </h2>
                <p className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm text-gray-700 rounded">
                    Lesen Sie die Texte (A–C) und die Aufgaben (1–5).
                    Welcher Text passt zu welcher Situation?
                    Wählen Sie den passenden Buchstaben.
                </p>

                {texts.map((t) => (
                    <div
                        key={t.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-[#004080]">{t.id}</span>
                            <span className="text-sm text-gray-500">{t.title}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{t.content}</p>
                    </div>
                ))}
            </div>

            {/* --- RIGHT COLUMN (Questions) --- */}
            <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                    <h3 className="font-semibold text-[#004080]">Aufgaben (1–5)</h3>
                    <p className="text-sm text-gray-600">
                        Wählen Sie für jede Situation den passenden Text (A, B oder C).
                    </p>
                </div>

                <div className="space-y-3">
                    {questions.map((q) => (
                        <div
                            key={q.id}
                            className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow transition"
                        >
                            <p className="text-sm font-medium text-gray-800 mb-2">
                                {q.id}. {q.text}
                            </p>
                            <div className="flex gap-2">
                                {texts.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleSelect(q.id, t.id)}
                                        className={`px-3 py-1 border rounded text-sm font-semibold transition ${answers[q.id] === t.id
                                                ? "bg-[#004080] text-white border-[#004080]"
                                                : "border-gray-300 hover:bg-blue-100"
                                            }`}
                                    >
                                        {t.id}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handleSelect(q.id, "x")}
                                    className={`px-3 py-1 border rounded text-sm font-semibold transition ${answers[q.id] === "x"
                                            ? "bg-red-600 text-white border-red-600"
                                            : "border-gray-300 hover:bg-red-100"
                                        }`}
                                >
                                    x
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
