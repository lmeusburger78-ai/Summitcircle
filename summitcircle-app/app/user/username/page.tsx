'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'

export default function UserProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [tours, setTours] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [friendStatus, setFriendStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) setCurrentUser(data.user)

      // Profil laden
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', params.username)
        .single()

      if (!profileData) {
        setLoading(false)
        return
      }
      setProfile(profileData)

      // Touren laden
      const { data: tourData } = await supabase
        .from('tours')
        .select('*')
        .eq('creator_id', profileData.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5)
      setTours(tourData || [])

      // Posts laden
      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', profileData.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setPosts(postData || [])

      // Freundschaftsstatus laden
      if (data.user && data.user.id !== profileData.id) {
        const { data: friendData } = await supabase
          .from('friendships')
          .select('*')
          .or(`sender_id.eq.${data.user.id},receiver_id.eq.${data.user.id}`)
          .or(`sender_id.eq.${profileData.id},receiver_id.eq.${profileData.id}`)
          .single()

        if (friendData) setFriendStatus(friendData.status)
      }

      setLoading(false)
    })
  }, [params.username])

  async function handleFriendRequest() {
    const supabase = createClient()
    await supabase.from('friendships').insert({
      sender_id: currentUser.id,
      receiver_id: profile.id,
    })
    setFriendStatus('pending')
  }

  if (loading) return (
    <div style={{ backgroundColor: '#0f1a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4CAF50' }}>
      Laden...
    </div>
  )

  if (!profile) return (
    <div style={{ backgroundColor: '#0f1a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8f5e8' }}>
      User nicht gefunden 😕
    </div>
  )

  const activityLabels: any = {
    hiking: '🥾 Wandern',
    mountaineering: '🏔️ Bergsteigen',
    climbing: '🧗 Klettern',
    ski_touring: '⛷️ Skitour',
    freeriding: '🎿 Freeriding',
  }

  return (
    <div style={{ backgroundColor: '#0f1a0f', minHeight: '100vh', fontFamily: 'Arial, sans-serif', color: '#e8f5e8' }}>
      <nav style={{ backgroundColor: '#162016', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a3d2a' }}>
        <a href="/" style={{ color: '#4CAF50', fontSize: '20px', fontWeight: 'bold', textDecoration: 'none' }}>SummitCircle 🏔️</a>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/feed" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>📰 Feed</a>
          <a href="/tours" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>🗺️ Touren</a>
          <a href="/profile" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>👤 Mein Profil</a>
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>

        {/* Profil Header */}
        <div style={{ backgroundColor: '#162016', border: '1px solid #2a3d2a', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f1a0f', fontWeight: 'bold', fontSize: '28px' }}>
                {profile.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>@{profile.username}</h1>
                {profile.full_name && <p style={{ color: '#a0b8a0', fontSize: '14px', margin: 0 }}>{profile.full_name}</p>}
              </div>
            </div>

            {/* Freund hinzufügen Button */}
            {currentUser && currentUser.id !== profile.id && (
              <div>
                {!friendStatus && (
                  <button onClick={handleFriendRequest} style={{ backgroundColor: '#4CAF50', color: '#0f1a0f', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                    👥 Freund hinzufügen
                  </button>
                )}
                {friendStatus === 'pending' && (
                  <span style={{ color: '#a0b8a0', fontSize: '13px' }}>⏳ Anfrage gesendet</span>
                )}
                {friendStatus === 'accepted' && (
                  <span style={{ color: '#4CAF50', fontSize: '13px' }}>✓ Befreundet</span>
                )}
              </div>
            )}
          </div>

          {profile.bio && (
            <p style={{ color: '#a0b8a0', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{profile.bio}</p>
          )}
        </div>

        {/* Touren */}
        <div style={{ backgroundColor: '#162016', border: '1px solid #2a3d2a', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ color: '#4CAF50', fontSize: '15px', marginBottom: '16px' }}>🗺️ Touren von @{profile.username}</h2>
          {tours.length === 0 ? (
            <p style={{ color: '#6a8a6a', fontSize: '13px' }}>Noch keine Touren.</p>
          ) : (
            tours.map((tour) => (
              <div key={tour.id} style={{ padding: '10px 12px', backgroundColor: '#0f1a0f', borderRadius: '8px', marginBottom: '8px', border: '1px solid #2a3d2a' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{tour.title}</div>
                <div style={{ color: '#6a8a6a', fontSize: '12px', marginTop: '2px' }}>
                  {activityLabels[tour.activity_type]} · 📅 {new Date(tour.start_date).toLocaleDateString('de-AT')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Posts */}
        <div style={{ backgroundColor: '#162016', border: '1px solid #2a3d2a', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ color: '#4CAF50', fontSize: '15px', marginBottom: '16px' }}>📰 Posts von @{profile.username}</h2>
          {posts.length === 0 ? (
            <p style={{ color: '#6a8a6a', fontSize: '13px' }}>Noch keine Posts.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} style={{ padding: '10px 12px', backgroundColor: '#0f1a0f', borderRadius: '8px', marginBottom: '8px', border: '1px solid #2a3d2a' }}>
                <p style={{ fontSize: '13px', margin: '0 0 4px 0', lineHeight: '1.5' }}>{post.content}</p>
                <div style={{ color: '#6a8a6a', fontSize: '11px' }}>{new Date(post.created_at).toLocaleDateString('de-AT')}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
