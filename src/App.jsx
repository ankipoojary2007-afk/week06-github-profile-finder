
import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [username, setUsername] = useState('')
  const [searchUser, setSearchUser] = useState('')
  const [user, setUser] = useState(null)
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (!searchUser) return

    const controller = new AbortController()

    async function fetchProfile() {
      setLoading(true)
      setError('')
      setUser(null)
      setRepos([])

      try {
        const response = await fetch(
          `https://api.github.com/users/${encodeURIComponent(searchUser)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found. Check the username and try again.')
          }
          if (response.status === 403) {
            throw new Error('GitHub API rate limit reached. Please try again later.')
          }
          throw new Error('Unable to fetch profile. Please try again.')
        }

        const data = await response.json()
        const repoResponse = await fetch(
          `https://api.github.com/users/${encodeURIComponent(searchUser)}/repos?sort=updated&per_page=6`,
          { signal: controller.signal }
        )

        setUser(data)

        if (repoResponse.ok) {
          setRepos(await repoResponse.json())
        }

        setHistory((previous) => [
          searchUser,
          ...previous.filter((name) => name.toLowerCase() !== searchUser.toLowerCase()),
        ].slice(0, 5))
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Something went wrong.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchProfile()
    return () => controller.abort()
  }, [searchUser])

  function handleSearch(event) {
    event.preventDefault()
    const value = username.trim()
    if (value) setSearchUser(value)
  }

  return (
    <main className={dark ? 'app dark' : 'app'}>
      <header className="topbar">
        <a className="brand" href="https://github.com" target="_blank" rel="noreferrer">
          <span className="brand-icon">GH</span>
          <span>Profile<span className="brand-accent">Finder</span></span>
        </a>
        <button className="theme-button" onClick={() => setDark(!dark)}>
          {dark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <section className="hero">
        <span className="eyebrow">✦ DEVELOPER EXPLORER</span>
        <h1>Discover any <span>GitHub</span> profile.</h1>
        <p>Explore developers, discover their work, and see what they're building.</p>

        <form className="search-form" onSubmit={handleSearch}>
          <span className="search-icon">⌕</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter a GitHub username..."
            aria-label="GitHub username"
          />
          <button type="submit" disabled={!username.trim() || loading}>
            {loading ? 'Searching...' : 'Search →'}
          </button>
        </form>
        <p className="hint">Try searching: <button onClick={() => { setUsername('octocat'); setSearchUser('octocat') }}>octocat</button></p>
      </section>

      {history.length > 0 && (
        <section className="history">
          <span>Recent searches</span>
          {history.map((name) => (
            <button key={name} onClick={() => { setUsername(name); setSearchUser(name) }}>
              {name}
            </button>
          ))}
        </section>
      )}

      {loading && <div className="message">🔄 Fetching GitHub profile...</div>}
      {error && <div className="message error" role="alert">⚠️ {error}</div>}

      {user && !loading && (
        <section className="results">
          <article className="profile-card">
            <div className="profile-top">
              <img className="avatar" src={user.avatar_url} alt={`${user.login}'s avatar`} />
              <div className="profile-info">
                <span className="profile-label">GITHUB DEVELOPER</span>
                <h2>{user.name || user.login}</h2>
                <a href={user.html_url} target="_blank" rel="noreferrer">@{user.login} ↗</a>
              </div>
              <a className="visit-button" href={user.html_url} target="_blank" rel="noreferrer">
                View Profile ↗
              </a>
            </div>

            <p className="bio">{user.bio || 'This developer has not added a bio yet.'}</p>

            <div className="stats">
              <div><span>Repositories</span><strong>{user.public_repos}</strong></div>
              <div><span>Followers</span><strong>{user.followers}</strong></div>
              <div><span>Following</span><strong>{user.following}</strong></div>
            </div>

            <div className="details">
              {user.location && <span>📍 {user.location}</span>}
              {user.company && <span>🏢 {user.company}</span>}
              {user.blog && <span>🔗 <a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} target="_blank" rel="noreferrer">{user.blog}</a></span>}
              <span>📅 Joined {new Date(user.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</span>
            </div>
          </article>

          <section className="repos-section">
            <div className="section-heading">
              <div><span className="profile-label">WHAT THEY BUILD</span><h2>Recent repositories</h2></div>
              <span className="repo-count">{user.public_repos} public total</span>
            </div>

            {repos.length === 0 ? (
              <p className="message">No public repositories to display.</p>
            ) : (
              <div className="repo-grid">
                {repos.map((repo) => (
                  <a className="repo-card" key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer">
                    <div className="repo-title">📁 {repo.name} <span>↗</span></div>
                    <p>{repo.description || 'No description provided.'}</p>
                    <div className="repo-meta">
                      {repo.language && <span>● {repo.language}</span>}
                      <span>⭐ {repo.stargazers_count}</span>
                      <span>⑂ {repo.forks_count}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        </section>
      )}

      {!user && !loading && !error && (
        <section className="welcome">
          <div className="welcome-icon">⌘</div>
          <h2>Your next discovery starts here.</h2>
          <p>Search for a developer to explore their GitHub profile and projects.</p>
        </section>
      )}

      <footer>Built with React & GitHub API <span>·</span> Week 06 Project</footer>
    </main>
  )
}

export default App
