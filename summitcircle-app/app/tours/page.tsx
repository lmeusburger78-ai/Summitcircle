'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'

export default function ToursPage() {
  const [user, setUser] = useState<any>(null)
  const [tours, setTours] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Form Felder
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [activityType, setActivityType] = useState('hiking')
  const [difficulty, setDifficulty] = useState('beginner')
  const [startDate, setStartDate] = useState('')
  const [startLocation, setStartLocation] = useState('')
  const [maxParticipants, setMaxParticipants] = useState(10)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = '/login'
        return
      }
      setUser(data.user)
      loadTours()
    })
  }, [])

  async function loadTours() {
    const supabase = createClient()
    const { data } = await supabase
      .from('tours')
      .select(`
        *,
        creator:profiles!tours_creator_id_fkey(id, username, full_name)
      `)
      .eq('status', 'open')
      .order('start_date', { ascending: true })

    setTours(data || [])
  }

  async function handleCreateTour() {
    if (!title.trim() || !startDate) {
      setMessage('Bitte Titel und Datum ausfüllen!')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('tours')
      .insert({
        creator_id: user.id,
        title: title.trim(),
        description: description.trim(),
        activity_type: activityType,
        difficulty: difficulty,
        start_date: startDate,
        start_location: startLocation.trim(),
        max_participants: maxParticipants,
        status: 'open',
      })

    if (error) {
      setMessage('Fehler: ' + error.message)
    } else {
      setMessage('Tour erstellt! 🎉')
      setShowForm(false)
      setTitle('')
      setDescription('')
      setStartDate('')
      setStartLocation('')
      loadTours()
    }
    setLoading(false)
  }

  const activityLabels: any = {
    hiking: '🥾 Wandern',
    mountaineering: '🏔️ Bergsteigen',
    climbing: '🧗 Klettern',
    ski_touring: '⛷️ Skitour',
    freeriding: '🎿 Freeriding',
  }

  const difficultyLabels: any = {
    beginner: '🟢 Anfänger',
    intermediate: '🟡 Mittel',
    advanced: '🟠 Fortgeschritten',
    expert: '🔴 Experte',
  }

  return (
    <div style={{
      backgroundColor: '#0f1a0f',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      color: '#e8f5e8',
    }}>
      {/* Navigation */}
      <nav style={{
        backgroundColor: '#162016',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #2a3d2a',
      }}>
        <a href="/" style={{ color: '#4CAF50', fontSize: '20px', fontWeight: 'bold', textDecoration: 'none' }}>
          SummitCircle 🏔️
        </a>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/friends" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>👥 Freunde</a>
          <a href="/chat" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>💬 Chat</a>
          <a href="/feed" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>📰 Feed</a>
          <a href="/tours" style={{ color: '#4CAF50', fontSize: '14px', textDecoration: 'none', fontWeight: 'bold' }}>🗺️ Touren</a>
        </div>
      </nav>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', color: '#4CAF50' }}>🗺️ Touren</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              backgroundColor: '#4CAF50',
              color: '#0f1a0f',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '24px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {showForm ? '✕ Abbrechen' : '+ Tour erstellen'}
          </button>
        </div>

        {message && (
          <p style={{ color: '#4CAF50', marginBottom: '16px', textAlign: 'center' }}>{message}</p>
        )}

        {/* Tour erstellen Form */}
        {showForm && (
          <div style={{
            backgroundColor: '#162016',
            border: '1px solid #2a3d2a',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <h2 style={{ color: '#4CAF50', marginBottom: '20px', fontSize: '16px' }}>
              Neue Tour erstellen
            </h2>

            {/* Titel */}
            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Titel *
            </label>
            <input
              type="text"
              placeholder="z.B. Zugspitze Gipfeltour"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #2a3d2a',
                backgroundColor: '#0f1a0f',
                color: 'white',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            />

            {/* Aktivität */}
            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Aktivität *
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #2a3d2a',
                backgroundColor: '#0f1a0f',
                color: 'white',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              <option value="hiking">🥾 Wandern</option>
              <option value="mountaineering">🏔️ Bergsteigen</option>
              <option value="climbing">🧗 Klettern</option>
              <option value="ski_touring">⛷️ Skitour</option>
              <option value="freeriding">🎿 Freeriding</option>
            </select>

            {/* Schwierigkeit */}
            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Schwierigkeit *
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #2a3d2a',
                backgroundColor: '#0f1a0f',
                color: 'white',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              <option value="beginner">🟢 Anfänger</option>
              <option value="intermediate">🟡 Mittel</option>
              <option value="advanced">🟠 Fortgeschritten</option>
              <option value="expert">🔴 Experte</option>
            </select>

            {/* Datum */}
            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Datum *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #2a3d2a',
                backgroundColor: '#0f1a0f',
                color: 'white',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            />

            {/* Startort */}
            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Startort
            </label>
            <input
              type="text"
              placeholder="z.B. Garmisch-Partenkirchen"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #2a3d2a',
                backgroundColor: '#0f1a0f',
                color: 'white',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            />

            {/* Max Teilnehmer */}
            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Max. Teilnehmer: {maxParticipants}
            </label>
            <input
              type="range"
              min={2}
              max={20}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              style={{ width: '100%', marginBottom: '16px', accentColor: '#4CAF50' }}
            />

            {/* Beschreibung */}
            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              Beschreibung
            </label>
            <textarea
              placeholder="Beschreibe die Tour..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #2a3d2a',
                backgroundColor: '#0f1a0f',
                color: 'white',
                marginBottom: '20px',
                fontSize: '14px',
                resize: 'none',
                fontFamily: 'Arial, sans-serif',
              }}
            />

            <button
              onClick={handleCreateTour}
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#4CAF50',
                color: '#0f1a0f',
                border: 'none',
                padding: '12px',
                borderRadius: '24px',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Erstellen...' : 'Tour erstellen 🚀'}
            </button>
          </div>
        )}

        {/* Touren Liste */}
        {tours.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#6a8a6a',
            padding: '40px',
            backgroundColor: '#162016',
            borderRadius: '12px',
            border: '1px solid #2a3d2a',
          }}>
            Noch keine Touren — erstelle die erste! 🏔️
          </div>
        ) : (
          tours.map((tour) => (
            <div key={tour.id} style={{
              backgroundColor: '#162016',
              border: '1px solid #2a3d2a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{tour.title}</h3>
                <span style={{
                  backgroundColor: '#1e3a1e',
                  color: '#4CAF50',
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '10px',
                }}>
                  {activityLabels[tour.activity_type]}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: '#a0b8a0', fontSize: '13px' }}>
                  📅 {new Date(tour.start_date).toLocaleDateString('de-AT')}
                </span>
                {tour.start_location && (
                  <span style={{ color: '#a0b8a0', fontSize: '13px' }}>
                    📍 {tour.start_location}
                  </span>
                )}
                <span style={{ color: '#a0b8a0', fontSize: '13px' }}>
                  {difficultyLabels[tour.difficulty]}
                </span>
                <span style={{ color: '#a0b8a0', fontSize: '13px' }}>
                  👥 Max. {tour.max_participants} Personen
                </span>
              </div>

              {tour.description && (
                <p style={{ color: '#a0b8a0', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>
                  {tour.description}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6a8a6a', fontSize: '12px' }}>
                  von @{tour.creator?.username}
                </span>
                <button style={{
                  backgroundColor: '#4CAF50',
                  color: '#0f1a0f',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}>
                  Anfragen
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}