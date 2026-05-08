'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleReset() {
    if (!password.trim()) {
      setMessage('Bitte neues Passwort eingeben!')
      return
    }
    if (password !== confirmPassword) {
      setMessage('Passwörter stimmen nicht überein!')
      return
    }
    if (password.length < 6) {
      setMessage('Passwort muss mindestens 6 Zeichen lang sein!')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage('Fehler: ' + error.message)
    } else {
      setMessage('Passwort erfolgreich geändert! ✅')
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
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
          SummitCircle 🏔️
        </h1>
        <p style={{ color: '#6a8a6a', textAlign: 'center', marginBottom: '32px' }}>
          Neues Passwort festlegen
        </p>

        <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          Neues Passwort
        </label>
        <input
          type="password"
          placeholder="Mindestens 6 Zeichen"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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

        <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          Passwort bestätigen
        </label>
        <input
          type="password"
          placeholder="Passwort wiederholen"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #2a3d2a',
            backgroundColor: '#0f1a0f',
            color: 'white',
            marginBottom: '24px',
            fontSize: '16px',
          }}
        />

        <button
          onClick={handleReset}
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
          {loading ? 'Speichern...' : 'Passwort speichern'}
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