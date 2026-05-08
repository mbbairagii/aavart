import { useEffect, useState } from 'react'
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, setProvider } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { IDL } from '../lib/idl'

interface Props {
    onBack: () => void
    onSelectPool: (address: string) => void
}

interface PoolEntry {
    address: string
    contribution: number
    totalMembers: number
    currentRound: number
    totalRounds: number
    status: 'active' | 'completed' | 'pending'
    isCreator: boolean
    isRecipientThisRound: boolean
    hasPaid: boolean
    vault: number
}

const DISPLAY = "'Bebas Neue', 'Arial Black', sans-serif"
const MONO = "'Courier New', Courier, monospace"

export default function MyPools({ onBack, onSelectPool }: Props) {
    const anchorWallet = useAnchorWallet()
    const { connection } = useConnection()
    const [pools, setPools] = useState<PoolEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!anchorWallet) { setLoading(false); return }
        fetchMyPools()
    }, [anchorWallet])

    async function fetchMyPools() {
        if (!anchorWallet) return
        setLoading(true)
        try {
            const provider = new AnchorProvider(connection, anchorWallet, { commitment: 'confirmed' })
            setProvider(provider)
            const program = new Program(IDL as any, provider)
            const wallet = anchorWallet.publicKey
            const allPools = await (program.account as any).pool.all()
            const myPools: PoolEntry[] = []

            for (const { publicKey, account } of allPools) {
                const acc = account as any
                const members: string[] = acc.members?.map((m: PublicKey) => m.toString()) ?? []
                const isCreator = acc.creator?.toString() === wallet.toString()
                const isMember = members.includes(wallet.toString())
                if (!isCreator && !isMember) continue

                const currentRound = acc.currentRound ?? 1
                const totalRounds = acc.totalMembers ?? acc.maxMembers ?? members.length
                const recipient = acc.currentRecipient?.toString() ?? ''
                const contributions: Record<string, boolean> = {}
                if (acc.contributions) {
                    for (const [key, val] of Object.entries(acc.contributions))
                        contributions[key] = val as boolean
                }

                const hasPaid = contributions[wallet.toString()] ?? false
                const isRecipientThisRound = recipient === wallet.toString()
                let status: PoolEntry['status'] = 'pending'
                if (acc.isActive) status = 'active'
                if (acc.isCompleted) status = 'completed'

                let vault = 0
                try { vault = (await connection.getBalance(acc.vault as PublicKey)) / 1e9 } catch { }

                myPools.push({
                    address: publicKey.toString(),
                    contribution: (acc.contributionAmount?.toNumber?.() ?? 0) / 1e9,
                    totalMembers: totalRounds,
                    currentRound, totalRounds, status,
                    isCreator, isRecipientThisRound, hasPaid, vault,
                })
            }

            myPools.sort((a, b) => ({ active: 0, pending: 1, completed: 2 }[a.status] - { active: 0, pending: 1, completed: 2 }[b.status]))
            setPools(myPools)
        } catch (e) { console.error('fetchMyPools error:', e) }
        setLoading(false)
    }

    const statusColor = (s: PoolEntry['status']) =>
        s === 'active' ? '#6fcf97' : s === 'completed' ? '#888' : '#f2c94c'

    const statusLabel = (s: PoolEntry['status']) =>
        s === 'active' ? 'ACTIVE' : s === 'completed' ? 'COMPLETED' : 'PENDING'

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0d0d0d',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '40px 24px 80px',
        }}>
            {/* Card — thick border + offset shadow matching reference */}
            <div style={{
                width: '100%',
                maxWidth: 520,
                background: '#161616',
                border: '2px solid #e8e4db',
                borderRadius: 4,
                boxShadow: '6px 6px 0 #e8e4db',
                padding: '36px 36px 40px',
            }}>
                {/* Back */}
                <button
                    onClick={onBack}
                    style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        letterSpacing: '0.14em',
                        color: 'rgba(232,228,219,0.45)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        marginBottom: 32,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#e8e4db')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,228,219,0.45)')}
                >
                    ← BACK
                </button>

                {/* Heading */}
                <h1 style={{
                    fontFamily: DISPLAY,
                    fontSize: 'clamp(38px, 7vw, 52px)',
                    fontStyle: 'italic',
                    letterSpacing: '0.03em',
                    color: '#e8e4db',
                    lineHeight: 1,
                    margin: '0 0 8px',
                    textTransform: 'uppercase',
                }}>My Pools.</h1>
                <p style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    color: 'rgba(232,228,219,0.45)',
                    letterSpacing: '0.04em',
                    margin: '0 0 32px',
                }}>
                    {!loading
                        ? pools.length === 0
                            ? 'No pools found for this wallet.'
                            : `${pools.length} pool${pools.length > 1 ? 's' : ''} in your circle.`
                        : 'Loading your pools…'}
                </p>

                {/* Divider */}
                <div style={{ borderTop: '1px solid rgba(232,228,219,0.15)', marginBottom: 28 }} />

                {/* Loading skeletons */}
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{
                                height: 80,
                                border: '1px solid rgba(232,228,219,0.15)',
                                borderRadius: 3,
                                background: 'rgba(232,228,219,0.03)',
                                animation: 'shimmer 1.4s ease-in-out infinite',
                            }} />
                        ))}
                    </div>
                )}

                {/* Empty */}
                {!loading && pools.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <p style={{
                            fontFamily: DISPLAY,
                            fontStyle: 'italic',
                            fontSize: 26,
                            color: 'rgba(232,228,219,0.3)',
                            marginBottom: 24,
                            textTransform: 'uppercase',
                        }}>No circles yet.</p>
                        <button
                            onClick={onBack}
                            style={{
                                fontFamily: MONO,
                                fontSize: 11,
                                letterSpacing: '0.18em',
                                background: '#e8e4db',
                                color: '#0d0d0d',
                                border: '2px solid #e8e4db',
                                borderRadius: 3,
                                padding: '12px 24px',
                                cursor: 'pointer',
                                transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                            START ONE →
                        </button>
                    </div>
                )}

                {/* Pool list */}
                {!loading && pools.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {pools.map((pool) => (
                            <button
                                key={pool.address}
                                onClick={() => onSelectPool(pool.address)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    background: 'transparent',
                                    border: '1px solid rgba(232,228,219,0.2)',
                                    borderRadius: 3,
                                    padding: '18px 20px',
                                    cursor: 'pointer',
                                    color: '#e8e4db',
                                    transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto',
                                    gap: '10px 20px',
                                    alignItems: 'center',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(232,228,219,0.05)'
                                    e.currentTarget.style.borderColor = '#e8e4db'
                                    e.currentTarget.style.boxShadow = '3px 3px 0 rgba(232,228,219,0.3)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent'
                                    e.currentTarget.style.borderColor = 'rgba(232,228,219,0.2)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                {/* Left */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: statusColor(pool.status),
                                            display: 'inline-block', flexShrink: 0,
                                        }} />
                                        <span style={{
                                            fontFamily: MONO,
                                            fontSize: 9,
                                            letterSpacing: '0.18em',
                                            color: statusColor(pool.status),
                                        }}>{statusLabel(pool.status)}</span>
                                        {pool.isCreator && (
                                            <span style={{
                                                fontFamily: MONO, fontSize: 8,
                                                letterSpacing: '0.14em',
                                                color: 'rgba(232,228,219,0.4)',
                                                border: '1px solid rgba(232,228,219,0.2)',
                                                padding: '1px 6px', borderRadius: 2,
                                            }}>CREATOR</span>
                                        )}
                                        {pool.isRecipientThisRound && (
                                            <span style={{
                                                fontFamily: MONO, fontSize: 8,
                                                letterSpacing: '0.14em', color: '#f2c94c',
                                                border: '1px solid rgba(242,201,76,0.35)',
                                                padding: '1px 6px', borderRadius: 2,
                                            }}>YOUR TURN</span>
                                        )}
                                    </div>

                                    <p style={{
                                        fontFamily: MONO, fontSize: 9,
                                        color: 'rgba(232,228,219,0.28)',
                                        margin: '0 0 10px',
                                        letterSpacing: '0.06em',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}>
                                        {pool.address.slice(0, 8)}...{pool.address.slice(-6)}
                                    </p>

                                    {/* Stats row — matches the POT-style block */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(3, 1fr)',
                                        gap: 2,
                                    }}>
                                        {[
                                            { label: 'CONTRIBUTION', value: `${pool.contribution} SOL` },
                                            { label: 'ROUND', value: `${pool.currentRound}/${pool.totalRounds}` },
                                            { label: 'VAULT', value: `${pool.vault.toFixed(2)} SOL` },
                                        ].map(({ label, value }) => (
                                            <div key={label} style={{
                                                background: 'rgba(232,228,219,0.04)',
                                                border: '1px solid rgba(232,228,219,0.1)',
                                                borderRadius: 2,
                                                padding: '7px 10px',
                                            }}>
                                                <p style={{
                                                    fontFamily: MONO, fontSize: 8,
                                                    letterSpacing: '0.14em',
                                                    color: 'rgba(232,228,219,0.4)',
                                                    margin: '0 0 3px',
                                                }}>{label}</p>
                                                <p style={{
                                                    fontFamily: DISPLAY,
                                                    fontStyle: 'italic',
                                                    fontSize: 15,
                                                    color: '#e8e4db',
                                                    margin: 0,
                                                    letterSpacing: '0.02em',
                                                }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                    {pool.status === 'active' && (
                                        <span style={{
                                            fontFamily: MONO, fontSize: 8,
                                            letterSpacing: '0.14em',
                                            color: pool.hasPaid ? '#6fcf97' : 'rgba(242,201,76,0.8)',
                                            border: `1px solid ${pool.hasPaid ? 'rgba(111,207,151,0.3)' : 'rgba(242,201,76,0.3)'}`,
                                            padding: '3px 8px', borderRadius: 2,
                                        }}>
                                            {pool.hasPaid ? 'PAID ✓' : 'UNPAID'}
                                        </span>
                                    )}
                                    <span style={{
                                        fontFamily: MONO, fontSize: 10,
                                        color: 'rgba(232,228,219,0.3)',
                                        letterSpacing: '0.04em',
                                    }}>VIEW →</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Refresh */}
                {!loading && pools.length > 0 && (
                    <button
                        onClick={fetchMyPools}
                        style={{
                            fontFamily: MONO, fontSize: 9,
                            letterSpacing: '0.18em',
                            color: 'rgba(232,228,219,0.35)',
                            background: 'none', border: 'none',
                            cursor: 'pointer',
                            marginTop: 20,
                            padding: 0,
                            display: 'block',
                            marginLeft: 'auto',
                            transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#e8e4db')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,228,219,0.35)')}
                    >
                        ↻ REFRESH
                    </button>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
                @keyframes shimmer {
                    0%   { opacity: 0.3; }
                    50%  { opacity: 0.7; }
                    100% { opacity: 0.3; }
                }
            `}</style>
        </div>
    )
}