'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'

const BUNDESLAENDER: { [key: string]: string[] } = {
  // 🇦🇹 ÖSTERREICH
  '🇦🇹 Vorarlberg': ['Bregenz', 'Dornbirn', 'Feldkirch', 'Bludenz', 'Bregenzerwald', 'Montafon', 'Kleinwalsertal'],
  '🇦🇹 Tirol': ['Innsbruck', 'Kitzbühel', 'Ötztal', 'Zillertal', 'Achensee', 'Zugspitz Arena', 'Wilder Kaiser', 'Stubaital', 'Wipptal', 'Osttirol'],
  '🇦🇹 Salzburg': ['Stadt Salzburg', 'Flachgau', 'Tennengau', 'Pongau', 'Pinzgau', 'Lungau', 'Zell am See', 'Saalbach'],
  '🇦🇹 Oberösterreich': ['Linz', 'Wels', 'Steyr', 'Salzkammergut', 'Mühlviertel', 'Pyhrn-Eisenwurzen', 'Innviertel'],
  '🇦🇹 Niederösterreich': ['St. Pölten', 'Wiener Neustadt', 'Mostviertel', 'Waldviertel', 'Weinviertel', 'Industrieviertel', 'Wachau'],
  '🇦🇹 Wien': ['Wien Innere Stadt', 'Wien Nord', 'Wien Süd', 'Wien West', 'Wien Umgebung'],
  '🇦🇹 Steiermark': ['Graz', 'Schladming', 'Mariazell', 'Murtal', 'Ennstal', 'Südsteiermark', 'Oststeiermark', 'Gesäuse'],
  '🇦🇹 Kärnten': ['Klagenfurt', 'Villach', 'Wörthersee', 'Nassfeld', 'Hohe Tauern Kärnten', 'Nockberge', 'Weissensee'],
  '🇦🇹 Burgenland': ['Eisenstadt', 'Neusiedler See', 'Mittelburgenland', 'Südburgenland'],

  // 🇩🇪 DEUTSCHLAND
  '🇩🇪 Bayern': ['München', 'Berchtesgaden', 'Allgäu', 'Zugspitzregion', 'Chiemgau', 'Ammergauer Alpen', 'Bayerischer Wald'],
  '🇩🇪 Baden-Württemberg': ['Stuttgart', 'Schwarzwald', 'Bodensee', 'Schwäbische Alb', 'Freiburg'],
  '🇩🇪 Nordrhein-Westfalen': ['Köln', 'Düsseldorf', 'Sauerland', 'Eifel', 'Teutoburger Wald'],
  '🇩🇪 Hessen': ['Frankfurt', 'Taunus', 'Rhön', 'Vogelsberg', 'Odenwald'],
  '🇩🇪 Rheinland-Pfalz': ['Mainz', 'Moseltal', 'Eifel', 'Pfälzerwald', 'Hunsrück'],
  '🇩🇪 Sachsen': ['Dresden', 'Leipzig', 'Sächsische Schweiz', 'Erzgebirge', 'Vogtland'],
  '🇩🇪 Thüringen': ['Erfurt', 'Thüringer Wald', 'Rhön', 'Kyffhäuser'],
  '🇩🇪 Niedersachsen': ['Hannover', 'Harz', 'Lüneburger Heide', 'Nordseeküste'],

  // 🇨🇭 SCHWEIZ
  '🇨🇭 Graubünden': ['Davos', 'St. Moritz', 'Flims-Laax', 'Engadin', 'Arosa', 'Lenzerheide'],
  '🇨🇭 Wallis': ['Zermatt', 'Saas-Fee', 'Verbier', 'Leukerbad', 'Aletschgebiet'],
  '🇨🇭 Bern': ['Bern', 'Jungfrauregion', 'Grindelwald', 'Kandersteg', 'Haslital'],
  '🇨🇭 Uri': ['Andermatt', 'Gotthard', 'Schächental'],
  '🇨🇭 Schwyz': ['Schwyz', 'Mythen', 'Einsiedeln', 'Vierwaldstättersee'],
  '🇨🇭 Glarus': ['Glarus', 'Braunwald', 'Klöntal'],
  '🇨🇭 Appenzell': ['Appenzell', 'Säntis', 'Toggenburg'],
  '🇨🇭 Tessin': ['Lugano', 'Locarno', 'Bellinzona', 'Gotthard Südseite'],
}

export default function ToursPage() {
  const [user, setUser] = useState<any>(null)
  const [tours, setTours] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedTour, setSelectedTour] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [participants, setParticipants] = useState<any[]>([])

  // Form Felder
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [activityType, setActivityType] = useState('hiking')
  const [difficulty, setDifficulty] = useState('beginner')
  const [startDate, setStartDate] = useState('')
  const [startLocation, setStartLocation] = useState('')
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [komootUrl, setKomootUrl] = useState('')
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const [selectedBundesland, setSelectedBundesland] = useState('')
  const [selectedRegionen, setSelectedRegionen] = useState<string[]>([])

  // Filter
  const [filterBundesland, setFilterBundesland] = useState('')
  const [filterAktivitaet, setFilterAktivitaet] = useState('')

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
    let query = supabase
      .from('tours')
      .select(`*, creator:profiles!tours_creator_id_fkey(id, username, full_name)`)
      .eq('status', 'open')
      .order('start_date', { ascending: true })

    if (filterBundesland) query = query.eq('bundesland', filterBundesland)
    if (filterAktivitaet) query = query.eq('activity_type', filterAktivitaet)

    const { data } = await query
    setTours(data || [])
  }

  useEffect(() => {
    loadTours()
  }, [filterBundesland, filterAktivitaet])

  async function loadTourDetails(tourId: string) {
    const supabase = createClient()
    const { data: commentData } = await supabase
      .from('tour_comments')
      .select(`*, author:profiles!tour_comments_author_id_fkey(username)`)
      .eq('tour_id', tourId)
      .order('created_at', { ascending: true })
    setComments(commentData || [])

    const { data: participantData } = await supabase
      .from('tour_participants')
      .select(`*, user:profiles!tour_participants_user_id_fkey(username)`)
      .eq('tour_id', tourId)
    setParticipants(participantData || [])
  }

  async function handleCreateTour() {
    if (!title.trim() || !startDate) {
      setMessage('Bitte Titel und Datum ausfüllen!')
      return
    }
    setLoading(true)
    const supabase = createClient()

    let gpxUrl = null

    // GPX Upload
    if (gpxFile) {
      const fileName = `${user.id}/${Date.now()}_${gpxFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gpx-files')
        .upload(fileName, gpxFile)

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('gpx-files')
          .getPublicUrl(fileName)
        gpxUrl = urlData.publicUrl
      }
    }

    const { error } = await supabase.from('tours').insert({
      creator_id: user.id,
      title: title.trim(),
      description: description.trim(),
      activity_type: activityType,
      difficulty,
      start_date: startDate,
      start_location: startLocation.trim(),
      max_participants: maxParticipants,
      status: 'open',
      komoot_url: komootUrl.trim() || null,
      gpx_url: gpxUrl,
      bundesland: selectedBundesland || null,
      regionen: selectedRegionen.length > 0 ? selectedRegionen : null,
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
      setKomootUrl('')
      setGpxFile(null)
      setSelectedBundesland('')
      setSelectedRegionen([])
      loadTours()
    }
    setLoading(false)
  }

  async function handleJoinRequest(tourId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('tour_participants').insert({
      tour_id: tourId,
      user_id: user.id,
    })
    if (error) {
      if (error.message.includes('duplicate')) {
        setMessage('Du hast bereits eine Anfrage gestellt!')
      } else {
        setMessage('Fehler: ' + error.message)
      }
    } else {
      setMessage('Anfrage gesendet! 🎉')
      loadTourDetails(tourId)
    }
  }

  async function handleComment(tourId: string) {
    if (!newComment.trim()) return
    const supabase = createClient()
    await supabase.from('tour_comments').insert({
      tour_id: tourId,
      author_id: user.id,
      content: newComment.trim(),
    })
    setNewComment('')
    loadTourDetails(tourId)
  }

  async function handleParticipantStatus(participantId: string, status: string) {
    const supabase = createClient()
    await supabase.from('tour_participants').update({ status }).eq('id', participantId)
    if (selectedTour) loadTourDetails(selectedTour.id)
  }

  function toggleRegion(region: string) {
    setSelectedRegionen((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    )
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
    <div style={{ backgroundColor: '#0f1a0f', minHeight: '100vh', fontFamily: 'Arial, sans-serif', color: '#e8f5e8' }}>
      <nav style={{ backgroundColor: '#162016', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a3d2a' }}>
        <a href="/" style={{ color: '#4CAF50', fontSize: '20px', fontWeight: 'bold', textDecoration: 'none' }}>SummitCircle 🏔️</a>
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
          <button onClick={() => setShowForm(!showForm)} style={{ backgroundColor: '#4CAF50', color: '#0f1a0f', border: 'none', padding: '10px 20px', borderRadius: '24px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
            {showForm ? '✕ Abbrechen' : '+ Tour erstellen'}
          </button>
        </div>

        {message && <p style={{ color: '#4CAF50', marginBottom: '16px', textAlign: 'center' }}>{message}</p>}

        {/* Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <select
            value={filterBundesland}
            onChange={(e) => setFilterBundesland(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #2a3d2a', backgroundColor: '#162016', color: '#e8f5e8', fontSize: '13px', cursor: 'pointer' }}
          >
            <option value="">🗺️ Alle Bundesländer</option>
            {Object.keys(BUNDESLAENDER).map((bl) => (
              <option key={bl} value={bl}>{bl}</option>
            ))}
          </select>

          <select
            value={filterAktivitaet}
            onChange={(e) => setFilterAktivitaet(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #2a3d2a', backgroundColor: '#162016', color: '#e8f5e8', fontSize: '13px', cursor: 'pointer' }}
          >
            <option value="">🏃 Alle Aktivitäten</option>
            <option value="hiking">🥾 Wandern</option>
            <option value="mountaineering">🏔️ Bergsteigen</option>
            <option value="climbing">🧗 Klettern</option>
            <option value="ski_touring">⛷️ Skitour</option>
            <option value="freeriding">🎿 Freeriding</option>
          </select>
        </div>

        {/* Tour erstellen Form */}
        {showForm && (
          <div style={{ backgroundColor: '#162016', border: '1px solid #2a3d2a', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ color: '#4CAF50', marginBottom: '20px', fontSize: '16px' }}>Neue Tour erstellen</h2>

            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Titel *</label>
            <input type="text" placeholder="z.B. Zugspitze Gipfeltour" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2a3d2a', backgroundColor: '#0f1a0f', color: 'white', marginBottom: '16px', fontSize: '14px' }} />

            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Aktivität *</label>
            <select value={activityType} onChange={(e) => setActivityType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2a3d2a', backgroundColor: '#0f1a0f', color: 'white', marginBottom: '16px', fontSize: '14px' }}>
              <option value="hiking">🥾 Wandern</option>
              <option value="mountaineering">🏔️ Bergsteigen</option>
              <option value="climbing">🧗 Klettern</option>
              <option value="ski_touring">⛷️ Skitour</option>
              <option value="freeriding">🎿 Freeriding</option>
            </select>

            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Schwierigkeit *</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2a3d2a', backgroundColor: '#0f1a0f', color: 'white', marginBottom: '16px', fontSize: '14px' }}>
              <option value="beginner">🟢 Anfänger</option>
              <option value="intermediate">🟡 Mittel</option>
              <option value="advanced">🟠 Fortgeschritten</option>
              <option value="expert">🔴 Experte</option>
            </select>

            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Datum *</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2a3d2a', backgroundColor: '#0f1a0f', color: 'white', marginBottom: '16px', fontSize: '14px' }} />

            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Startort</label>
            <input type="text" placeholder="z.B. Garmisch-Partenkirchen" value={startLocation} onChange={(e) => setStartLocation(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2a3d2a', backgroundColor: '#0f1a0f', color: 'white', marginBottom: '16px', fontSize: '14px' }} />

            {/* Bundesland */}
            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Bundesland</label>
            <select
              value={selectedBundesland}
              onChange={(e) => { setSelectedBundesland(e.target.value); setSelectedRegionen([]) }}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2a3d2a', backgroundColor: '#0f1a0f', color: 'white', marginBottom: '16px', fontSize: '14px' }}
            >
              <option value="">Bundesland auswählen...</option>
              {Object.keys(BUNDESLAENDER).map((bl) => (
                <option key={bl} value={bl}>{bl}</option>
              ))}
            </select>

            {/* Regionen Mehrfachauswahl */}
            {selectedBundesland && (
              <>
                <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                  Regionen (Mehrfachauswahl möglich)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {BUNDESLAENDER[selectedBundesland].map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid #2a3d2a',
                        backgroundColor: selectedRegionen.includes(region) ? '#4CAF50' : '#0f1a0f',
                        color: selectedRegionen.includes(region) ? '#0f1a0f' : '#a0b8a0',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: selectedRegionen.includes(region) ? 'bold' : 'normal',
                      }}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Komoot URL */}
            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              🔗 Komoot Link (optional)
            </label>
            <input
              type="url"
              placeholder="https://www.komoot.com/tour/..."
              value={komootUrl}
              onChange={(e) => setKomootUrl(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2a3d2a', backgroundColor: '#0f1a0f', color: 'white', marginBottom: '16px', fontSize: '14px' }}
            />

            {/* GPX Upload */}
            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
              📁 GPX Datei hochladen (optional)
            </label>
            <input
              type="file"
              accept=".gpx"
              onChange={(e) => setGpxFile(e.target.files?.[0] || null)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2a3d2a', backgroundColor: '#0f1a0f', color: 'white', marginBottom: '16px', fontSize: '14px' }}
            />
            {gpxFile && (
              <p style={{ color: '#4CAF50', fontSize: '12px', marginTop: '-12px', marginBottom: '16px' }}>
                ✓ {gpxFile.name} ausgewählt
              </p>
            )}

            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Max. Teilnehmer: {maxParticipants}</label>
            <input type="range" min={2} max={20} value={maxParticipants} onChange={(e) => setMaxParticipants(Number(e.target.value))} style={{ width: '100%', marginBottom: '16px', accentColor: '#4CAF50' }} />

            <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Beschreibung</label>
            <textarea placeholder="Beschreibe die Tour..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2a3d2a', backgroundColor: '#0f1a0f', color: 'white', marginBottom: '20px', fontSize: '14px', resize: 'none', fontFamily: 'Arial, sans-serif' }} />

            <button onClick={handleCreateTour} disabled={loading} style={{ width: '100%', backgroundColor: '#4CAF50', color: '#0f1a0f', border: 'none', padding: '12px', borderRadius: '24px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
              {loading ? 'Erstellen...' : 'Tour erstellen 🚀'}
            </button>
          </div>
        )}

        {/* Touren Liste */}
        {tours.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6a8a6a', padding: '40px', backgroundColor: '#162016', borderRadius: '12px', border: '1px solid #2a3d2a' }}>
            Keine Touren gefunden 🏔️
          </div>
        ) : (
          tours.map((tour) => (
            <div key={tour.id} style={{ backgroundColor: '#162016', border: selectedTour?.id === tour.id ? '1px solid #4CAF50' : '1px solid #2a3d2a', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{tour.title}</h3>
                <span style={{ backgroundColor: '#1e3a1e', color: '#4CAF50', fontSize: '11px', padding: '3px 10px', borderRadius: '10px' }}>
                  {activityLabels[tour.activity_type]}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: '#a0b8a0', fontSize: '13px' }}>📅 {new Date(tour.start_date).toLocaleDateString('de-AT')}</span>
                {tour.start_location && <span style={{ color: '#a0b8a0', fontSize: '13px' }}>📍 {tour.start_location}</span>}
                {tour.bundesland && <span style={{ color: '#a0b8a0', fontSize: '13px' }}>🗺️ {tour.bundesland}</span>}
                <span style={{ color: '#a0b8a0', fontSize: '13px' }}>{difficultyLabels[tour.difficulty]}</span>
                <span style={{ color: '#a0b8a0', fontSize: '13px' }}>👥 Max. {tour.max_participants}</span>
              </div>

              {tour.regionen && tour.regionen.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {tour.regionen.map((r: string) => (
                    <span key={r} style={{ backgroundColor: '#1e3a1e', color: '#4CAF50', fontSize: '11px', padding: '2px 8px', borderRadius: '10px' }}>{r}</span>
                  ))}
                </div>
              )}

              {tour.description && <p style={{ color: '#a0b8a0', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>{tour.description}</p>}

              {/* Komoot Link */}
              {tour.komoot_url && (
                <a href={tour.komoot_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4CAF50', fontSize: '13px', marginBottom: '8px', textDecoration: 'none', backgroundColor: '#1e3a1e', padding: '6px 12px', borderRadius: '20px' }}>
                  🔗 Route auf Komoot ansehen
                </a>
              )}

              {/* GPX Download */}
              {tour.gpx_url && (
                <a href={tour.gpx_url} download style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#a0b8a0', fontSize: '13px', marginBottom: '8px', marginLeft: '8px', textDecoration: 'none', backgroundColor: '#162016', border: '1px solid #2a3d2a', padding: '6px 12px', borderRadius: '20px' }}>
                  📁 GPX herunterladen
                </a>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ color: '#6a8a6a', fontSize: '12px' }}>von @{tour.creator?.username}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      if (selectedTour?.id === tour.id) {
                        setSelectedTour(null)
                      } else {
                        setSelectedTour(tour)
                        loadTourDetails(tour.id)
                      }
                    }}
                    style={{ backgroundColor: 'transparent', color: '#a0b8a0', border: '1px solid #2a3d2a', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer' }}
                  >
                    {selectedTour?.id === tour.id ? '▲ Schließen' : '▼ Details'}
                  </button>
                  {tour.creator_id !== user?.id && (
                    <button onClick={() => handleJoinRequest(tour.id)} style={{ backgroundColor: '#4CAF50', color: '#0f1a0f', border: 'none', padding: '8px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Anfragen
                    </button>
                  )}
                </div>
              </div>

              {/* Tour Details */}
              {selectedTour?.id === tour.id && (
                <div style={{ marginTop: '16px', borderTop: '1px solid #2a3d2a', paddingTop: '16px' }}>
                  <h4 style={{ color: '#4CAF50', fontSize: '13px', marginBottom: '8px' }}>👥 Anfragen</h4>
                  {participants.length === 0 ? (
                    <p style={{ color: '#6a8a6a', fontSize: '13px', marginBottom: '16px' }}>Noch keine Anfragen</p>
                  ) : (
                    participants.map((p) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: '#0f1a0f', borderRadius: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px' }}>@{p.user?.username}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: p.status === 'confirmed' ? '#4CAF50' : p.status === 'rejected' ? '#ff6b6b' : '#a0b8a0' }}>
                            {p.status === 'confirmed' ? '✓ Bestätigt' : p.status === 'rejected' ? '✕ Abgelehnt' : '⏳ Ausstehend'}
                          </span>
                          {tour.creator_id === user?.id && p.status === 'pending' && (
                            <>
                              <button onClick={() => handleParticipantStatus(p.id, 'confirmed')} style={{ backgroundColor: '#4CAF50', color: '#0f1a0f', border: 'none', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer' }}>✓</button>
                              <button onClick={() => handleParticipantStatus(p.id, 'rejected')} style={{ backgroundColor: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  <h4 style={{ color: '#4CAF50', fontSize: '13px', marginBottom: '8px', marginTop: '16px' }}>💬 Kommentare</h4>
                  {comments.length === 0 ? (
                    <p style={{ color: '#6a8a6a', fontSize: '13px', marginBottom: '12px' }}>Noch keine Kommentare</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} style={{ padding: '8px 12px', backgroundColor: '#0f1a0f', borderRadius: '8px', marginBottom: '6px' }}>
                        <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>@{c.author?.username}</span>
                        <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>{c.content}</p>
                      </div>
                    ))
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="Kommentar schreiben..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleComment(tour.id)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #2a3d2a', backgroundColor: '#0f1a0f', color: 'white', fontSize: '13px' }}
                    />
                    <button onClick={() => handleComment(tour.id)} style={{ backgroundColor: '#4CAF50', color: '#0f1a0f', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Senden
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}