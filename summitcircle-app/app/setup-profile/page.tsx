'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'

export default function SetupProfile() {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = '/login'
      } else {
        setUser(data.user)
      }
    })
  }, [])

  async function handleSave() {
    if (!username.trim()) {
      setMessage('Bitte wähle einen Usernamen!')
      return
    }

    if (username.length < 3) {
      setMessage('Username muss mindestens 3 Zeichen lang sein!')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: username.toLowerCase().trim(),
        full_name: fullName.trim(),
      })

    if (error) {
      if (error.message.includes('duplicate')) {
        setMessage('Dieser Username ist bereits vergeben!')
      } else {
        setMessage('Fehler: ' + error.message)
      }
    } else {
      setMessage('Profil gespeichert! 🎉')
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    }

    setLoading(false)
  }

  return (
    <div style={{
      backgroundColor: '#0f1a0f',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{
        backgroundColor: '#162016',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid #2a3d2a',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{ color: '#4CAF50', textAlign: 'center', marginBottom: '8px' }}>
          Fast fertig! 🏔️
        </h1>
        <p style={{ color: '#6a8a6a', textAlign: 'center', marginBottom: '32px' }}>
          Wähle deinen SummitCircle Username
        </p>

        {/* Vollständiger Name */}
        <label style={{ color: '#a0b8a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
          Vollständiger Name (optional)
        </label>
        <input
          type="text"
          placeholder="z.B. Laurin Meusburger"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #2a3d2a',
            backgroundColor: '#0f1a0f',
            color: 'white',
            marginBottom: '16px',
            fontSize: '16px',
          }}
        />

        {/* Username */}
        <label style={{ color: '#a0b8a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
          Username *
        </label>
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#4CAF50',
            fontSize: '16px',
          }}>
            @
          </span>
          <input
            type="text"
            placeholder="dein_username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            style={{
              width: '100%',
              padding: '12px 12px 12px 28px',
              borderRadius: '8px',
              border: '1px solid #2a3d2a',
              backgroundColor: '#0f1a0f',
              color: 'white',
              fontSize: '16px',
            }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '24px',
            border: 'none',
            backgroundColor: '#4CAF50',
            color: '#0f1a0f',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Speichern...' : 'Los geht\'s! 🚀'}
        </button>

        {message && (
          <p style={{ color: '#4CAF50', textAlign: 'center', marginTop: '20px' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}