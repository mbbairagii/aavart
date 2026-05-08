import { useState } from 'react'
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, BN, setProvider } from '@coral-xyz/anchor'
import { SystemProgram } from '@solana/web3.js'
import { IDL } from '../lib/idl'
import { getPoolPDA, getVaultPDA } from '../lib/program'

interface Props {
    onBack: () => void
    onSuccess: (poolAddress: string) => void
}

export default function CreatePool({ onBack, onSuccess }: Props) {
    const anchorWallet = useAnchorWallet()
    const { connection } = useConnection()
    const [amount, setAmount] = useState('')
    const [members, setMembers] = useState('')
    const [duration, setDuration] = useState('')
    const [loading, setLoading] = useState(false)
    const [focused, setFocused] = useState<string | null>(null)

    async function handleCreate() {
        if (!anchorWallet) return
        setLoading(true)
        try {
            const provider = new AnchorProvider(connection, anchorWallet, { preflightCommitment: 'confirmed', commitment: 'confirmed' })
            setProvider(provider)
            const program = new Program(IDL as any, provider)
            const publicKey = anchorWallet.publicKey
            const [poolPDA] = getPoolPDA(publicKey)
            const [vaultPDA] = getVaultPDA(poolPDA)

            const tx = await program.methods
                .createPool(new BN(parseFloat(amount) * 1e9), parseInt(members), new BN(parseInt(duration) * 86400))
                .accounts({ creator: publicKey, pool: poolPDA, vault: vaultPDA, systemProgram: SystemProgram.programId })
                .transaction()
            tx.feePayer = publicKey
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
            const signed = await anchorWallet.signTransaction(tx)
            const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true })

            await connection.confirmTransaction(sig, 'confirmed')
            try { await navigator.clipboard.writeText(`${window.location.origin}/?pool=${poolPDA.toString()}`) } catch { }
            onSuccess(poolPDA.toString())
        } catch (e: any) {
            console.error('FULL ERROR:', e)
            alert('error: ' + e.message)
        }
        setLoading(false)
    }

    const pot = amount && members ? (parseFloat(amount) * parseInt(members)).toFixed(2) : '0.00'
    const isFormValid = amount && members && duration && !loading

    const inputStyle = (id: string): React.CSSProperties => ({
        width: '100%',
        background: 'var(--color-surface)',
        border: '2px solid var(--color-border)',
        color: 'var(--color-text)',
        fontSize: 16,
        padding: '14px 16px',
        outline: 'none',
        transition: 'transform 0.1s ease, box-shadow 0.1s ease',
        fontFamily: 'var(--font-ui)',
        boxShadow: focused === id ? 'var(--shadow-lg)' : 'var(--shadow)',
        transform: focused === id ? 'translate(-2px, -2px)' : 'none',
    })

    const labelStyle: React.CSSProperties = {
        fontSize: 13,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'block',
        marginBottom: 8,
        fontFamily: 'var(--font-ui)',
        fontWeight: 600
    }

    return (
        <div style={{
            minHeight: '80vh',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px'
        }}>
            {/* Using your pre-defined panel-lg class for the heavy neo-brutalist border/shadow */}
            <div className="panel-lg" style={{
                width: '100%',
                maxWidth: 480,
                padding: '40px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: 32,
                transition: 'background 0.2s ease, border-color 0.2s ease'
            }}>

                {/* Header */}
                <div>
                    <button onClick={onBack} style={{
                        color: 'var(--color-text-muted)',
                        padding: 0, marginBottom: 24, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: 'var(--font-ui)', fontWeight: 600
                    }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    >
                        ← BACK
                    </button>

                    <h1 style={{
                        fontSize: 48,
                        color: 'var(--color-text)',
                        margin: '0 0 8px 0',
                        textTransform: 'uppercase'
                    }}>
                        Create a pool.
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
                        Set the rules. Your circle follows.
                    </p>
                </div>

                {/* Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    <div>
                        <label style={labelStyle}>Contribution per round (SOL)</label>
                        <input type="number" placeholder="0.10" value={amount} onChange={e => setAmount(e.target.value)}
                            style={inputStyle('amount')}
                            onFocus={() => setFocused('amount')} onBlur={() => setFocused(null)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 20 }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Members</label>
                            <input type="number" placeholder="5" value={members} onChange={e => setMembers(e.target.value)}
                                style={inputStyle('members')}
                                onFocus={() => setFocused('members')} onBlur={() => setFocused(null)}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Duration (Days)</label>
                            <input type="number" placeholder="7" value={duration} onChange={e => setDuration(e.target.value)}
                                style={inputStyle('duration')}
                                onFocus={() => setFocused('duration')} onBlur={() => setFocused(null)}
                            />
                        </div>
                    </div>

                    {/* Pot Calculation Box */}
                    <div style={{
                        marginTop: 8,
                        padding: '20px',
                        background: 'var(--color-surface-2)',
                        border: '2px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase' }}>
                            Pot Per Round
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--color-text)', lineHeight: 1 }}>
                                {pot}
                            </span>
                            <span style={{ fontSize: 16, color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>SOL</span>
                        </div>
                    </div>

                    {/* Utilizing your btn-comic class natively */}
                    <button onClick={handleCreate} disabled={!isFormValid}
                        className="btn-comic"
                        style={{ width: '100%', marginTop: 8 }}>
                        {loading ? 'CONFIRMING...' : 'CREATE POOL →'}
                    </button>
                </div>
            </div>
        </div>
    )
}