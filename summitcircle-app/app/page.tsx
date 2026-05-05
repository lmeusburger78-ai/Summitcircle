'use client'

import { useState, useEffect } from 'react'
import { createClient } from './lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

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
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
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
              <span style={{ color: '#a0b8a0', fontSize: '14px' }}>
                👋 {profile?.username ? `@${profile.username}` : user.email}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: 'transparent',
                  color: '#4CAF50',
                  border: '1px solid #4CAF50',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Ausloggen
              </button>
            </>
          ) : (
            <a href="/login" style={{
              backgroundColor: '#4CAF50',
              color: '#0f1a0f',
              padding: '8px 16px',
              borderRadius: '20px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '14px',
            }}>
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
          <button style={{
            backgroundColor: '#4CAF50',
            color: '#0f1a0f',
            border: 'none',
            padding: '12px 28px',
            borderRadius: '24px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>
            Tour finden
          </button>
          <button style={{
            backgroundColor: 'transparent',
            color: '#4CAF50',
            border: '2px solid #4CAF50',
            padding: '12px 28px',
            borderRadius: '24px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>
            Tour erstellen
          </button>
        </div>
      </section>

      {/* Touren */}
      <section style={{ padding: '24px' }}>
        <h2 style={{
          fontSize: '13px',
          color: '#6a8a6a',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '16px',
        }}>
          Touren in deiner Nähe
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}>
          {[
            { emoji: '🥾', titel: 'Zugspitze Nordwand', datum: 'Sa. 14. Jun', plaetze: '3/6', sport: 'Wandern', bg: '#1a2e1a' },
            { emoji: '🧗', titel: 'Wilder Kaiser', datum: 'So. 15. Jun', plaetze: '2/4', sport: 'Klettern', bg: '#1a1a2e' },
            { emoji: '⛷️', titel: 'Arlberg Skitour', datum: 'Mo. 16. Jun', plaetze: '1/5', sport: 'Skitour', bg: '#1a2a2e' },
            { emoji: '🏔️', titel: 'Großglockner', datum: 'Di. 17. Jun', plaetze: '4/8', sport: 'Bergsteigen', bg: '#2e1a1a' },
          ].map((tour) => (
            <div key={tour.titel} style={{
              backgroundColor: '#162016',
              border: '1px solid #2a3d2a',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
            }}>
              <div style={{
                height: '80px',
                backgroundColor: tour.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
              }}>
                {tour.emoji}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                  {tour.titel}
                </div>
                <div style={{ fontSize: '11px', color: '#6a8a6a' }}>
                  {tour.datum} · {tour.plaetze} Plätze
                </div>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: '#1e3a1e',
                  color: '#4CAF50',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  marginTop: '6px',
                }}>
                  {tour.sport}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px',
        padding: '0 24px 32px',
      }}>
        {[
          { zahl: '1.2k', label: 'Touren' },
          { zahl: '840', label: 'Nutzer' },
          { zahl: '5', label: 'Sportarten' },
        ].map((stat) => (
          <div key={stat.label} style={{
            backgroundColor: '#162016',
            border: '1px solid #2a3d2a',
            borderRadius: '10px',
            padding: '16px 8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#4CAF50' }}>
              {stat.zahl}
            </div>
            <div style={{ fontSize: '11px', color: '#6a8a6a', marginTop: '4px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </section>

    </div>
  )
}