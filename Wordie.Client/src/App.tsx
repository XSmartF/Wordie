import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import WordsTable from './WordsTable'
import WordSetsTable from './WordSetsTable'
import WordSetDetail from './WordSetDetail'
import LoginForm from './LoginForm'
import type { WordSetDto } from './types'

function App() {
  const [showWords, setShowWords] = useState(true)
  const [selectedWordSet, setSelectedWordSet] = useState<WordSetDto | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [userDisplayName, setUserDisplayName] = useState<string>('')

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('authToken')
    if (token) {
      setAuthToken(token)
      // You could decode JWT to get display name, but for simplicity we'll just show "Logged in"
      setUserDisplayName('User')
    }
  }, [])

  const handleLoginSuccess = (token: string) => {
    setAuthToken(token)
    localStorage.setItem('authToken', token)
    setUserDisplayName('User') // In a real app, you'd decode the JWT to get the actual name
  }

  const handleLogout = () => {
    setAuthToken(null)
    setUserDisplayName('')
    localStorage.removeItem('authToken')
  }

  if (!authToken) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <a href="https://vite.dev" target="_blank">
              <img src={viteLogo} className="logo" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>
          <h1 style={{ color: '#333', marginBottom: '2rem' }}>Wordie</h1>
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Wordie</h1>

      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <span style={{ fontSize: '0.9rem', color: '#666' }}>
          Welcome, {userDisplayName}!
        </span>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => {
            setShowWords(true);
            setSelectedWordSet(null);
          }}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            background: showWords ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Words
        </button>
        <button
          onClick={() => {
            setShowWords(false);
            setSelectedWordSet(null);
          }}
          style={{
            padding: '0.5rem 1rem',
            background: !showWords ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Word Sets
        </button>
      </div>

      {selectedWordSet ? (
        <WordSetDetail
          wordSetId={selectedWordSet.Id}
          wordSetTitle={selectedWordSet.Title}
          onBack={() => setSelectedWordSet(null)}
        />
      ) : showWords ? (
        <WordsTable />
      ) : (
        <WordSetsTable onRowClick={setSelectedWordSet} />
      )}

      <div className="card">
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
