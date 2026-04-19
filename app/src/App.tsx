import { useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import Home from './screens/Home'
import CreatePool from './screens/CreatePool'

export type Screen = 'home' | 'create'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <button onClick={() => setScreen('home')} className="text-xl font-bold tracking-tight">aavart</button>
        <WalletMultiButton />
      </nav>
      {screen === 'home' && <Home onCreatePool={() => setScreen('create')} />}
      {screen === 'create' && <CreatePool onBack={() => setScreen('home')} />}
    </div>
  )
}