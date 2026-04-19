import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

export default function Home({ onCreatePool }: { onCreatePool: () => void }) {
    const { connected } = useWallet()
    const [joinCode, setJoinCode] = useState('')

    return (
        <div className="max-w-lg mx-auto px-6 py-16 flex flex-col gap-10">
            <div className="text-center flex flex-col gap-3">
                <h1 className="text-4xl font-bold tracking-tight">trustless chit funds</h1>
                <p className="text-zinc-400">pool SOL with friends. one person wins the pot each round. nobody can cheat.</p>
            </div>

            <div className="flex flex-col gap-4">
                <button
                    onClick={onCreatePool}
                    disabled={!connected}
                    className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    create a pool
                </button>

                <div className="flex flex-col gap-2">
                    <input
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value)}
                        placeholder="paste invite link or pool address"
                        className="w-full py-4 px-4 bg-zinc-900 rounded-xl border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                    <button
                        disabled={!joinCode || !connected}
                        className="w-full py-4 bg-zinc-900 border border-zinc-700 font-semibold rounded-xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                        join pool
                    </button>
                </div>

                {!connected && (
                    <p className="text-center text-zinc-600 text-sm">connect wallet to continue</p>
                )}
            </div>
        </div>
    )
}