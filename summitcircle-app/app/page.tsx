'use client'

import { useState, useEffect } from 'react'
import { createClient } from './lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [tours, setTours] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        if (!profileData) {
          window.location.href = '/setup-profile'
          return
        }
        setProfile(profileData)
      }
    })

    // Touren laden
    const supabase2 = createClient()
    supabase2
      .from('tours')
      .select(`*, creator:profiles!tours_creator_id_fkey(username)`)
      .eq('status', 'open')
      .order('start_date', { ascending: true })
      .limit(4)
      .then(({ data }) => setTours(data || []))
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const activityEmoji: any = {
    hiking: '🥾',
    mountaineering: '🏔️',
    climbing: '🧗',
    ski_touring: '⛷️',
    freeriding: '🎿',
  }

  const activityLabel: any = {
    hiking: 'Wandern',
    mountaineering: 'Bergsteigen',
    climbing: 'Klettern',
    ski_touring: 'Skitour',
    freeriding: 'Freeriding',
  }

  const activityBg: any = {
    hiking: '#1a2e1a',
    mountaineering: '#2e1a1a',
    climbing: '#1a1a2e',
    ski_touring: '#1a2a2e',
    freeriding: '#2a1a2e',
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
        <div style={{ color: '#4CAF50', fontSize: '20px', fontWeight: 'bold' }}>
          SummitCircle 🏔️
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
            <>
              <a href="/friends" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none', padding: '8px 16px', borderRadius: '20px', border: '1px solid #2a3d2a' }}>👥 Freunde</a>
              <a href="/chat" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none', padding: '8px 16px', borderRadius: '20px', border: '1px solid #2a3d2a' }}>💬 Chat</a>
              <a href="/feed" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none', padding: '8px 16px', borderRadius: '20px', border: '1px solid #2a3d2a' }}>📰 Feed</a>
              <a href="/tours" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none', padding: '8px 16px', borderRadius: '20px', border: '1px solid #2a3d2a' }}>🗺️ Touren</a>
              <a href="/profile" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none', padding: '8px 16px', borderRadius: '20px', border: '1px solid #2a3d2a' }}>
                👤 {profile?.username ? `@${profile.username}` : 'Profil'}
              </a>
              <button onClick={handleLogout} style={{ backgroundColor: 'transparent', color: '#4CAF50', border: '1px solid #4CAF50', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '14px' }}>
                Ausloggen
              </button>
            </>
          ) : (
            <a href="/login" style={{ backgroundColor: '#4CAF50', color: '#0f1a0f', padding: '8px 16px', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
              Anmelden
            </a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '60px 24px 40px' }}>
        <h1 style={{ fontSize: '36px', lineHeight: '1.2', marginBottom: '16px' }}>
          Finde deine nächste <span style={{ color: '#4CAF50' }}>Tour</span>
        </h1>
        <p style={{ color: '#a0b8a0', fontSize: '16px', marginBottom: '32px' }}>
          Verbinde dich mit Outdoor-Enthusiasten in der DACH-Region
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <a href="/tours" style={{ backgroundColor: '#4CAF50', color: '#0f1a0f', border: 'none', padding: '12px 28px', borderRadius: '24px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none' }}>
            Tour finden
          </a>
          <a href="/tours" style={{ backgroundColor: 'transparent', color: '#4CAF50', border: '2px solid #4CAF50', padding: '12px 28px', borderRadius: '24px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none' }}>
            Tour erstellen
          </a>
        </div>
      </section>

      {/* Echte Touren */}
      <section style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '13px', color: '#6a8a6a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          Touren in deiner Nähe
        </h2>
        {tours.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6a8a6a', padding: '40px', backgroundColor: '#162016', borderRadius: '12px', border: '1px solid #2a3d2a' }}>
            Noch keine Touren —{' '}
            <a href="/tours" style={{ color: '#4CAF50' }}>erstelle die erste!</a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {tours.map((tour) => (
              <a key={tour.id} href="/tours" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ backgroundColor: '#162016', border: '1px solid #2a3d2a', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ height: '80px', backgroundColor: activityBg[tour.activity_type] || '#1a2e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                    {activityEmoji[tour.activity_type] || '🏔️'}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>{tour.title}</div>
                    <div style={{ fontSize: '11px', color: '#6a8a6a' }}>
                      {new Date(tour.start_date).toLocaleDateString('de-AT')} · von @{tour.creator?.username}
                    </div>
                    <span style={{ display: 'inline-block', backgroundColor: '#1e3a1e', color: '#4CAF50', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', marginTop: '6px' }}>
                      {activityLabel[tour.activity_type] || tour.activity_type}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '0 24px 32px' }}>
        {[
          { zahl: tours.length.toString(), label: 'Touren' },
          { zahl: '5', label: 'Sportarten' },
          { zahl: 'DACH', label: 'Region' },
        ].map((stat) => (
          <div key={stat.label} style={{ backgroundColor: '#162016', border: '1px solid #2a3d2a', borderRadius: '10px', padding: '16px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#4CAF50' }}>{stat.zahl}</div>
            <div style={{ fontSize: '11px', color: '#6a8a6a', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </section>
    </div>
  )
}