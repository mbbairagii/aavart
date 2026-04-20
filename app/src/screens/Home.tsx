import { useState } from 'react'

interface Props {
    onCreatePool: () => void
    onJoinPool: (address: string) => void
}

export default function Home({ onCreatePool, onJoinPool }: Props) {
    const [inviteInput, setInviteInput] = useState('')

    function handleJoin() {
        const trimmed = inviteInput.trim()
        if (!trimmed) return
        // support both raw address and full URL
        try {
            const url = new URL(trimmed)
            const addr = url.searchParams.get('pool')
            if (addr) { onJoinPool(addr); return }
        } catch {
            // not a URL — treat as raw address
        }
        onJoinPool(trimmed)
    }

    return (
        <div className="max-w-lg mx-auto px-6 py-16 flex flex-col gap-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">aavart</h1>
                <p className="text-zinc-400 text-sm">
                    trustless on-chain chit fund on Solana
                </p>
            </div>

            {/* create */}
            <button
                onClick={onCreatePool}
                className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 transition"
            >
                create a pool
            </button>

            {/* join with invite */}
            <div className="flex flex-col gap-3">
                <p className="text-sm text-zinc-400">have an invite link?</p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inviteInput}
                        onChange={e => setInviteInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleJoin()}
                        placeholder="paste pool address or invite link"
                        className="flex-1 py-3 px-4 bg-zinc-900 rounded-xl border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
                    />
                    <button
                        onClick={handleJoin}
                        disabled={!inviteInput.trim()}
                        className="px-5 py-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium"
                    >
                        join
                    </button>
                </div>
            </div>
        </div>
    )
}