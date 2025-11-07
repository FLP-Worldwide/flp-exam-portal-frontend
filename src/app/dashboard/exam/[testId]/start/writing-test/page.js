'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const TASKS = [
  {
    id: 'A',
    title: 'Aufgabe A: Schriftlicher Ausdruck, Aufgabe A',
    subtitle: 'Bitte um Informationen',
    body: `
In der Zeitung lesen Sie folgende Anzeige:

Secura Versicherungen AG

Alle 4 Sekunden passiert in Deutschland ein Unfall – davon 71 % in der Freizeit und im Haushalt. Sollte Ihnen etwas zustoßen, bietet Ihnen unsere Unfallversicherung Schutz vor finanziellen Risiken. Nur mit einer privaten Unfallversicherung sind Sie auch in Ihrer Freizeit abgesichert. Weltweit und rund um die Uhr!

Unsere Basis-Leistungen
• Unfallrente in vereinbarter Höhe
• Kostenübernahme bei Spezialbehandlungen (auch im Ausland)
• Kostenübernahme für erforderliche Umbaumaßnahmen in Haus/Wohnung

Vorteile der Secura Versicherungen AG
• umfangreiche Leistungen zu einem fairen Preis
• individuelle Beitragshöhe je nach Beruf/Hobbys
• weltweiter Schutz – 365 Tage und rund um die Uhr
• exklusive Extraleistungen
• Rabatt-Möglichkeiten – besonders für Familien

kundendienst@secura-versicherungen.net
    `.trim(),
    instruction: 'Wählen Sie Aufgabe A (Bitte um Informationen) und schreiben Sie eine formelle E-Mail.',
  },
  {
    id: 'B',
    title: 'Aufgabe B: Schriftlicher Ausdruck, Aufgabe B',
    subtitle: 'Beschwerde',
    body: `
Lesen Sie folgende Werbeanzeige:

Jugendcamp Silberstrand

Der Urlaubsspaß für junge Leute

Urlaubsspaß mit internationalem Flair für junge Leute (17–25 Jahre) an einem der herrlichsten deutschen Ostseestrände: komfortable Wohnstudios für jeweils zwei Gäste. Jede Menge Spaß und Action erwarten euch: Beachball, Fußball, Volleyball, Surfen, Segeltouren, Wandern und am Abend tolle Strandpartys mit Livemusik und internationalen Stars in der weithin bekannten Campdisco.

Das alles gibt’s für nur wenig Geld: 380 Euro pro Woche, alles inklusive. Was wollt ihr mehr?

E-Mail: info@silberstrand.de

Sie haben im Jugendcamp Silberstrand zwei Wochen Urlaub gemacht. Leider waren Sie überhaupt nicht zufrieden. Schreiben Sie eine Beschwerde an das Camp.
Behandeln Sie darin entweder
a) drei der folgenden Punkte oder
b) zwei der folgenden Punkte und einen weiteren Aspekt Ihrer Wahl.
    `.trim(),
    instruction: 'Wählen Sie Aufgabe B (Beschwerde) und schreiben Sie eine formelle Beschwerde.',
  },
]

// simple helpers
const pad = (n) => (n < 10 ? `0${n}` : `${n}`)

export default function WritingTest() {
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [texts, setTexts] = useState({ A: '', B: '' })
  const [startedAt, setStartedAt] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(30 * 60) // 30 minutes
  const [saving, setSaving] = useState(false)

  const timerRef = useRef(null)
  const initializedRef = useRef(false)

  // load drafts from localStorage on mount
  useEffect(() => {
    const draftA = localStorage.getItem('writing_A') || ''
    const draftB = localStorage.getItem('writing_B') || ''
    const savedStart = localStorage.getItem('writing_startedAt')
    const savedLeft = localStorage.getItem('writing_secondsLeft')

    setTexts({ A: draftA, B: draftB })

    if (savedStart && savedLeft) {
      setStartedAt(savedStart)
      setSecondsLeft(parseInt(savedLeft, 10) || 30 * 60)
    }
  }, [])

  // start timer once a task opens or first keystroke occurs
  const ensureTimer = () => {
    if (initializedRef.current) return
    initializedRef.current = true
    const nowIso = new Date().toISOString()
    setStartedAt(nowIso)
    localStorage.setItem('writing_startedAt', nowIso)
  }

  // countdown
  useEffect(() => {
    if (!startedAt) return
    // persist every tick
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        const next = s > 0 ? s - 1 : 0
        localStorage.setItem('writing_secondsLeft', String(next))
        return next
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [startedAt])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const timeStr = `${pad(mins)}:${pad(secs)}`

  const level = 'Deutsch - B2'
  const totalPoints = 45

  const activeTask = useMemo(
    () => TASKS.find((t) => t.id === activeTaskId) || null,
    [activeTaskId]
  )

  const handleSelectTask = (id) => {
    setActiveTaskId(id)
    ensureTimer()
  }

  const handleTextChange = (e) => {
    const val = e.target.value
    setTexts((prev) => {
      const next = { ...prev, [activeTaskId]: val }
      // autosave draft
      localStorage.setItem(`writing_${activeTaskId}`, val)
      return next
    })
    ensureTimer()
  }

  const wordCount = useMemo(() => {
    const plain = (texts[activeTaskId || 'A'] || '').trim()
    if (!plain) return 0
    return plain.split(/\s+/).length
  }, [texts, activeTaskId])

  const handleSave = async () => {
    setSaving(true)
    try {
      // client-only demo save (drafts already in localStorage)
      // If you later connect a backend, POST texts + activeTaskId + startedAt + time used.
      await new Promise((r) => setTimeout(r, 400))
      alert('Draft saved locally.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    // demo submit
    const payload = {
      startedAt,
      finishedAt: new Date().toISOString(),
      answers: {
        A: texts.A,
        B: texts.B,
        selected: activeTaskId,
      },
    }
    console.log('SUBMIT payload:', payload)
    alert('Submission captured (see console). Connect POST later as needed.')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Top bar */}
      <div className="mx-auto max-w-6xl bg-[#0d2b57] text-white rounded-2xl shadow-md">
        <div className="flex items-center justify-between px-4 py-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 px-3 py-1 rounded-lg text-sm">
              <span className="font-semibold">Schreiben</span> · Teil 1
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-lg text-sm">
              {totalPoints} Punkte
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm opacity-90">{level}</div>
            <div className="text-sm">
              Remaining time:{' '}
              <span className={`font-semibold ${secondsLeft <= 60 ? 'text-yellow-300' : 'text-white'}`}>
                {timeStr}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              className="bg-[#2563eb] hover:bg-[#1e4fd6] text-white px-4 py-2 rounded-lg"
            >
              Submit
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#0ea5e9] hover:bg-[#0891d1] disabled:bg-sky-400 text-white px-4 py-2 rounded-lg"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="mx-auto max-w-6xl bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
        <p className="text-yellow-900 text-sm">
          Make a quick decision — available time is limited to <strong>30 minutes</strong>.<br />
          <strong>Task A:</strong> Request for information · <strong>Task B:</strong> Complaint
        </p>
      </div>

      {/* Main 2-column area */}
      <div className="mx-auto max-w-6xl mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: tasks */}
        <div className="bg-white rounded-2xl shadow-md p-4 space-y-4">
          {TASKS.map((t) => (
            <div
              key={t.id}
              className={`border rounded-xl p-4 cursor-pointer transition ${
                activeTaskId === t.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSelectTask(t.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">
                  {t.title}
                </h3>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{t.subtitle}</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed max-h-64 overflow-auto">
                {t.body}
              </pre>
            </div>
          ))}
        </div>

        {/* RIGHT: editor */}
        <div className="bg-white rounded-2xl shadow-md p-4 min-h-[520px] flex flex-col">
          {!activeTask ? (
            <div className="flex-1 grid place-items-center text-gray-500">
              <div className="text-center">
                <p className="font-medium">Select a task (A or B) to start writing.</p>
                <p className="text-sm mt-1">Your editor will appear here.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{activeTask.title}</h3>
                <div className="text-sm text-gray-600">
                  Words: <span className="font-semibold">{wordCount}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">{activeTask.instruction}</p>
              <textarea
                value={texts[activeTaskId]}
                onChange={handleTextChange}
                onFocus={ensureTimer}
                className="flex-1 w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Write your text here…"
                spellCheck={true}
              />
              <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                <span>Started: {startedAt ? new Date(startedAt).toLocaleString() : '—'}</span>
                <span>Autosaves to your browser</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
