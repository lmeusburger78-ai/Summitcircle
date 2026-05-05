'use client'

import { useState } from 'react'
import { createClient } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  // Email + Passwort Login
  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setMessage('Fehler: ' + error.message)
    } else {
      window.location.href = '/'
    }
    setLoading(false)
  }

  // Registrieren
  async function handleSignUp() {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      setMessage('Fehler: ' + error.message)
    } else {
      setMessage('Bitte bestätige deine Email! 📧')
    }
    setLoading(false)
  }

  // Google Login
  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000',
      },
    })
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
        {/* Logo */}
        <h1 style={{ color: '#4CAF50', textAlign: 'center', marginBottom: '8px' }}>
          SummitCircle 🏔️
        </h1>
        <p style={{ color: '#6a8a6a', textAlign: 'center', marginBottom: '32px' }}>
          Willkommen zurück
        </p>

        {/* Email Feld */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #2a3d2a',
            backgroundColor: '#0f1a0f',
            color: 'white',
            marginBottom: '12px',
            fontSize: '16px',
          }}
        />

        {/* Passwort Feld */}
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #2a3d2a',
            backgroundColor: '#0f1a0f',
            color: 'white',
            marginBottom: '20px',
            fontSize: '16px',
          }}
        />

        {/* Login Button */}
        <button
          onClick={handleLogin}
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
            marginBottom: '12px',
          }}
        >
          {loading ? 'Laden...' : 'Einloggen'}
        </button>

        {/* Registrieren Button */}
        <button
          onClick={handleSignUp}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '24px',
            border: '2px solid #4CAF50',
            backgroundColor: 'transparent',
            color: '#4CAF50',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          Registrieren
        </button>

        {/* Trennlinie */}
        <div style={{ textAlign: 'center', color: '#6a8a6a', marginBottom: '20px' }}>
          oder
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogle}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '24px',
            border: '1px solid #2a3d2a',
            backgroundColor: '#1a2a1a',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          🔵 Mit Google anmelden
        </button>

        {/* Nachricht */}
        {message && (
          <p style={{ color: '#4CAF50', textAlign: 'center', marginTop: '20px' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}