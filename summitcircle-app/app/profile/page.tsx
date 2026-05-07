'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myTours, setMyTours] = useState<any[]>([])
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const [newBio, setNewBio] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = '/login'
        return
      }
      setUser(data.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      setProfile(profileData)
      setNewBio(profileData?.bio || '')
      setNewFullName(profileData?.full_name || '')

      // Meine Touren
      const { data: tourData } = await supabase
        .from('tours')
        .select('*')
        .eq('creator_id', data.user.id)
        .order('created_at', { ascending: false })
      setMyTours(tourData || [])

      // Meine Posts
      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', data.user.id)
        .order('created_at', { ascending: false })
      setMyPosts(postData || [])

      // Freunde
      const { data: friendData } = await supabase
        .from('friendships')
        .select(`
          *,
          sender:profiles!friendships_sender_id_fkey(id, username),
          receiver:profiles!friendships_receiver_id_fkey(id, username)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${data.user.id},receiver_id.eq.${data.user.id}`)
      setFriends(friendData || [])
    })
  }, [])

  async function handleSaveProfile() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: newFullName.trim(),
        bio: newBio.trim(),
      })
      .eq('id', user.id)

    if (error) {
      setMessage('Fehler beim Speichern!')
    } else {
      setMessage('Profil gespeichert! ✅')
      setProfile({ ...profile, full_name: newFullName, bio: newBio })
      setEditing(false)
    }
    setLoading(false)
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
          <a href="/tours" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>🗺️ Touren</a>
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>

        {/* Profil Header */}
        <div style={{
          backgroundColor: '#162016',
          border: '1px solid #2a3d2a',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f1a0f',
              fontWeight: 'bold',
              fontSize: '28px',
            }}>
              {profile?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                @{profile?.username}
              </h1>
              {profile?.full_name && (
                <p style={{ color: '#a0b8a0', fontSize: '14px', margin: 0 }}>{profile.full_name}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {!editing ? (
            <div>
              <p style={{ color: '#a0b8a0', fontSize: '14px', marginBottom: '16px', lineHeight: '1.6' }}>
                {profile?.bio || 'Noch keine Bio — füge eine hinzu!'}
              </p>
              <button
                onClick={() => setEditing(true)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#4CAF50',
                  border: '1px solid #4CAF50',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                ✏️ Profil bearbeiten
              </button>
            </div>
          ) : (
            <div>
              <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Vollständiger Name
              </label>
              <input
                type="text"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #2a3d2a',
                  backgroundColor: '#0f1a0f',
                  color: 'white',
                  marginBottom: '12px',
                  fontSize: '14px',
                }}
              />
              <label style={{ color: '#a0b8a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Bio
              </label>
              <textarea
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder="Schreibe etwas über dich..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #2a3d2a',
                  backgroundColor: '#0f1a0f',
                  color: 'white',
                  marginBottom: '12px',
                  fontSize: '14px',
                  resize: 'none',
                  fontFamily: 'Arial, sans-serif',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  style={{
                    backgroundColor: '#4CAF50',
                    color: '#0f1a0f',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                  }}
                >
                  {loading ? 'Speichern...' : '✓ Speichern'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#a0b8a0',
                    border: '1px solid #2a3d2a',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {message && <p style={{ color: '#4CAF50', marginTop: '12px', fontSize: '13px' }}>{message}</p>}
        </div>

        {/* Statistiken */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '24px',
        }}>
          {[
            { zahl: myTours.length, label: 'Touren' },
            { zahl: myPosts.length, label: 'Posts' },
            { zahl: friends.length, label: 'Freunde' },
          ].map((stat) => (
            <div key={stat.label} style={{
              backgroundColor: '#162016',
              border: '1px solid #2a3d2a',
              borderRadius: '10px',
              padding: '16px 8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{stat.zahl}</div>
              <div style={{ fontSize: '11px', color: '#6a8a6a', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Meine Touren */}
        <div style={{
          backgroundColor: '#162016',
          border: '1px solid #2a3d2a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <h2 style={{ color: '#4CAF50', fontSize: '15px', marginBottom: '16px' }}>🗺️ Meine Touren</h2>
          {myTours.length === 0 ? (
            <p style={{ color: '#6a8a6a', fontSize: '13px' }}>Noch keine Touren erstellt.</p>
          ) : (
            myTours.map((tour) => (
              <div key={tour.id} style={{
                padding: '10px 12px',
                backgroundColor: '#0f1a0f',
                borderRadius: '8px',
                marginBottom: '8px',
                border: '1px solid #2a3d2a',
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{tour.title}</div>
                <div style={{ color: '#6a8a6a', fontSize: '12px', marginTop: '2px' }}>
                  📅 {new Date(tour.start_date).toLocaleDateString('de-AT')} · {tour.status}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Meine Posts */}
        <div style={{
          backgroundColor: '#162016',
          border: '1px solid #2a3d2a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ color: '#4CAF50', fontSize: '15px', marginBottom: '16px' }}>📰 Meine Posts</h2>
          {myPosts.length === 0 ? (
            <p style={{ color: '#6a8a6a', fontSize: '13px' }}>Noch keine Posts.</p>
          ) : (
            myPosts.map((post) => (
              <div key={post.id} style={{
                padding: '10px 12px',
                backgroundColor: '#0f1a0f',
                borderRadius: '8px',
                marginBottom: '8px',
                border: '1px solid #2a3d2a',
              }}>
                <p style={{ fontSize: '13px', margin: 0, lineHeight: '1.5' }}>{post.content}</p>
                <div style={{ color: '#6a8a6a', fontSize: '11px', marginTop: '4px' }}>
                  {new Date(post.created_at).toLocaleDateString('de-AT')}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}