"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import api from "../utils/axios";
import { useRouter } from "next/navigation";
import LevelOne from "./LevelOne";
import LabelTwo from "./LevelTwo";
import Lesen3 from "./Lesen3";
import Sprachbausteine1 from "./Sprachbausteine1";
import Sprachbausteine2 from "./Sprachbausteine2";
import { CheckCircleOutlined } from "@ant-design/icons";

/**
 * ExamTabs (full) — fixes duplicated Answer Pool issue by:
 *  - extracting module-level options once per tab and passing them as `moduleOptions`
 *  - keeping question-level options local to each question
 *  - using server-provided questionId when available as the `_id`
 *  - strictSanitize returns only primitives (strings/arrays of strings) for children
 */

export default function ExamTabs() {
  const { testId } = useParams();
  const lastFetchedTestRef = useRef(null);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("lesen1");
  const [loading, setLoading] = useState(false);

  // questions grouped by tab (each item keeps raw and other fields)
  const [questionsByTab, setQuestionsByTab] = useState({
    lesen1: [],
    lesen2: [],
    lesen3: [],
    sprache1: [],
    sprache2: [],
  });

  // module-level options (deduped) — stored as array of option titles (strings),
  // so child components can render the Answer Pool simply.
  const [moduleOptionsByTab, setModuleOptionsByTab] = useState({
    lesen1: null,
    lesen2: null,
    lesen3: null,
    sprache1: null,
    sprache2: null,
  });

  // answers saved locally keyed by questionId -> selected option title
  const [answers, setAnswers] = useState(() => {
    try {
      if (!testId) return {};
      const raw = localStorage.getItem(`exam_answers_${testId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // track which tabs completed
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
    { key: "lesen1", label: "Level 1" },
    { key: "lesen2", label: "Level 2" },
    { key: "lesen3", label: "Level 3" },
    { key: "sprache1", label: "Level 4" },
    { key: "sprache2", label: "Level 5" },
  ];

  const tabComponents = {
    lesen1: LevelOne,
    lesen2: LabelTwo,
    lesen3: Lesen3,
    sprache1: Sprachbausteine1,
    sprache2: Sprachbausteine2,
  };

  // map server level keys to tabs
  const levelToTab = {
    level_1: "lesen1",
    level_2: "lesen2",
    level_3: "lesen3",
    level_4: "sprache1",
    level_5: "sprache2",
  };

  // ---------- helpers ----------
  // normalize option into { id, title }
  const normalizeOption = (opt, idx, prefix = "opt") => {
    if (opt === null || opt === undefined)
      return { id: `${prefix}_${idx}`, title: String(opt) };
    if (
      typeof opt === "string" ||
      typeof opt === "number" ||
      typeof opt === "boolean"
    ) {
      const str = String(opt);
      return {
        id: `${str.slice(0, 32).replace(/\s+/g, "_")}_${idx}`,
        title: str,
      };
    }
    if (typeof opt === "object") {
      const id = opt.id ?? opt._id ?? opt.value ?? `${prefix}_${idx}`;
      const title = opt.title ?? opt.text ?? opt.label ?? JSON.stringify(opt);
      return { id: String(id), title: String(title) };
    }
    return { id: `${prefix}_${idx}`, title: String(opt) };
  };

  const dedupeTitles = (arr) => {
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    const out = [];
    for (const it of arr) {
      const t = String(it).trim();
      if (!t) continue;
      if (!seen.has(t)) {
        seen.add(t);
        out.push(t);
      }
    }
    return out;
  };

  // ---------- FETCH & NORMALIZE ----------
  useEffect(() => {
    if (!testId) return;
    if (lastFetchedTestRef.current === testId) return;

    let cancelled = false;

    async function fetchQuestions() {
      setLoading(true);
      try {
        const res = await api.get(
          `/course-test/details/${encodeURIComponent(testId)}?module=reading`
        );
        const payload =
          (res && res.data && res.data.data) ||
          (res && res.data) ||
          res ||
          null;
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
            setModuleOptionsByTab({
              lesen1: null,
              lesen2: null,
              lesen3: null,
              sprache1: null,
              sprache2: null,
            });
            lastFetchedTestRef.current = testId;
          }
          return;
        }

        const grouped = {
          lesen1: [],
          lesen2: [],
          lesen3: [],
          sprache1: [],
          sprache2: [],
        };

        const moduleOptsMap = {
          lesen1: null,
          lesen2: null,
          lesen3: null,
          sprache1: null,
          sprache2: null,
        };

        // iterate modules
        Object.entries(modules).forEach(([modKey, modVal]) => {
          const tabKey = levelToTab[modKey];
          if (!tabKey) return;
          const content = modVal?.content || {};
          const paragraphs = Array.isArray(content.paragraphs)
            ? content.paragraphs
            : [];

          // compute module-level topOptions once and store titles array
          const topOptionsRaw = Array.isArray(content.options)
            ? content.options
            : null;
          const topOptions = topOptionsRaw
            ? topOptionsRaw.map((o, i) =>
                normalizeOption(o, i, `${modKey}_topopt`)
              )
            : null;
          moduleOptsMap[tabKey] = topOptions
            ? dedupeTitles(topOptions.map((t) => t.title))
            : null;

          paragraphs.forEach((p, pIdx) => {
            const baseId = `${modKey}_p${pIdx}`;

            // CASE: MCQ set inside paragraph (questions array)
            if (Array.isArray(p.questions) && p.questions.length > 0) {
              p.questions.forEach((qObj, qIdx) => {
                const qId =
                  qObj.questionId ?? qObj._qid ?? `${baseId}_q${qIdx}`;
                const text = (
                  qObj.question ??
                  qObj.prompt ??
                  p.paragraph ??
                  ""
                ).toString();

                const options =
                  Array.isArray(qObj.options) && qObj.options.length > 0
                    ? qObj.options.map((o, i) =>
                        normalizeOption(o, i, `${qId}_opt`)
                      )
                    : [];

                grouped[tabKey].push({
                  _id: qId,
                  type: "mcq",
                  text,
                  options,
                  raw: qObj,
                  parentParagraph: p.paragraph
                    ? String(p.paragraph)
                    : null,
                });
              });
              return;
            }

            // CASE: blanks
            if (Array.isArray(p.blanks) && p.blanks.length > 0) {
              const blanks = p.blanks.map((b, bi) => {
                const bid =
                  (b && (b.questionId ?? b._qid)) ??
                  `${baseId}_blanks_${bi}`;
                if (typeof b === "string" || typeof b === "number") {
                  const opt = normalizeOption(
                    String(b),
                    0,
                    `${bid}_opt`
                  );
                  return {
                    id: bid,
                    options: [opt],
                    answer: opt.title,
                    raw: b,
                  };
                }
                if (typeof b === "object") {
                  const rawOpts = Array.isArray(b.options) ? b.options : [];
                  const normalizedOpts = rawOpts.map((o, i) =>
                    normalizeOption(o, i, `${bid}_opt`)
                  );
                  const answerRaw = b.answer ?? null;
                  let answerTitle = null;
                  if (answerRaw != null) {
                    const found = normalizedOpts.find(
                      (no) =>
                        String(no.title) === String(answerRaw)
                    );
                    if (found) answerTitle = found.title;
                    else {
                      const foundById = normalizedOpts.find(
                        (no) =>
                          String(no.id) === String(answerRaw)
                      );
                      if (foundById) answerTitle = foundById.title;
                    }
                  }
                  return {
                    id: bid,
                    options: normalizedOpts,
                    answer: answerTitle,
                    raw: b,
                  };
                }
                const opt = normalizeOption(
                  String(b),
                  0,
                  `${bid}_opt`
                );
                return {
                  id: bid,
                  options: [opt],
                  answer: opt.title,
                  raw: b,
                };
              });

              grouped[tabKey].push({
                _id: `${baseId}_blanks`,
                type: "blanks",
                text: p.paragraph ? String(p.paragraph) : "",
                paragraph: p.paragraph ? String(p.paragraph) : "",
                blanks,
                raw: p,
                parentParagraph: p.paragraph
                  ? String(p.paragraph)
                  : null,
              });
              return;
            }

            // CASE: simple paragraph
            if (p.paragraph) {
              const qId =
                p.questionId ?? p._qid ?? `${baseId}_para`;
              grouped[tabKey].push({
                _id: qId,
                type: "para",
                text: String(p.paragraph ?? ""),
                paragraph: String(p.paragraph ?? ""),
                options: [],
                answer: p.answer ?? null,
                raw: p,
                parentParagraph: p.paragraph
                  ? String(p.paragraph)
                  : null,
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
          setQuestionsByTab((_) => grouped);
          setModuleOptionsByTab((_) => moduleOptsMap);
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
        localStorage.setItem(
          `exam_answers_${testId}`,
          JSON.stringify(merged)
        );
      } catch (e) {
        console.warn("Could not persist answers", e);
      }
      return merged;
    });

    setCompletedTabs((prev) => {
      if (prev.includes(tabKey)) return prev;
      const updated = [...prev, tabKey];
      try {
        localStorage.setItem(
          `exam_completed_${testId}`,
          JSON.stringify(updated)
        );
      } catch {}
      return updated;
    });

    const idx = tabs.findIndex((t) => t.key === tabKey);
    const next = tabs[idx + 1];

    if (tabKey === "sprache2") {
      setLoading(true);
      try {
        localStorage.setItem(
          `exam_active_module_${testId}`,
          "writing"
        );
      } catch {}
      router.push(`/dashboard/exam/${testId}/start/writing`);
      return;
    }

    if (next) setActiveTab(next.key);
  };

  // ---------- STRICT SANITIZE ----------
  function strictSanitizeToPrimitives(item) {
    if (!item || typeof item !== "object") return item;

    const out = {};

    out._id = String(item._id ?? item.id ?? "no_id");
    out.type = String(item.type ?? "unknown");

    out.text =
      item.text != null
        ? String(item.text)
        : item.question != null
        ? String(item.question)
        : "";

    const paragraphFromRaw =
      item.raw?.paragraph ??
      item.raw?.parentParagraph ??
      (item.raw?.content &&
        (item.raw.content.paragraph ??
          (Array.isArray(item.raw.content.paragraphs) &&
            item.raw.content.paragraphs[0]?.paragraph))) ??
      null;

    out.paragraph =
      item.paragraph != null
        ? String(item.paragraph)
        : item.parentParagraph != null
        ? String(item.parentParagraph)
        : paragraphFromRaw != null
        ? String(paragraphFromRaw)
        : "";

    out.answer =
      item.answer != null
        ? String(item.answer)
        : item.raw && item.raw.answer != null
        ? String(item.raw.answer)
        : "";

    if (Array.isArray(item.options)) {
      out.options = item.options.map((o) => {
        if (o && typeof o === "object")
          return String(o.title ?? o.id ?? JSON.stringify(o));
        return String(o);
      });
    } else {
      out.options = [];
    }

    if (Array.isArray(item.blanks)) {
      out.blanks = item.blanks.map((b) => {
        if (Array.isArray(b.options)) {
          return b.options.map((o) =>
            o && typeof o === "object"
              ? String(o.title ?? o.id ?? JSON.stringify(o))
              : String(o)
          );
        }
        if (b.answer != null) return [String(b.answer)];
        return [];
      });
    } else {
      out.blanks = [];
    }

    out._debugRaw = item.raw
      ? typeof item.raw === "string"
        ? item.raw
        : JSON.stringify(item.raw).slice(0, 200)
      : "";

    return out;
  }

  // ---------- RENDER ACTIVE ----------
  const renderActive = () => {
    const Comp = tabComponents[activeTab];
    if (!Comp) return <div>Component not found for {activeTab}</div>;

    const rawQuestions = questionsByTab[activeTab] || [];
    const strictQuestions = rawQuestions.map((it) =>
      strictSanitizeToPrimitives(it)
    );

    const moduleOpts = moduleOptionsByTab[activeTab] ?? [];

    return (
      <Comp
        questions={strictQuestions}
        initialAnswers={getInitialAnswersForTab(activeTab)}
        moduleOptions={moduleOpts}
        disabled={isTabDisabled(activeTab)}
        onSubmitLevel={(answersForLevel) =>
          onSubmitLevel(activeTab, answersForLevel)
        }
        testId={testId}
      />
    );
  };

  // ---------- JSX (beautified) ----------
  return (
    <div className="min-h-screen bg-slate-50 flex justify-center px-2 sm:px-4 py-4 sm:py-6">
      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
                Reading Module – Exam
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Complete each level in sequence. Your answers are saved locally
                per test.
              </p>
            </div>
            {testId && (
              <div className="text-[11px] sm:text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 self-start sm:self-auto">
                Test ID: <span className="font-mono">{String(testId)}</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="px-3 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/60">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const disabled = isTabDisabled(tab.key);
                const completed = completedTabs.includes(tab.key);
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => !disabled && setActiveTab(tab.key)}
                    disabled={disabled}
                    className={`whitespace-nowrap px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm border transition-all flex items-center gap-1 ${
                      isActive
                        ? "bg-white text-[#004080] border-[#004080] shadow-sm"
                        : disabled
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-slate-900 text-slate-50 border-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {completed && (
                      <CheckCircleOutlined
                        className="text-emerald-300 text-[12px]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="bg-slate-50 px-3 sm:px-6 pb-5 pt-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5 min-h-[260px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-500 text-sm">
                  <div className="w-8 h-8 border-2 border-slate-300 border-t-[#004080] rounded-full animate-spin" />
                  <span>Loading questions…</span>
                </div>
              ) : (
                renderActive()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
