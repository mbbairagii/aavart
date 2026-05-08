import { Buffer } from 'buffer'
(window as any).global = window;
(window as any).Buffer = Buffer;
import { createRoot } from 'react-dom/client'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <ConnectionProvider endpoint={import.meta.env.VITE_HELIUS_RPC}>
    <WalletProvider wallets={[]} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)