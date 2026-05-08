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
    const [timeLeft, setTimeLeft] = useState('')

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

    // Countdown timer
    useEffect(() => {
        if (!pool) return
        const statusKey = Object.keys(pool.status)[0]
        if (statusKey !== 'active') return
        const endTime = Date.now() + pool.roundDuration.toNumber() * 1000
        const tick = () => {
            const diff = endTime - Date.now()
            if (diff <= 0) { setTimeLeft('ROUND ENDING'); return }
            const h = Math.floor(diff / 3600000)
            const m = Math.floor((diff % 3600000) / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            setTimeLeft(`${h}h ${m}m ${s}s`)
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [pool])

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
        <div style={{ maxWidth: 520, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>
                CONNECT WALLET FIRST.
            </p>
        </div>
    )

    return (
        <>
            <style>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0;
                    border: 2px solid var(--color-border);
                    box-shadow: 4px 4px 0 var(--color-border);
                }
                .stats-grid-cell {
                    padding: 16px 18px;
                    background: var(--color-surface);
                    border-right: 2px solid var(--color-border);
                }
                .stats-grid-cell:last-child { border-right: none; }

                @media (max-width: 520px) {
                    .stats-grid { grid-template-columns: 1fr !important; }
                    .stats-grid-cell { border-right: none !important; border-bottom: 2px solid var(--color-border); }
                    .stats-grid-cell:last-child { border-bottom: none; }
                    .member-address { max-width: 120px; }
                    .dashboard-wrap { padding: 24px 16px !important; }
                    .pool-address-text { font-size: 9px !important; }
                }
            `}</style>

            <div
                className="dashboard-wrap"
                style={{
                    maxWidth: 680,
                    margin: '0 auto',
                    padding: '40px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                }}
            >
                {/* header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                        onClick={onBack}
                        style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: 12,
                            color: 'var(--color-text-muted)',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                    >← BACK</button>
                    <button
                        onClick={copyInvite}
                        className={copied ? 'btn-comic' : 'btn-comic btn-comic-outline'}
                        style={{ fontSize: 13, padding: '8px 16px' }}
                    >
                        {copied ? '✓ COPIED' : 'COPY INVITE'}
                    </button>
                </div>

                {/* pool address */}
                <div style={{
                    background: 'var(--color-surface)',
                    border: '2px solid var(--color-border)',
                    padding: '8px 14px',
                    boxShadow: '3px 3px 0 var(--color-border)',
                }}>
                    <p className="pool-address-text" style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-ui)',
                        color: 'var(--color-text-muted)',
                        wordBreak: 'break-all',
                        margin: 0,
                    }}>{poolAddress}</p>
                </div>

                {loading && (
                    <p style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 22,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        color: 'var(--color-text)',
                    }}>LOADING...</p>
                )}

                {pool && (
                    <>
                        {/* status bar */}
                        <div style={{
                            background: 'var(--color-surface)',
                            padding: '12px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: '2px solid var(--color-border)',
                            boxShadow: '4px 4px 0 var(--color-border)',
                            flexWrap: 'wrap',
                            gap: 8,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                    background: isWaiting ? '#fbbf24' : isActive ? '#aef359' : 'var(--color-text-faint)',
                                    boxShadow: isActive ? '0 0 12px #aef359' : 'none',
                                }} />
                                <span style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: 'var(--color-text)',
                                    letterSpacing: '0.06em',
                                }}>
                                    {isWaiting ? 'WAITING' : isActive ? 'ACTIVE' : 'COMPLETE'}
                                </span>
                            </div>
                            {isActive && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <span style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: 18,
                                        fontWeight: 700,
                                        color: 'var(--color-text)',
                                        letterSpacing: '0.04em',
                                    }}>
                                        ROUND {pool.currentRound + 1} / {pool.maxMembers}
                                    </span>
                                    {timeLeft && (
                                        <span style={{
                                            fontFamily: 'var(--font-ui)',
                                            fontSize: 12,
                                            color: 'var(--color-text-muted)',
                                            letterSpacing: '0.04em',
                                        }}>{timeLeft}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* stats grid */}
                        <div className="stats-grid">
                            {[
                                { label: 'CONTRIBUTION', value: `${contributionSOL} SOL` },
                                { label: 'POT / ROUND', value: `${potSOL} SOL` },
                                { label: 'VAULT', value: `${vaultBalance.toFixed(2)} SOL` },
                            ].map((s) => (
                                <div key={s.label} className="stats-grid-cell">
                                    <div style={{
                                        fontFamily: 'var(--font-ui)',
                                        fontSize: 9,
                                        color: 'var(--color-text-muted)',
                                        letterSpacing: '0.1em',
                                        marginBottom: 6,
                                        textTransform: 'uppercase' as const,
                                    }}>{s.label}</div>
                                    <div style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: 22,
                                        fontWeight: 700,
                                        letterSpacing: '0.03em',
                                        color: 'var(--color-text)',
                                    }}>{s.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* waiting — member progress */}
                        {isWaiting && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: 14, fontWeight: 700,
                                        letterSpacing: '0.06em',
                                        color: 'var(--color-text)',
                                    }}>
                                        {pool.members.length} / {pool.maxMembers} MEMBERS
                                    </span>
                                    <span style={{
                                        fontFamily: 'var(--font-ui)',
                                        fontSize: 11,
                                        color: 'var(--color-text-muted)',
                                    }}>
                                        WAITING FOR {pool.maxMembers - pool.members.length} MORE
                                    </span>
                                </div>
                                <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2 }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${(pool.members.length / pool.maxMembers) * 100}%`,
                                        background: '#fbbf24',
                                        borderRadius: 2,
                                        transition: 'width 0.4s ease',
                                    }} />
                                </div>
                            </div>
                        )}

                        {/* members list */}
                        <div>
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 14, fontWeight: 700,
                                letterSpacing: '0.08em',
                                color: 'var(--color-text-muted)',
                                marginBottom: 10,
                            }}>
                                {isActive ? `ROUND ${pool.currentRound + 1} PAYMENTS` : 'MEMBERS'}
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                border: '2px solid var(--color-border)',
                                boxShadow: '4px 4px 0 var(--color-border)',
                            }}>
                                {pool.members.map((m, i) => {
                                    const isMe = m.toString() === myKey
                                    const isRecipient = pool.recipients[pool.currentRound]?.toString() === m.toString()
                                    const paid = pool.paidThisRound[i]
                                    return (
                                        <div key={i} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '12px 16px',
                                            background: isMe ? 'var(--color-surface-offset)' : 'var(--color-surface)',
                                            borderBottom: i < pool.members.length - 1 ? '1px solid var(--color-border)' : 'none',
                                        }}>
                                            <div style={{
                                                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                                background: !isActive ? 'var(--color-text-faint)' : paid ? '#aef359' : 'var(--color-text-faint)',
                                                boxShadow: paid && isActive ? '0 0 8px #aef359' : 'none',
                                            }} />
                                            <span
                                                className="member-address"
                                                style={{
                                                    fontSize: 11,
                                                    fontFamily: 'var(--font-ui)',
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    color: isMe ? 'var(--color-text)' : 'var(--color-text-muted)',
                                                    fontWeight: isMe ? 500 : 400,
                                                }}
                                            >
                                                {m.toString().slice(0, 20)}...{m.toString().slice(-6)}
                                            </span>
                                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                                {isRecipient && isActive && (
                                                    <span style={{
                                                        fontFamily: 'var(--font-display)',
                                                        fontSize: 12, fontWeight: 700,
                                                        color: '#fbbf24',
                                                        letterSpacing: '0.06em',
                                                    }}>RECIPIENT</span>
                                                )}
                                                {isMe && (
                                                    <span style={{
                                                        fontFamily: 'var(--font-display)',
                                                        fontSize: 12, fontWeight: 700,
                                                        color: '#aef359',
                                                        letterSpacing: '0.06em',
                                                    }}>YOU</span>
                                                )}
                                                {isActive && (
                                                    <span style={{
                                                        fontFamily: 'var(--font-display)',
                                                        fontSize: 12, fontWeight: 700,
                                                        letterSpacing: '0.06em',
                                                        color: paid ? '#aef359' : 'var(--color-text-faint)',
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
                                    <button
                                        onClick={handleContribute}
                                        disabled={actionLoading}
                                        className="btn-comic"
                                        style={{ width: '100%', textAlign: 'center', fontSize: 20 }}
                                    >
                                        {actionLoading ? 'CONFIRMING...' : `CONTRIBUTE ${contributionSOL} SOL →`}
                                    </button>
                                )}
                                {alreadyPaid && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '14px',
                                        border: '2px solid var(--color-border)',
                                        boxShadow: '3px 3px 0 var(--color-border)',
                                        background: 'var(--color-surface)',
                                    }}>
                                        <span style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: 18, fontWeight: 700,
                                            letterSpacing: '0.06em',
                                            color: '#aef359',
                                        }}>✓ PAID THIS ROUND</span>
                                    </div>
                                )}
                                {isMyTurnToClaim && (
                                    <button
                                        onClick={handleClaim}
                                        disabled={actionLoading || !allPaid}
                                        className="btn-comic"
                                        style={{ width: '100%', textAlign: 'center', fontSize: 20 }}
                                    >
                                        {actionLoading ? 'CONFIRMING...' : !allPaid ? 'WAITING FOR ALL PAYMENTS...' : `CLAIM ${potSOL} SOL →`}
                                    </button>
                                )}
                            </div>
                        )}

                        {isComplete && (
                            <div style={{
                                textAlign: 'center',
                                padding: '20px',
                                border: '3px solid var(--color-border)',
                                boxShadow: '5px 5px 0 var(--color-border)',
                                background: 'var(--color-surface)',
                            }}>
                                <p style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 28, fontWeight: 800,
                                    letterSpacing: '0.06em',
                                    color: '#aef359',
                                }}>🎉 POOL COMPLETE!</p>
                                <p style={{
                                    fontFamily: 'var(--font-ui)',
                                    fontSize: 12,
                                    color: 'var(--color-text-muted)',
                                    marginTop: 6,
                                }}>all rounds finished.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    )
}