import { useState, useEffect } from 'react'
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, setProvider } from '@coral-xyz/anchor'
import { SystemProgram, PublicKey } from '@solana/web3.js'
import { IDL } from '../lib/idl'
import {getVaultPDA} from '../lib/program'

interface PoolData {
    creator: PublicKey
    contributionAmount: { toNumber: () => number }
    maxMembers: number
    roundDuration: { toNumber: () => number }
    members: PublicKey[]
    status: Record<string, object>
}

interface Props {
    poolAddress: string
    onBack: () => void
    onSuccess: (poolAddress: string) => void
}

export default function JoinPool({ poolAddress, onBack, onSuccess }: Props) {
    const anchorWallet = useAnchorWallet()
    const { connection } = useConnection()
    const [poolData, setPoolData] = useState<PoolData | null>(null)
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [joined, setJoined] = useState(false)

    const poolPubkey = (() => {
        try { return new PublicKey(poolAddress) }
        catch { return null }
    })()

    useEffect(() => {
        if (!poolPubkey || !anchorWallet) { setFetching(false); return }
        fetchPool()
    }, [poolAddress, anchorWallet])

    async function getProgram() {
        if (!anchorWallet) throw new Error('wallet not connected')
        const provider = new AnchorProvider(connection, anchorWallet, {
            preflightCommitment: 'confirmed',
            commitment: 'confirmed',
        })
        setProvider(provider)
        return new Program(IDL as any, provider)
    }

    async function fetchPool() {
        if (!poolPubkey) return
        setFetching(true)
        try {
            const program = await getProgram()
            // cast via unknown to bypass the AccountNamespace type error
            const data = await (program.account as any).pool.fetch(poolPubkey)
            setPoolData(data as PoolData)
        } catch (e: any) {
            setError('pool not found or invalid address')
        }
        setFetching(false)
    }

    async function handleJoin() {
        if (!anchorWallet || !poolPubkey || !poolData) return
        setLoading(true)
        setError(null)
        try {
            const program = await getProgram()
            const [vaultPDA] = getVaultPDA(poolPubkey)

            await program.methods
                .joinPool()
                .accounts({
                    member: anchorWallet.publicKey,
                    pool: poolPubkey,
                    vault: vaultPDA,
                    systemProgram: SystemProgram.programId,
                })
                .rpc({ skipPreflight: true, commitment: 'confirmed' })

            setJoined(true)
            await fetchPool()
            setTimeout(() => onSuccess(poolAddress), 1500)
        } catch (e: any) {
            setError(e.message)
        }
        setLoading(false)
    }

    const isAlreadyMember = poolData && anchorWallet
        ? poolData.members.some(m => m.toString() === anchorWallet.publicKey.toString())
        : false

    const isFull = poolData
        ? poolData.members.length >= poolData.maxMembers
        : false

    const statusLabel = poolData
        ? Object.keys(poolData.status)[0] === 'waitingForMembers'
            ? 'waiting for members'
            : Object.keys(poolData.status)[0] === 'active'
                ? 'active'
                : 'complete'
        : null

    const contributionSOL = poolData
        ? (poolData.contributionAmount.toNumber() / 1e9).toFixed(2)
        : null

    const potSOL = poolData
        ? (poolData.contributionAmount.toNumber() * poolData.maxMembers / 1e9).toFixed(2)
        : null

    const durationDays = poolData
        ? Math.round(poolData.roundDuration.toNumber() / 86400)
        : null

    return (
        <div className="max-w-lg mx-auto px-6 py-12 flex flex-col gap-8">
            <button onClick={onBack} className="text-zinc-500 hover:text-white text-sm transition">
                ← back
            </button>

            <h2 className="text-2xl font-bold">join pool</h2>

            <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                <p className="text-zinc-500 text-xs font-mono break-all">{poolAddress}</p>
            </div>

            {fetching && (
                <div className="text-zinc-500 text-sm animate-pulse">loading pool...</div>
            )}

            {!fetching && error && (
                <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {!fetching && poolData && (
                <>
                    {/* pool info */}
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                                <p className="text-zinc-500 text-xs mb-1">contribution</p>
                                <p className="text-xl font-bold">{contributionSOL} SOL</p>
                            </div>
                            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                                <p className="text-zinc-500 text-xs mb-1">pot per round</p>
                                <p className="text-xl font-bold">{potSOL} SOL</p>
                            </div>
                            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                                <p className="text-zinc-500 text-xs mb-1">members</p>
                                <p className="text-xl font-bold">
                                    {poolData.members.length} / {poolData.maxMembers}
                                </p>
                            </div>
                            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                                <p className="text-zinc-500 text-xs mb-1">round duration</p>
                                <p className="text-xl font-bold">{durationDays}d</p>
                            </div>
                        </div>

                        {/* status badge */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusLabel === 'waiting for members' ? 'bg-yellow-400' :
                                statusLabel === 'active' ? 'bg-green-400' : 'bg-zinc-500'
                                }`} />
                            <span className="text-sm text-zinc-400">{statusLabel}</span>
                        </div>
                    </div>

                    {/* member list */}
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-zinc-400">members</p>
                        {poolData.members.map((m, i) => (
                            <div key={i} className="flex items-center gap-3 py-2 px-3 bg-zinc-900 rounded-lg border border-zinc-800">
                                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                                <span className="text-xs font-mono text-zinc-300 truncate">
                                    {m.toString()}
                                </span>
                                {anchorWallet && m.toString() === anchorWallet.publicKey.toString() && (
                                    <span className="text-xs text-zinc-500 ml-auto flex-shrink-0">you</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* action */}
                    {joined ? (
                        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 text-center">
                            <p className="text-green-400 font-semibold">joined!</p>
                            <p className="text-zinc-500 text-sm mt-1">
                                {poolData.members.length >= poolData.maxMembers
                                    ? 'pool is now active — first round has begun'
                                    : `waiting for ${poolData.maxMembers - poolData.members.length} more member(s)`}
                            </p>
                        </div>
                    ) : isAlreadyMember ? (
                        <div className="text-zinc-500 text-sm text-center py-4">
                            you're already in this pool
                        </div>
                    ) : isFull ? (
                        <div className="text-zinc-500 text-sm text-center py-4">
                            this pool is full
                        </div>
                    ) : Object.keys(poolData.status)[0] !== 'waitingForMembers' ? (
                        <div className="text-zinc-500 text-sm text-center py-4">
                            this pool is no longer accepting members
                        </div>
                    ) : (
                        <button
                            onClick={handleJoin}
                            disabled={!anchorWallet || loading}
                            className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            {loading
                                ? 'joining...'
                                : `join for ${contributionSOL} SOL`}
                        </button>
                    )}
                </>
            )}
        </div>
    )
}