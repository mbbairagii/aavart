import { useState, useEffect } from 'react'
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, setProvider } from '@coral-xyz/anchor'
import { SystemProgram, PublicKey } from '@solana/web3.js'
import { IDL } from '../lib/idl'
import { getVaultPDA } from '../lib/program'

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

    const poolPubkey = (() => { try { return new PublicKey(poolAddress) } catch { return null } })()

    useEffect(() => {
        if (!poolPubkey || !anchorWallet) { setFetching(false); return }
        fetchPool()
    }, [poolAddress, anchorWallet])

    async function getProgram() {
        if (!anchorWallet) throw new Error('wallet not connected')
        const provider = new AnchorProvider(connection, anchorWallet, { preflightCommitment: 'confirmed', commitment: 'confirmed' })
        setProvider(provider)
        return new Program(IDL as any, provider)
    }

    async function fetchPool() {
        if (!poolPubkey) return
        setFetching(true)
        try {
            const program = await getProgram()
            const data = await (program.account as any).pool.fetch(poolPubkey)
            setPoolData(data as PoolData)
        } catch { setError('pool not found or invalid address') }
        setFetching(false)
    }

    async function handleJoin() {
        if (!anchorWallet || !poolPubkey || !poolData) return
        setLoading(true); setError(null)
        try {
            const program = await getProgram()
            const [vaultPDA] = getVaultPDA(poolPubkey)
            const tx = await program.methods.joinPool()
                .accounts({ member: anchorWallet.publicKey, pool: poolPubkey, vault: vaultPDA, systemProgram: SystemProgram.programId })
                .transaction()
            tx.feePayer = anchorWallet.publicKey
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
            const signed = await anchorWallet.signTransaction(tx)
            const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true })
            await connection.confirmTransaction(sig, 'confirmed')
            setJoined(true); await fetchPool()
            setTimeout(() => onSuccess(poolAddress), 1500)
        } catch (e: any) { setError(e.message) }
        setLoading(false)
    }

    const isAlreadyMember = poolData && anchorWallet ? poolData.members.some(m => m.toString() === anchorWallet.publicKey.toString()) : false
    const isFull = poolData ? poolData.members.length >= poolData.maxMembers : false
    const statusKey = poolData ? Object.keys(poolData.status)[0] : null
    const statusLabel = statusKey === 'waitingForMembers' ? 'WAITING FOR MEMBERS' : statusKey === 'active' ? 'ACTIVE' : 'COMPLETE'
    const contributionSOL = poolData ? (poolData.contributionAmount.toNumber() / 1e9).toFixed(2) : null
    const potSOL = poolData ? (poolData.contributionAmount.toNumber() * poolData.maxMembers / 1e9).toFixed(2) : null
    const durationDays = poolData ? Math.round(poolData.roundDuration.toNumber() / 86400) : null

    return (
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
                <button onClick={onBack} style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: '#666', marginBottom: 20, letterSpacing: '0.05em' }}>← BACK</button>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 56, letterSpacing: '0.04em', lineHeight: 0.9 }}>JOIN<br />A POOL</h2>
            </div>

            <div style={{ background: '#fff', border: '2px solid #111', padding: '10px 14px', boxShadow: '3px 3px 0 #111' }}>
                <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#666', wordBreak: 'break-all' }}>{poolAddress}</p>
            </div>

            {fetching && <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.06em' }}>LOADING...</p>}

            {!fetching && error && (
                <div style={{ background: '#fff', border: '2px solid #111', boxShadow: '3px 3px 0 #111', padding: '14px 18px', fontSize: 13, fontFamily: 'var(--font-ui)', color: '#c00' }}>
                    ✗ {error}
                </div>
            )}

            {!fetching && poolData && (
                <>
                    <div className="panel-lg" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{
                            background: '#111', padding: '10px 18px',
                            fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.1em', color: '#f5f2eb',
                            display: 'flex', justifyContent: 'space-between',
                        }}>
                            <span>{statusLabel}</span>
                            <span>{poolData.members.length}/{poolData.maxMembers} MEMBERS</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #111' }}>
                            {[
                                { label: 'CONTRIBUTION', value: `${contributionSOL} SOL` },
                                { label: 'POT / ROUND', value: `${potSOL} SOL` },
                                { label: 'DURATION', value: `${durationDays} DAYS` },
                                { label: 'SPOTS LEFT', value: `${poolData.maxMembers - poolData.members.length}` },
                            ].map((s, i) => (
                                <div key={s.label} style={{
                                    padding: '16px 18px',
                                    borderRight: i % 2 === 0 ? '2px solid #111' : 'none',
                                    borderBottom: i < 2 ? '2px solid #111' : 'none',
                                }}>
                                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: '#888', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '0.03em' }}>{s.value}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {poolData.members.map((m, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 12px',
                                    background: anchorWallet && m.toString() === anchorWallet.publicKey.toString() ? '#111' : '#f5f2eb',
                                    border: '1px solid #ccc',
                                }}>
                                    <div style={{ width: 6, height: 6, background: '#111', borderRadius: '50%', flexShrink: 0 }} />
                                    <span style={{
                                        fontSize: 11, fontFamily: 'monospace', flex: 1,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        color: anchorWallet && m.toString() === anchorWallet.publicKey.toString() ? '#f5f2eb' : '#333',
                                    }}>{m.toString()}</span>
                                    {anchorWallet && m.toString() === anchorWallet.publicKey.toString() && (
                                        <span style={{ fontSize: 10, color: '#f5f2eb', letterSpacing: '0.06em', fontFamily: 'var(--font-display)' }}>YOU</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {joined ? (
                        <div className="panel" style={{ padding: '20px 24px', textAlign: 'center', background: '#111' }}>
                            <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#f5f2eb', letterSpacing: '0.05em' }}>JOINED! ✓</p>
                            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: '#999', marginTop: 6 }}>
                                {poolData.members.length >= poolData.maxMembers ? 'pool is active — round 1 begins' : `waiting for ${poolData.maxMembers - poolData.members.length} more`}
                            </p>
                        </div>
                    ) : isAlreadyMember ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: '#666' }}>you're already in this pool</p>
                            <button onClick={() => onSuccess(poolAddress)} className="btn-comic" style={{ fontSize: 16 }}>GO TO DASHBOARD →</button>
                        </div>
                    ) : isFull ? (
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#888', letterSpacing: '0.06em' }}>POOL IS FULL.</p>
                    ) : statusKey !== 'waitingForMembers' ? (
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#888', letterSpacing: '0.06em' }}>NOT ACCEPTING MEMBERS.</p>
                    ) : (
                        <button onClick={handleJoin} disabled={!anchorWallet || loading} className="btn-comic" style={{ width: '100%', textAlign: 'center', fontSize: 20 }}>
                            {loading ? 'CONFIRMING...' : `JOIN FOR ${contributionSOL} SOL →`}
                        </button>
                    )}
                </>
            )}
        </div>
    )
}