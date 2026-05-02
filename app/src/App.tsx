import { useState, useEffect } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Home from './screens/Home'
import CreatePool from './screens/CreatePool'
import JoinPool from './screens/JoinPool'
import Dashboard from './screens/Dashboard'

export type Screen = 'home' | 'create' | 'join' | 'dashboard'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [activePoolAddress, setActivePoolAddress] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const poolAddress = params.get('pool')
    if (poolAddress) {
      setActivePoolAddress(poolAddress)
      setScreen('join')
    }
  }, [])

  function goToDashboard(address: string) {
    console.log('goToDashboard called with:', address)
    setActivePoolAddress(address)
    setTimeout(() => setScreen('dashboard'), 0)
  }

  function handleJoinFromInvite(address: string) {
    setActivePoolAddress(address)
    setScreen('join')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <button
          onClick={() => setScreen('home')}
          className="text-xl font-bold tracking-tight"
        >
          aavart
        </button>
        <WalletMultiButton />
      </nav>

      {screen === 'home' && (
        <Home
          onCreatePool={() => setScreen('create')}
          onJoinPool={handleJoinFromInvite}
        />
      )}
      {screen === 'create' && (
        <CreatePool
          onBack={() => setScreen('home')}
          onSuccess={goToDashboard}
        />
      )}
      {screen === 'join' && activePoolAddress && (
        <JoinPool
          poolAddress={activePoolAddress}
          onBack={() => setScreen('home')}
          onSuccess={goToDashboard}
        />
      )}
      {screen === 'dashboard' && activePoolAddress && (
        <Dashboard
          poolAddress={activePoolAddress}
          onBack={() => setScreen('home')}
        />
      )}
    </div>
  )
}