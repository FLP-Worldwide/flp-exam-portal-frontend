"use client";
import { useState } from "react";
import LevelOne from "./LevelOne";
import LabelTwo from "./LevelTwo";
import Lesen3 from "./Lesen3";
import Sprachbausteine1 from "./Sprachbausteine1";
import Sprachbausteine2 from "./Sprachbausteine2";

export default function ExamTabs() {
  const [activeTab, setActiveTab] = useState("lesen1");

  const tabs = [
    { key: "lesen1", label: "Leseverstehen Teil 1" },
    { key: "lesen2", label: "Leseverstehen Teil 2" },
    { key: "lesen3", label: "Leseverstehen Teil 3" },
    { key: "sprache1", label: "Sprachbausteine Teil 1" },
    { key: "sprache2", label: "Sprachbausteine Teil 2" },
  ];

  const renderTable = () => {
    switch (activeTab) {
      case "lesen1":
        return (
          <LevelOne />
        );
      case "lesen2":
        return (
          <LabelTwo />
        );
      case "lesen3":
        return (
          <Lesen3 />
        );
      case "sprache1":
        return (
          <Sprachbausteine1 />
        );
      case "sprache2":
        return (
          <Sprachbausteine2 />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* ---- Tab Section ---- */}
      <div className="w-full bg-[#004080] flex justify-center py-2">
        <div className="flex gap-2 overflow-x-auto px-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-t-md border text-sm font-medium transition-all ${activeTab === tab.key
                  ? "bg-white text-[#004080] border-[#004080]"
                  : "bg-[#004080] text-white border-white hover:bg-blue-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Table Section ---- */}
      <div className="max-w-5xl w-full mt-6 bg-white p-6 rounded-lg shadow-md">
        {renderTable()}
      </div>
    </div>
  );
}
