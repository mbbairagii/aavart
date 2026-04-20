import { useState, useEffect } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Home from './screens/Home'
import CreatePool from './screens/CreatePool'
import JoinPool from './screens/JoinPool'

export type Screen = 'home' | 'create' | 'join'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [joinPoolAddress, setJoinPoolAddress] = useState<string | null>(null)

  // handle invite links: /?pool=<address>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const poolAddress = params.get('pool')
    if (poolAddress) {
      setJoinPoolAddress(poolAddress)
      setScreen('join')
    }
  }, [])

  function handleJoinFromInvite(address: string) {
    setJoinPoolAddress(address)
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
        <CreatePool onBack={() => setScreen('home')} />
      )}
      {screen === 'join' && joinPoolAddress && (
        <JoinPool
          poolAddress={joinPoolAddress}
          onBack={() => setScreen('home')}
        />
      )}
    </div>
  )
}