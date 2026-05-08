import { useState, useEffect } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import Home from './screens/Home'
import CreatePool from './screens/CreatePool'
import JoinPool from './screens/JoinPool'
import Dashboard from './screens/Dashboard'
import MyPools from './screens/MyPools'
import IntroOverlay from './components/IntroOverlay'

export type Screen = 'home' | 'create' | 'join' | 'dashboard' | 'mypools'

export default function App() {
  const { wallet } = useWallet()
  const [introPlayed, setIntroPlayed] = useState(false)
  const [screen, setScreen] = useState<Screen>('home')
  const [activePoolAddress, setActivePoolAddress] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )

  // Pre-warm Phantom on mount — wakes extension before user clicks
  useEffect(() => {
    if ((window as any).solana?.isPhantom) {
      ; (window as any).solana.connect({ onlyIfTrusted: true }).catch(() => { })
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const poolAddress = params.get('pool')
    if (poolAddress) {
      setActivePoolAddress(poolAddress)
      setScreen('join')
    }
  }, [])

  function goToDashboard(address: string) {
    setActivePoolAddress(address)
    setTimeout(() => setScreen('dashboard'), 0)
  }

  function handleJoinFromInvite(address: string) {
    setActivePoolAddress(address)
    setScreen('join')
  }

  const isConnected = !!wallet

  return (
    <>
      {!introPlayed && <IntroOverlay onComplete={() => setIntroPlayed(true)} />}

      <div style={{ minHeight: '100dvh', opacity: introPlayed ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 28px',
          background: 'var(--color-panel-bg)',
          borderBottom: '3px solid var(--color-border)',
          boxShadow: '0 3px 0 var(--color-border)',
          position: 'sticky', top: 0, zIndex: 50,
          transition: 'background 0.2s ease',
        }}>
          {/* Logo */}
          <button
            onClick={() => setScreen('home')}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28, letterSpacing: '0.06em',
              color: 'var(--color-text)', lineHeight: 1,
            }}
          >
            AAVART
            <span style={{
              display: 'inline-block', width: 8, height: 8,
              background: 'var(--color-text)', borderRadius: '50%',
              marginLeft: 4, marginBottom: 6, verticalAlign: 'bottom',
            }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isConnected && (
              <button
                onClick={() => setScreen('mypools')}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13, letterSpacing: '0.1em',
                  color: screen === 'mypools' ? 'var(--color-panel-bg)' : 'var(--color-text)',
                  background: screen === 'mypools' ? 'var(--color-text)' : 'transparent',
                  border: '1.5px solid var(--color-text)',
                  borderRadius: 999,
                  cursor: 'pointer',
                  padding: '6px 16px',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => {
                  if (screen !== 'mypools') {
                    e.currentTarget.style.background = 'var(--color-text)'
                    e.currentTarget.style.color = 'var(--color-panel-bg)'
                  }
                }}
                onMouseLeave={e => {
                  if (screen !== 'mypools') {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--color-text)'
                  }
                }}
              >
                MY POOLS
              </button>
            )}

            <button
              className="theme-toggle"
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              aria-label="toggle theme"
            >
              {theme === 'light' ? '◐' : '●'}
            </button>
            <WalletMultiButton />
          </div>
        </nav>

        {screen === 'home' && <Home onCreatePool={() => setScreen('create')} onJoinPool={handleJoinFromInvite} />}
        {screen === 'create' && <CreatePool onBack={() => setScreen('home')} onSuccess={goToDashboard} />}
        {screen === 'join' && activePoolAddress && <JoinPool poolAddress={activePoolAddress} onBack={() => setScreen('home')} onSuccess={goToDashboard} />}
        {screen === 'dashboard' && activePoolAddress && <Dashboard poolAddress={activePoolAddress} onBack={() => setScreen('home')} />}
        {screen === 'mypools' && <MyPools onBack={() => setScreen('home')} onSelectPool={(addr) => { setActivePoolAddress(addr); setScreen('dashboard') }} />}
      </div>
    </>
  )
}