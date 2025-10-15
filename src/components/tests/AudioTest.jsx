'use client'

import { useEffect, useState } from 'react'

export default function ListeningAdmin() {
  const [token, setToken] = useState('')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ id: '', text: '', order: '', enabled: true })
  const [bulkText, setBulkText] = useState('')
  const [media, setMedia] = useState({})
  const [file, setFile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tests/listening/questions', { headers: { 'x-admin-token': token } })
      const data = await res.json()
      if (data.ok) setQuestions(data.items)
    } catch {}
    setLoading(false)
  }

  const loadMedia = async () => {
    try {
      const res = await fetch('/api/tests/listening/media', { cache: 'no-store' })
      const data = await res.json()
      if (data.ok) setMedia(data)
    } catch {}
  }

  const handleInput = e => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const saveQuestion = async () => {
    setIsSaving(true)
    await fetch('/api/tests/listening/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ items: [form] }),
    })
    setForm({ id: '', text: '', order: '', enabled: true })
    await loadQuestions()
    setIsSaving(false)
  }

  const deleteQuestion = async id => {
    await fetch('/api/tests/listening/questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ ids: [id] }),
    })
    loadQuestions()
  }

  const uploadAudio = async () => {
    if (!file) return alert('Select a file first.')
    const fd = new FormData()
    fd.append('file', file)
    await fetch('/api/tests/listening/media', { method: 'POST', headers: { 'x-admin-token': token }, body: fd })
    await loadMedia()
    setFile(null)
  }

  const deleteAudio = async () => {
    if (!confirm('Remove current audio?')) return
    await fetch('/api/tests/listening/media', { method: 'DELETE', headers: { 'x-admin-token': token } })
    await loadMedia()
  }

  useEffect(() => {
    loadMedia()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Listening Test</h2>

        {/* AUDIO SECTION */}
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Test Audio</h3>
          {media.url ? (
            <div className="mb-3">
              <p className="text-sm text-gray-700">
                Current: <strong>{media.filename}</strong> ({new Date(media.updatedAt).toLocaleString()})
              </p>
              <audio controls src={media.url} className="w-full mb-2" />
              <button onClick={deleteAudio} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                Remove Audio
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-3">No audio uploaded yet.</p>
          )}
          <div className="flex items-center gap-3">
            <input type="file" accept="audio/*" onChange={e => setFile(e.target.files?.[0])} className="border p-2 rounded-md" />
            <button onClick={uploadAudio} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              Upload Audio
            </button>
          </div>
        </div>

        {/* ADD QUESTION */}
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Add / Edit Question</h3>
          <input name="id" value={form.id} onChange={handleInput} placeholder="ID (optional)" className="border p-2 rounded-md mb-2 w-full" />
          <textarea name="text" value={form.text} onChange={handleInput} placeholder="Question text..." rows={3} className="border p-2 rounded-md mb-2 w-full" />
          <input name="order" value={form.order} onChange={handleInput} placeholder="Order" className="border p-2 rounded-md mb-2 w-full" />
          <label className="flex items-center gap-2 mb-2">
            <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleInput} /> Enabled
          </label>
          <button onClick={saveQuestion} disabled={isSaving} className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400">
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* QUESTIONS TABLE */}
        <h3 className="font-semibold mb-2">Current Questions</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">Text</th>
                <th className="p-2 text-center">Active</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q.id} className="border-t">
                  <td className="p-2">{q.id}</td>
                  <td className="p-2">{q.text}</td>
                  <td className="p-2 text-center">{q.enabled ? '✅' : '❌'}</td>
                  <td className="p-2 text-center">
                    <button onClick={() => setForm(q)} className="text-blue-600 mr-2">Edit</button>
                    <button onClick={() => deleteQuestion(q.id)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
