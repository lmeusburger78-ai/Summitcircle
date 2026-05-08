import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://sbnrcxzgrqbtxtcfdkzm.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNibnJjeHpncnFidHh0Y2Zka3ptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkzNDk1NCwiZXhwIjoyMDkzNTEwOTU0fQ.4Y1SCCJTdmJ32rVZuY8nJP_9FzG2-o1d7B8oQaqxKaU'

console.log('🏔️ Script startet...')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const query = `
[out:json][timeout:25];
relation["route"="hiking"]["name"](47.0,10.0,48.0,13.0);
out tags;
`

console.log('📡 Frage Overpass API ab...')

try {
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`
  })

  const data = await response.json()
  console.log(`✓ ${data.elements.length} Routen gefunden!`)

  let imported = 0
  for (const el of data.elements.slice(0, 20)) {
    const tags = el.tags || {}
    if (!tags.name) continue

    const { error } = await supabase.from('tours').insert({
      title: tags.name,
      description: tags.description || `Wanderweg in Tirol/Salzburg`,
      activity_type: 'hiking',
      difficulty: 'intermediate',
      start_date: '2026-06-01',
      start_location: tags.from || 'Österreich',
      max_participants: 20,
      status: 'open',
      bundesland: '🇦🇹 Tirol',
    })

    if (!error) {
      imported++
      console.log(`  ✓ ${tags.name}`)
    } else {
      console.log(`  ✗ Fehler: ${error.message}`)
    }
  }

  console.log(`\n✅ ${imported} Touren importiert!`)

} catch (err) {
  console.error('❌ Fehler:', err.message)
}