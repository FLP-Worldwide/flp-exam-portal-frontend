"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import api from "../utils/axios";

import LevelOne from "./LevelOne";
import LabelTwo from "./LevelTwo";
import Lesen3 from "./Lesen3";
import Sprachbausteine1 from "./Sprachbausteine1";
import Sprachbausteine2 from "./Sprachbausteine2";

/**
 * Revised ExamTabs.jsx — strict sanitize to only primitives / arrays of strings are passed to children.
 * This will eliminate "Objects are not valid as a React child" runtime errors.
 */

export default function ExamTabs() {
  const { testId } = useParams();
  const lastFetchedTestRef = useRef(null);

  const [activeTab, setActiveTab] = useState("lesen1");
  const [loading, setLoading] = useState(false);
  const [questionsByTab, setQuestionsByTab] = useState({
    lesen1: [],
    lesen2: [],
    lesen3: [],
    sprache1: [],
    sprache2: [],
  });

  const [answers, setAnswers] = useState(() => {
    try {
      if (!testId) return {};
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [completedTabs, setCompletedTabs] = useState(() => {
    try {
      if (!testId) return [];
      const raw = localStorage.getItem(`exam_completed_${testId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const tabs = [
    { key: "lesen1", label: "Leseverstehen Teil 1" },
    { key: "lesen2", label: "Leseverstehen Teil 2" },
    { key: "lesen3", label: "Leseverstehen Teil 3" },
    { key: "sprache1", label: "Sprachbausteine Teil 1" },
    { key: "sprache2", label: "Sprachbausteine Teil 2" },
  ];

  const tabComponents = {
    lesen1: LevelOne,
    lesen2: LabelTwo,
    lesen3: Lesen3,
    sprache1: Sprachbausteine1,
    sprache2: Sprachbausteine2,
  };

  // ---------- FETCH & NORMALIZE ----------
  useEffect(() => {
    if (!testId) return;
    if (lastFetchedTestRef.current === testId) return;

    let cancelled = false;

    async function fetchQuestions() {
      setLoading(true);
      try {
        const res = await api.get(`/course-test/details/${testId}?module=reading`);
        const payload = (res && res.data && res.data.data) || (res && res.data) || res || null;
        const modules = payload?.modules || payload?.data?.modules || null;
        if (!modules) {
          if (!cancelled) {
            setQuestionsByTab({
              lesen1: [],
              lesen2: [],
              lesen3: [],
              sprache1: [],
              sprache2: [],
            });
            lastFetchedTestRef.current = testId;
          }
          return;
        }

        const levelToTab = {
          level_1: "lesen1",
          level_2: "lesen2",
          level_3: "lesen3",
          level_4: "sprache1",
          level_5: "sprache2",
        };

        const normalizeOption = (opt, idx, prefix = "opt") => {
          if (opt === null || opt === undefined) return { id: `${prefix}_${idx}`, title: String(opt) };
          if (typeof opt === "string" || typeof opt === "number" || typeof opt === "boolean") {
            return { id: `${String(opt).slice(0, 6)}_${idx}`, title: String(opt) };
          }
          if (typeof opt === "object") {
            const id = opt.id ?? opt._id ?? `${prefix}_${idx}`;
            const title = opt.title ?? opt.text ?? opt.label ?? JSON.stringify(opt);
            return { id: String(id), title: String(title) };
          }
          return { id: `${prefix}_${idx}`, title: String(opt) };
        };

        const grouped = {
          lesen1: [],
          lesen2: [],
          lesen3: [],
          sprache1: [],
          sprache2: [],
        };

        Object.entries(modules).forEach(([modKey, modVal]) => {
          const tabKey = levelToTab[modKey];
          if (!tabKey) return;
          const content = modVal?.content || {};
          const paragraphs = Array.isArray(content.paragraphs) ? content.paragraphs : [];
          const topOptions = Array.isArray(content.options) ? content.options.map((o, i) => normalizeOption(o, i, `${modKey}_topopt`)) : null;

          paragraphs.forEach((p, pIdx) => {
            const baseId = `${modKey}_p${pIdx}`;

            // CASE: questions array (level_2)
            if (Array.isArray(p.questions) && p.questions.length > 0) {
              p.questions.forEach((qObj, qIdx) => {
                const qId = `${baseId}_q${qIdx}`;
                const text = (qObj.question ?? qObj.prompt ?? p.paragraph ?? "").toString();
                const options = Array.isArray(qObj.options)
                  ? qObj.options.map((o, i) => normalizeOption(o, i, `${qId}_opt`))
                  : topOptions ?? [];
                grouped[tabKey].push({
                  _id: qId,
                  type: "mcq",
                  text,
                  options, // array of {id,title}
                  raw: qObj,
                  parentParagraph: p.paragraph ? String(p.paragraph) : null,
                });
              });
              return;
            }

            // CASE: blanks (level_4 / level_5)
            if (Array.isArray(p.blanks) && p.blanks.length > 0) {
              const blanks = p.blanks.map((b, bi) => {
                const bid = `${baseId}_b${bi}`;
                if (typeof b === "string" || typeof b === "number") {
                  const opt = normalizeOption(String(b), 0, `${bid}_opt`);
                  return { id: bid, options: [opt], answer: opt.title, raw: b };
                }
                if (typeof b === "object") {
                  const rawOpts = Array.isArray(b.options) ? b.options : [];
                  const normalizedOpts = rawOpts.map((o, i) => normalizeOption(o, i, `${bid}_opt`));
                  const answerRaw = b.answer ?? null;
                  let answerTitle = null;
                  if (answerRaw != null) {
                    const found = normalizedOpts.find((no) => String(no.title) === String(answerRaw));
                    if (found) answerTitle = found.title;
                    else {
                      const foundById = normalizedOpts.find((no) => String(no.id) === String(answerRaw));
                      if (foundById) answerTitle = foundById.title;
                    }
                  }
                  return { id: bid, options: normalizedOpts, answer: answerTitle, raw: b };
                }
                const opt = normalizeOption(String(b), 0, `${bid}_opt`);
                return { id: bid, options: [opt], answer: opt.title, raw: b };
              });

              grouped[tabKey].push({
                _id: `${baseId}_blanks`,
                type: "blanks",
                text: p.paragraph ? String(p.paragraph) : "",
                paragraph: p.paragraph ? String(p.paragraph) : "",
                blanks, // array of objects currently
                raw: p,
                parentParagraph: p.paragraph ? String(p.paragraph) : null,
              });
              return;
            }

            // CASE: simple paragraph (level_1 etc)
            if (p.paragraph) {
              const qId = `${baseId}_para`;
              grouped[tabKey].push({
                _id: qId,
                type: "para",
                text: String(p.paragraph ?? ""),
                paragraph: String(p.paragraph ?? ""),
                options: topOptions ?? [],
                answer: p.answer ?? null,
                raw: p,
                parentParagraph: p.paragraph ? String(p.paragraph) : null,
              });
              return;
            }

            // fallback
            grouped[tabKey].push({
              _id: `${baseId}_unknown`,
              type: "unknown",
              text: String(p ?? ""),
              raw: p,
            });
          });
        });

        if (!cancelled) {
          setQuestionsByTab(grouped);
          lastFetchedTestRef.current = testId;
        }
      } catch (err) {
        console.error("Failed to fetch questions:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchQuestions();
    return () => {
      cancelled = true;
    };
  }, [testId]);

  // ---------- HELPERS ----------
  const isTabDisabled = (tabKey) => {
    if (tabKey === tabs[0].key) return false;
    const idx = tabs.findIndex((t) => t.key === tabKey);
    const prev = tabs[idx - 1]?.key;
    return !completedTabs.includes(prev);
  };

  const getInitialAnswersForTab = (tabKey) => {
    const list = questionsByTab[tabKey] || [];
    const result = {};
    list.forEach((q) => {
      if (answers[q._id] !== undefined) result[q._id] = answers[q._id];
    });
    return result;
  };

  const onSubmitLevel = (tabKey, answersForLevel) => {
    setAnswers((prev) => {
      const merged = { ...(prev || {}), ...(answersForLevel || {}) };
      try {
        localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
      } catch (e) {
        console.warn("Could not persist answers", e);
      }
      return merged;
    });

    setCompletedTabs((prev) => {
      if (prev.includes(tabKey)) return prev;
      const updated = [...prev, tabKey];
      try {
        localStorage.setItem(`exam_completed_${testId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const idx = tabs.findIndex((t) => t.key === tabKey);
    const next = tabs[idx + 1];
    if (next) setActiveTab(next.key);
  };

  // ---------- STRICT SANITIZE (only strings / arrays of strings) ----------
  function strictSanitizeToPrimitives(item) {
    if (!item || typeof item !== "object") return item;

    const out = {};

    out._id = String(item._id ?? item.id ?? "no_id");
    out.type = String(item.type ?? "unknown");

    // text/paragraph must be strings
    out.text = item.text != null ? String(item.text) : "";
    out.paragraph = item.paragraph != null ? String(item.paragraph) : "";

    // options: convert to array of option titles (strings)
    if (Array.isArray(item.options)) {
      out.options = item.options.map((o) => {
        if (o && typeof o === "object") return String(o.title ?? o.id ?? JSON.stringify(o));
        return String(o);
      });
    } else {
      out.options = [];
    }

    // blanks: convert to flat array of strings representing each blank's option titles (if options exist)
    if (Array.isArray(item.blanks)) {
      out.blanks = item.blanks.map((b) => {
        // b.options may be array of objects -> convert to titles
        if (Array.isArray(b.options)) {
          return b.options.map((o) => (o && typeof o === "object" ? String(o.title ?? o.id ?? JSON.stringify(o)) : String(o)));
        }
        // if no options, maybe answer primitive
        if (b.answer != null) return [String(b.answer)];
        return [];
      });
    } else {
      out.blanks = [];
    }

    // also include a safe rawText for debugging (stringified small)
    out._debugRaw = item.raw ? (typeof item.raw === "string" ? item.raw : JSON.stringify(item.raw).slice(0, 200)) : "";

    return out;
  }

  // ---------- RENDER ACTIVE ----------
  const renderActive = () => {
    const Comp = tabComponents[activeTab];
    if (!Comp) return <div>Component not found for {activeTab}</div>;

    const rawQuestions = questionsByTab[activeTab] || [];
    const strictQuestions = rawQuestions.map((it) => strictSanitizeToPrimitives(it));

    // debug panel
    const DebugJSON = () => (
      <details className="mt-3 text-xs text-gray-500">
        <summary className="cursor-pointer">Debug: strictQuestions (click to view)</summary>
        <pre className="max-h-56 overflow-auto text-xs bg-gray-50 p-2 rounded">
          {JSON.stringify(strictQuestions, null, 2)}
        </pre>
      </details>
    );

    return (
      <>
        <Comp
          questions={strictQuestions}
          initialAnswers={getInitialAnswersForTab(activeTab)}
          disabled={isTabDisabled(activeTab)}
          onSubmitLevel={(answersForLevel) => onSubmitLevel(activeTab, answersForLevel)}
          testId={testId}
        />
        <DebugJSON />
      </>
    );
  };

  // ---------- JSX ----------
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full bg-[#004080] flex justify-center py-2">
        <div className="flex gap-2 overflow-x-auto px-2">
          {tabs.map((tab) => {
            const disabled = isTabDisabled(tab.key);
            const completed = completedTabs.includes(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => !disabled && setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-t-md border text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-[#004080] border-[#004080]"
                    : disabled
                    ? "bg-[#004080] text-gray-300 border-white cursor-not-allowed"
                    : "bg-[#004080] text-white border-white hover:bg-blue-700"
                }`}
                disabled={disabled}
              >
                {tab.label}
                {completed && <span className="ml-2 text-xs text-green-200">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-5xl w-full mt-6 bg-white p-6 rounded-lg shadow-md">
        {loading ? <div>Loading questions...</div> : renderActive()}
      </div>
    </div>
  );
}
