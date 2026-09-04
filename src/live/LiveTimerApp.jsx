import { useAuth } from '../contexts/AuthContext'
import Login from '../pages/Login'
import PrototypeApp from '../prototype/PrototypeApp'
import { useLiveTimerState } from './liveTimerStore'

function actorFromUser(user, isAdmin) {
  const name = user.displayName?.trim() || user.email?.split('@')[0] || 'Member'
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return {
    id: user.uid,
    name,
    initials: initials || 'XM',
    color: '#42d98a',
    role: isAdmin ? 'Owner' : 'Member',
  }
}

function AccessDenied({ onSignOut }) {
  return (
    <main className="prototype-auth-screen">
      <section className="prototype-auth-card">
        <div className="prototype-brand"><span>XMB</span>task</div>
        <span className="prototype-kicker">Private workspace</span>
        <h1>Access not enabled</h1>
        <p>This Google account is not on the XMBtask access list.</p>
        <button type="button" className="prototype-secondary-button is-full" onClick={onSignOut}>Sign out</button>
      </section>
    </main>
  )
}

export default function LiveTimerApp() {
  const { user, hasAccess, isAdmin, signOutUser } = useAuth()
  const { state, syncStatus, updateState } = useLiveTimerState({ user: hasAccess ? user : null, isAdmin })

  if (user === undefined) return <main className="prototype-auth-screen"><div className="prototype-auth-loading">Loading XMBtask…</div></main>
  if (user === null) return <Login />
  if (!hasAccess) return <AccessDenied onSignOut={signOutUser} />
  if (!state) return <main className="prototype-auth-screen"><div className="prototype-auth-loading">Loading shared timer…</div></main>

  return (
    <PrototypeApp
      live
      initialState={state}
      setSharedState={updateState}
      currentUser={actorFromUser(user, isAdmin)}
      canManageActivity={isAdmin}
      syncStatus={syncStatus}
      onSignOut={signOutUser}
    />
  )
}

