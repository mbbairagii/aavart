import { useState, useEffect, useCallback } from 'react'
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, setProvider } from '@coral-xyz/anchor'
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { IDL } from '../lib/idl'
import { getVaultPDA, TREASURY } from '../lib/program'

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

interface Props { poolAddress: string; onBack: () => void }

export default function Dashboard({ poolAddress, onBack }: Props) {
    const anchorWallet = useAnchorWallet()
    const { connection } = useConnection()
    const [pool, setPool] = useState<PoolData | null>(null)
    const [vaultBalance, setVaultBalance] = useState<number>(0)
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const poolPubkey = (() => { try { return new PublicKey(poolAddress) } catch { return null } })()

    async function getProgram() {
        if (!anchorWallet) throw new Error('wallet not connected')
        const provider = new AnchorProvider(connection, anchorWallet, { preflightCommitment: 'confirmed', commitment: 'confirmed' })
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
        } catch (e) { console.error(e) }
        setLoading(false)
    }, [poolPubkey, anchorWallet, connection])

    useEffect(() => { if (anchorWallet) fetchPool() }, [anchorWallet, poolAddress])

    async function handleContribute() {
        if (!anchorWallet || !poolPubkey || !pool) return
        setActionLoading(true)
        try {
            const { program } = await getProgram()
            const [vaultPDA] = getVaultPDA(poolPubkey)
            const tx = await (program.methods as any).contribute()
                .accounts({ member: anchorWallet.publicKey, pool: poolPubkey, vault: vaultPDA, systemProgram: SystemProgram.programId })
                .transaction()
            tx.feePayer = anchorWallet.publicKey
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
            const signed = await anchorWallet.signTransaction(tx)
            const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true })
            await connection.confirmTransaction(sig, 'confirmed')
            await fetchPool()
        } catch (e: any) {
            console.error('logs:', e.logs); console.error('full:', e)
            alert('error: ' + (e.message ?? e.toString()))
        }
        setActionLoading(false)
    }

    async function handleClaim() {
        if (!anchorWallet || !poolPubkey || !pool) return
        setActionLoading(true)
        try {
            const { program } = await getProgram()
            const [vaultPDA] = getVaultPDA(poolPubkey)
            const tx = await (program.methods as any).claim()
                .accounts({ recipient: anchorWallet.publicKey, pool: poolPubkey, vault: vaultPDA, treasury: TREASURY, systemProgram: SystemProgram.programId })
                .transaction()
            tx.feePayer = anchorWallet.publicKey
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
            const signed = await anchorWallet.signTransaction(tx)
            const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true })
            console.log('explorer:', `https://explorer.solana.com/tx/${sig}?cluster=devnet`)
            await connection.confirmTransaction(sig, 'confirmed')
            await new Promise(r => setTimeout(r, 1500))
            await fetchPool()
        } catch (e: any) {
            console.error('logs:', e.logs); console.error('full:', e)
            alert('error: ' + (e.message ?? e.toString()))
        }
        setActionLoading(false)
    }

    async function copyInvite() {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/?pool=${poolAddress}`)
            setCopied(true); setTimeout(() => setCopied(false), 2000)
        } catch { }
    }

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

    if (!anchorWallet) return (
        <div style={{ maxWidth: 520, margin: '80px auto', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '0.06em', color: '#888' }}>CONNECT WALLET FIRST.</p>
        </div>
    )

    return (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={onBack} style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: '#666', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>← BACK</button>
                <button onClick={copyInvite}
                    className={copied ? 'btn-comic' : 'btn-comic btn-comic-outline'}
                    style={{ fontSize: 13, padding: '8px 16px' }}>
                    {copied ? '✓ COPIED' : 'COPY INVITE'}
                </button>
            </div>

            {/* pool address */}
            <div style={{ background: '#fff', border: '2px solid #111', padding: '8px 14px', boxShadow: '3px 3px 0 #111' }}>
                <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#888', wordBreak: 'break-all' }}>{poolAddress}</p>
            </div>

            {loading && <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.06em' }}>LOADING...</p>}

            {pool && (
                <>
                    {/* status bar */}
                    <div style={{
                        background: '#111', padding: '12px 20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        border: '2px solid #111', boxShadow: '4px 4px 0 #555',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: isWaiting ? '#fbbf24' : isActive ? '#aef359' : '#555',
                                boxShadow: isActive ? '0 0 12px #aef359' : 'none',
                            }} />
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#f5f2eb', letterSpacing: '0.06em' }}>
                                {isWaiting ? 'WAITING' : isActive ? 'ACTIVE' : 'COMPLETE'}
                            </span>
                        </div>
                        {isActive && (
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#f5f2eb', letterSpacing: '0.04em' }}>
                                ROUND {pool.currentRound + 1} / {pool.maxMembers}
                            </span>
                        )}
                    </div>

                    {/* stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
                        {[
                            { label: 'CONTRIBUTION', value: `${contributionSOL} SOL` },
                            { label: 'POT / ROUND', value: `${potSOL} SOL` },
                            { label: 'VAULT', value: `${vaultBalance.toFixed(2)} SOL` },
                        ].map((s, i) => (
                            <div key={s.label} style={{
                                padding: '16px 18px', background: '#fff',
                                borderRight: i < 2 ? '2px solid #111' : 'none',
                            }}>
                                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 9, color: '#888', letterSpacing: '0.1em', marginBottom: 6, textTransform: 'uppercase' }}>{s.label}</div>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.03em' }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* members list */}
                    <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.08em', color: '#888', marginBottom: 10 }}>
                            {isActive ? `ROUND ${pool.currentRound + 1} PAYMENTS` : 'MEMBERS'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', border: '2px solid #111', boxShadow: '4px 4px 0 #111' }}>
                            {pool.members.map((m, i) => {
                                const isMe = m.toString() === myKey
                                const isRecipient = pool.recipients[pool.currentRound]?.toString() === m.toString()
                                const paid = pool.paidThisRound[i]
                                return (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '12px 16px', background: isMe ? '#111' : '#fff',
                                        borderBottom: i < pool.members.length - 1 ? '1px solid #ddd' : 'none',
                                    }}>
                                        <div style={{
                                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                            background: !isActive ? '#ccc' : paid ? '#aef359' : '#ccc',
                                            boxShadow: paid && isActive ? '0 0 8px #aef359' : 'none',
                                        }} />
                                        <span style={{
                                            fontSize: 11, fontFamily: 'monospace', flex: 1,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            color: isMe ? '#f5f2eb' : '#333',
                                        }}>
                                            {m.toString().slice(0, 20)}...{m.toString().slice(-6)}
                                        </span>
                                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                            {isRecipient && isActive && (
                                                <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: '#fbbf24', letterSpacing: '0.06em' }}>RECIPIENT</span>
                                            )}
                                            {isMe && <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: '#aef359', letterSpacing: '0.06em' }}>YOU</span>}
                                            {isActive && (
                                                <span style={{
                                                    fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.06em',
                                                    color: paid ? '#aef359' : isMe ? '#888' : '#ccc',
                                                }}>
                                                    {paid ? 'PAID' : 'UNPAID'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* actions */}
                    {isActive && isMember && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {!alreadyPaid && (
                                <button onClick={handleContribute} disabled={actionLoading} className="btn-comic" style={{ width: '100%', textAlign: 'center', fontSize: 20 }}>
                                    {actionLoading ? 'CONFIRMING...' : `CONTRIBUTE ${contributionSOL} SOL →`}
                                </button>
                            )}
                            {alreadyPaid && (
                                <div style={{ textAlign: 'center', padding: '14px', border: '2px solid #111', boxShadow: '3px 3px 0 #111', background: '#fff' }}>
                                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.06em' }}>✓ PAID THIS ROUND</span>
                                </div>
                            )}
                            {isMyTurnToClaim && (
                                <button onClick={handleClaim} disabled={actionLoading || !allPaid} className="btn-comic" style={{ width: '100%', textAlign: 'center', fontSize: 20, background: allPaid && !actionLoading ? '#111' : undefined }}>
                                    {actionLoading ? 'CONFIRMING...' : !allPaid ? 'WAITING FOR ALL PAYMENTS...' : `CLAIM ${potSOL} SOL →`}
                                </button>
                            )}
                        </div>
                    )}

                    {isWaiting && (
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#888', letterSpacing: '0.06em', textAlign: 'center', padding: '16px 0' }}>
                            WAITING FOR {pool.maxMembers - pool.members.length} MORE MEMBER(S).
                        </p>
                    )}

                    {isComplete && (
                        <div style={{ textAlign: 'center', padding: '20px', border: '3px solid #111', boxShadow: '5px 5px 0 #111', background: '#111' }}>
                            <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.06em', color: '#aef359' }}>🎉 POOL COMPLETE!</p>
                            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: '#888', marginTop: 6 }}>all rounds finished.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}