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
    if (opt === null || opt === undefined) return { id: `${prefix}_${idx}`, title: String(opt) };
    if (typeof opt === "string" || typeof opt === "number" || typeof opt === "boolean") {
      const str = String(opt);
      // id derived but not important for UI; title is what we render/store
      return { id: `${str.slice(0, 32).replace(/\s+/g, "_")}_${idx}`, title: str };
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
        const res = await api.get(`/course-test/details/${encodeURIComponent(testId)}?module=reading`);
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
          const paragraphs = Array.isArray(content.paragraphs) ? content.paragraphs : [];

          // compute module-level topOptions once and store titles array
          const topOptionsRaw = Array.isArray(content.options) ? content.options : null;
          const topOptions = topOptionsRaw ? topOptionsRaw.map((o, i) => normalizeOption(o, i, `${modKey}_topopt`)) : null;
          moduleOptsMap[tabKey] = topOptions ? dedupeTitles(topOptions.map((t) => t.title)) : null;

          paragraphs.forEach((p, pIdx) => {
            const baseId = `${modKey}_p${pIdx}`;

            // CASE: MCQ set inside paragraph (questions array)
            if (Array.isArray(p.questions) && p.questions.length > 0) {
              p.questions.forEach((qObj, qIdx) => {
                const qId = qObj.questionId ?? qObj._qid ?? `${baseId}_q${qIdx}`;
                const text = (qObj.question ?? qObj.prompt ?? p.paragraph ?? "").toString();

                // prefer per-question options; if not present, leave empty so UI uses moduleOptions
                const options = Array.isArray(qObj.options) && qObj.options.length > 0
                  ? qObj.options.map((o, i) => normalizeOption(o, i, `${qId}_opt`))
                  : [];

                grouped[tabKey].push({
                  _id: qId,
                  type: "mcq",
                  text,
                  options, // array of {id,title} — strictSanitize will convert to strings
                  raw: qObj,
                  parentParagraph: p.paragraph ? String(p.paragraph) : null,
                });
              });
              return;
            }

            // CASE: blanks
            if (Array.isArray(p.blanks) && p.blanks.length > 0) {
              const blanks = p.blanks.map((b, bi) => {
                const bid = (b && (b.questionId ?? b._qid)) ?? `${baseId}_blanks_${bi}`;
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
                blanks,
                raw: p,
                parentParagraph: p.paragraph ? String(p.paragraph) : null,
              });
              return;
            }

            // CASE: simple paragraph
            if (p.paragraph) {
              const qId = p.questionId ?? p._qid ?? `${baseId}_para`;
              grouped[tabKey].push({
                _id: qId,
                type: "para",
                text: String(p.paragraph ?? ""),
                paragraph: String(p.paragraph ?? ""),
                options: [], // intentionally empty: moduleOptions used for pool
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

  // prepare initial answers for the tab (map answers object into child's expected shape)
  const getInitialAnswersForTab = (tabKey) => {
    const list = questionsByTab[tabKey] || [];
    const result = {};
    list.forEach((q) => {
      if (answers[q._id] !== undefined) result[q._id] = answers[q._id];
    });
    return result;
  };

  /**
   * onSubmitLevel receives answersForLevel keyed by questionId -> selectedTitle
   * (children should pass that shape). We merge into local answers and persist.
   */
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

    // if last reading tab, go to writing module
    if (tabKey === "sprache2") {
      setLoading(true);
      try {
        localStorage.setItem(`exam_active_module_${testId}`, "writing");
      } catch {}
      router.push(`/dashboard/exam/${testId}/start/writing`);
      return;
    }

    if (next) setActiveTab(next.key);
  };

  // ---------- STRICT SANITIZE (child-friendly primitives) ----------
  // ---------- STRICT SANITIZE (child-friendly primitives) ----------
function strictSanitizeToPrimitives(item) {
  if (!item || typeof item !== "object") return item;

  const out = {};

  out._id = String(item._id ?? item.id ?? "no_id");
  out.type = String(item.type ?? "unknown");

  // TEXT: prefer text-like fields
  out.text = item.text != null ? String(item.text) : (item.question != null ? String(item.question) : "");
  
  // PARAGRAPH: prefer explicit paragraph, then parentParagraph, then nested raw paths
  const paragraphFromRaw =
    item.raw?.paragraph ??
    item.raw?.parentParagraph ??
    (item.raw?.content && (item.raw.content.paragraph ?? (Array.isArray(item.raw.content.paragraphs) && item.raw.content.paragraphs[0]?.paragraph)))
    ?? null;
  out.paragraph = item.paragraph != null
    ? String(item.paragraph)
    : (item.parentParagraph != null
      ? String(item.parentParagraph)
      : (paragraphFromRaw != null ? String(paragraphFromRaw) : ""));

  // convert item.options (array of {id,title}) -> array of titles (strings) for child UI
  if (Array.isArray(item.options)) {
    out.options = item.options.map((o) => {
      if (o && typeof o === "object") return String(o.title ?? o.id ?? JSON.stringify(o));
      return String(o);
    });
  } else {
    out.options = [];
  }

  // blanks -> array of arrays of strings (titles)
  if (Array.isArray(item.blanks)) {
    out.blanks = item.blanks.map((b) => {
      if (Array.isArray(b.options)) {
        return b.options.map((o) => (o && typeof o === "object" ? String(o.title ?? o.id ?? JSON.stringify(o)) : String(o)));
      }
      if (b.answer != null) return [String(b.answer)];
      return [];
    });
  } else {
    out.blanks = [];
  }

  out._debugRaw = item.raw ? (typeof item.raw === "string" ? item.raw : JSON.stringify(item.raw).slice(0, 200)) : "";

  return out;
}


  // ---------- RENDER ACTIVE ----------
  const renderActive = () => {
    const Comp = tabComponents[activeTab];
    if (!Comp) return <div>Component not found for {activeTab}</div>;

    const rawQuestions = questionsByTab[activeTab] || [];
    const strictQuestions = rawQuestions.map((it) => strictSanitizeToPrimitives(it));

    // moduleOptions for this tab (titles array) — child components should use this pool
    const moduleOpts = moduleOptionsByTab[activeTab] ?? [];

    return (
      <>
        <Comp
          questions={strictQuestions}
          initialAnswers={getInitialAnswersForTab(activeTab)}
          moduleOptions={moduleOpts} // NEW prop: single pool for this tab
          disabled={isTabDisabled(activeTab)}
          onSubmitLevel={(answersForLevel) => onSubmitLevel(activeTab, answersForLevel)}
          testId={testId}
        />
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
