import { useState, useEffect, useCallback } from 'react'
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, setProvider } from '@coral-xyz/anchor'
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { IDL } from '../lib/idl'
import { getVaultPDA, PROGRAM_ID, TREASURY } from '../lib/program'

interface PoolData {
    creator: PublicKey
    contributionAmount: { toNumber: () => number }
    maxMembers: number
    roundDuration: { toNumber: () => number }
    currentRound: number
    members: PublicKey[]
    recipients: PublicKey[]
    paidThisRound: boolean[]
    status: Record<string, object>
    vaultBump: number
    bump: number
}

interface Props {
    poolAddress: string
    onBack: () => void
}

export default function Dashboard({ poolAddress, onBack }: Props) {
    const anchorWallet = useAnchorWallet()
    const { connection } = useConnection()
    const [pool, setPool] = useState<PoolData | null>(null)
    const [vaultBalance, setVaultBalance] = useState<number>(0)
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const poolPubkey = (() => {
        try { return new PublicKey(poolAddress) }
        catch { return null }
    })()

    async function getProgram() {
        if (!anchorWallet) throw new Error('wallet not connected')
        const provider = new AnchorProvider(connection, anchorWallet, {
            preflightCommitment: 'confirmed',
            commitment: 'confirmed',
        })
        setProvider(provider)
        return { program: new Program(IDL as any, provider), provider }
    }

    const fetchPool = useCallback(async () => {
        if (!poolPubkey) return
        setLoading(true)
        try {
            const { program } = await getProgram()
            const data = await (program.account as any).pool.fetch(poolPubkey)
            setPool(data as PoolData)
            const [vaultPDA] = getVaultPDA(poolPubkey)
            const bal = await connection.getBalance(vaultPDA)
            setVaultBalance(bal / LAMPORTS_PER_SOL)
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }, [poolPubkey, anchorWallet, connection])

    useEffect(() => {
        if (anchorWallet) fetchPool()
    }, [anchorWallet, poolAddress])

    async function handleContribute() {
        if (!anchorWallet || !poolPubkey || !pool) return
        setActionLoading(true)
        try {
            const { program, provider } = await getProgram()
            const [vaultPDA] = getVaultPDA(poolPubkey)
            const tx = await (program.methods as any)
                .contribute()
                .accounts({
                    member: anchorWallet.publicKey,
                    pool: poolPubkey,
                    vault: vaultPDA,
                    systemProgram: SystemProgram.programId,
                })
                .transaction()
            tx.feePayer = anchorWallet.publicKey
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
            await provider.sendAndConfirm(tx, [], { skipPreflight: true })
            await fetchPool()
        } catch (e: any) {
            alert('error: ' + e.message)
        }
        setActionLoading(false)
    }

    async function handleClaim() {
        if (!anchorWallet || !poolPubkey || !pool) return
        setActionLoading(true)
        try {
            const { program, provider } = await getProgram()
            const [vaultPDA] = getVaultPDA(poolPubkey)
            const tx = await (program.methods as any)
                .claim()
                .accounts({
                    recipient: anchorWallet.publicKey,
                    pool: poolPubkey,
                    vault: vaultPDA,
                    treasury: TREASURY,
                    systemProgram: SystemProgram.programId,
                })
                .transaction()
            tx.feePayer = anchorWallet.publicKey
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
            await provider.sendAndConfirm(tx, [], { skipPreflight: true })
            await fetchPool()
        } catch (e: any) {
            alert('error: ' + e.message)
        }
        setActionLoading(false)
    }

    async function copyInvite() {
        const url = `${window.location.origin}/?pool=${poolAddress}`
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // derived state
    const myKey = anchorWallet?.publicKey.toString()
    const myIndex = pool ? pool.members.findIndex(m => m.toString() === myKey) : -1
    const isMember = myIndex !== -1
    const alreadyPaid = pool && myIndex !== -1 ? pool.paidThisRound[myIndex] : false
    const currentRecipient = pool ? pool.recipients[pool.currentRound]?.toString() : null
    const isMyTurnToClaim = currentRecipient === myKey
    const allPaid = pool ? pool.paidThisRound.every(p => p) : false
    const statusKey = pool ? Object.keys(pool.status)[0] : null
    const isActive = statusKey === 'active'
    const isWaiting = statusKey === 'waitingForMembers'
    const isComplete = statusKey === 'complete'
    const contributionSOL = pool ? (pool.contributionAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2) : '0'
    const potSOL = pool ? (pool.contributionAmount.toNumber() * pool.maxMembers / LAMPORTS_PER_SOL).toFixed(2) : '0'

    if (!anchorWallet) {
        return (
            <div className="max-w-lg mx-auto px-6 py-16 text-center text-zinc-500">
                connect your wallet to view this pool
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">

            {/* header */}
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="text-zinc-500 hover:text-white text-sm transition">
                    ← back
                </button>
                <button onClick={copyInvite}
                    className="text-xs px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition">
                    {copied ? '✓ copied' : 'copy invite link'}
                </button>
            </div>

            {/* pool address */}
            <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                <p className="text-zinc-500 text-xs font-mono break-all">{poolAddress}</p>
            </div>

            {loading && (
                <div className="text-zinc-500 text-sm animate-pulse">loading pool...</div>
            )}

            {pool && (
                <>
                    {/* status + round */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isWaiting ? 'bg-yellow-400' :
                                    isActive ? 'bg-green-400' : 'bg-zinc-500'
                                }`} />
                            <span className="text-sm text-zinc-400">
                                {isWaiting ? 'waiting for members' :
                                    isActive ? 'active' : 'complete'}
                            </span>
                        </div>
                        {isActive && (
                            <span className="text-sm text-zinc-400">
                                round <span className="text-white font-semibold">{pool.currentRound + 1}</span> of {pool.maxMembers}
                            </span>
                        )}
                    </div>

                    {/* stats grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                            <p className="text-zinc-500 text-xs mb-1">contribution</p>
                            <p className="text-lg font-bold">{contributionSOL} SOL</p>
                        </div>
                        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                            <p className="text-zinc-500 text-xs mb-1">pot per round</p>
                            <p className="text-lg font-bold">{potSOL} SOL</p>
                        </div>
                        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                            <p className="text-zinc-500 text-xs mb-1">vault balance</p>
                            <p className="text-lg font-bold">{vaultBalance.toFixed(2)} SOL</p>
                        </div>
                    </div>

                    {/* payment grid */}
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-zinc-400">
                            {isActive ? `round ${pool.currentRound + 1} payments` : 'members'}
                        </p>
                        {pool.members.map((m, i) => {
                            const isMe = m.toString() === myKey
                            const isRecipient = pool.recipients[pool.currentRound]?.toString() === m.toString()
                            const paid = pool.paidThisRound[i]
                            return (
                                <div key={i} className="flex items-center gap-3 py-3 px-4 bg-zinc-900 rounded-xl border border-zinc-800">
                                    {/* paid indicator */}
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!isActive ? 'bg-zinc-600' :
                                            paid ? 'bg-green-400' : 'bg-zinc-600'
                                        }`} />
                                    <span className="text-xs font-mono text-zinc-300 truncate flex-1">
                                        {m.toString().slice(0, 20)}...{m.toString().slice(-6)}
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {isRecipient && isActive && (
                                            <span className="text-xs text-yellow-400 font-medium">recipient</span>
                                        )}
                                        {isMe && (
                                            <span className="text-xs text-zinc-500">you</span>
                                        )}
                                        {isActive && (
                                            <span className={`text-xs font-medium ${paid ? 'text-green-400' : 'text-zinc-600'}`}>
                                                {paid ? 'paid' : 'unpaid'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* actions */}
                    {isActive && isMember && (
                        <div className="flex flex-col gap-3">
                            {/* contribute */}
                            {!alreadyPaid && (
                                <button onClick={handleContribute}
                                    disabled={actionLoading || alreadyPaid}
                                    className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                                    {actionLoading ? 'confirming...' : `contribute ${contributionSOL} SOL`}
                                </button>
                            )}
                            {alreadyPaid && (
                                <div className="w-full py-4 text-center text-green-400 text-sm font-medium bg-zinc-900 rounded-xl border border-zinc-800">
                                    ✓ you've paid this round
                                </div>
                            )}

                            {/* claim */}
                            {isMyTurnToClaim && (
                                <button onClick={handleClaim}
                                    disabled={actionLoading || !allPaid}
                                    className="w-full py-4 bg-green-500 text-black font-semibold rounded-xl hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition">
                                    {actionLoading ? 'confirming...' :
                                        !allPaid ? `claim ${potSOL} SOL (waiting for all payments)` :
                                            `claim ${potSOL} SOL`}
                                </button>
                            )}
                        </div>
                    )}

                    {isWaiting && (
                        <div className="text-center text-zinc-500 text-sm py-4">
                            waiting for {pool.maxMembers - pool.members.length} more member(s) to join
                        </div>
                    )}

                    {isComplete && (
                        <div className="text-center text-green-400 text-sm py-4 bg-zinc-900 rounded-xl border border-zinc-800">
                            🎉 pool complete — all rounds finished
                        </div>
                    )}
                </>
            )}
        </div>
    )
}