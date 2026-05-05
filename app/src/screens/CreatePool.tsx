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

const BG = '#0a0a0a'
const FG = '#ddd9d0'
const MUTED = 'rgba(221,217,208,0.35)'
const FAINT = 'rgba(221,217,208,0.10)'
const BORDER = 'rgba(221,217,208,0.10)'
const SERIF = "'Cormorant Garamond', Georgia, serif"
const SANS = "'Syne', sans-serif"

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

    const pot = amount && members ? (parseFloat(amount) * parseInt(members)).toFixed(2) : null
    const canSubmit = !!amount && !!members && !!duration && !loading

    function inputStyle(name: string): React.CSSProperties {
        const isFocused = focused === name
        return {
            width: '100%',
            padding: '14px 18px',
            background: isFocused ? 'rgba(221,217,208,0.05)' : 'transparent',
            border: 'none',
            borderBottom: `1px solid ${isFocused ? 'rgba(221,217,208,0.55)' : 'rgba(221,217,208,0.18)'}`,
            fontSize: 22,
            fontFamily: SERIF,
            fontWeight: 300,
            color: FG,
            outline: 'none',
            transition: 'all 0.2s ease',
            letterSpacing: '0.02em',
            caretColor: FG,
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: BG,
            color: FG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* subtle grid */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                `,
                backgroundSize: '56px 56px',
                pointerEvents: 'none',
            }} />

            {/* ambient glow */}
            <div style={{
                position: 'absolute', top: '-20%', left: '50%',
                transform: 'translateX(-50%)',
                width: '600px', height: '400px',
                background: 'radial-gradient(ellipse, rgba(221,217,208,0.04) 0%, transparent 70%)',
                pointerEvents: 'none', zIndex: 0,
            }} />

            <div style={{
                position: 'relative', zIndex: 1,
                width: '100%', maxWidth: 480,
                display: 'flex', flexDirection: 'column', gap: 0,
            }}>
                {/* back */}
                <button
                    onClick={onBack}
                    style={{
                        fontFamily: SANS, fontSize: 10,
                        letterSpacing: '0.2em', color: MUTED,
                        background: 'none', border: 'none',
                        cursor: 'pointer', padding: '0 0 40px',
                        display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'color 0.15s',
                        textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = FG)}
                    onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
                >
                    ← BACK
                </button>

                {/* heading */}
                <div style={{ marginBottom: 52 }}>
                    <p style={{
                        fontFamily: SANS, fontSize: 9,
                        letterSpacing: '0.3em', color: 'rgba(221,217,208,0.25)',
                        textTransform: 'uppercase', marginBottom: 16,
                    }}>New Pool</p>
                    <h1 style={{
                        fontFamily: SERIF,
                        fontStyle: 'italic',
                        fontWeight: 300,
                        fontSize: 'clamp(52px, 10vw, 88px)',
                        lineHeight: 0.88,
                        letterSpacing: '-0.01em',
                        color: FG,
                        margin: 0,
                    }}>
                        Set the rules.<br />
                        <span style={{
                            WebkitTextStroke: `0.5px ${FG}`,
                            color: 'transparent',
                        }}>
                            Your circle follows.
                        </span>
                    </h1>
                </div>

                {/* form fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

                    {/* Contribution */}
                    <div>
                        <label style={{
                            fontFamily: SANS, fontSize: 9,
                            letterSpacing: '0.22em', color: 'rgba(221,217,208,0.28)',
                            textTransform: 'uppercase',
                            display: 'flex', justifyContent: 'space-between',
                            marginBottom: 10,
                        }}>
                            <span>Contribution / Round</span>
                            <span>SOL</span>
                        </label>
                        <input
                            type="number" value={amount}
                            onChange={e => setAmount(e.target.value)}
                            onFocus={() => setFocused('amount')}
                            onBlur={() => setFocused(null)}
                            placeholder="0.10"
                            style={inputStyle('amount')}
                        />
                    </div>

                    {/* Members */}
                    <div>
                        <label style={{
                            fontFamily: SANS, fontSize: 9,
                            letterSpacing: '0.22em', color: 'rgba(221,217,208,0.28)',
                            textTransform: 'uppercase',
                            display: 'flex', justifyContent: 'space-between',
                            marginBottom: 10,
                        }}>
                            <span>Number of Members</span>
                            <span>WALLETS</span>
                        </label>
                        <input
                            type="number" value={members}
                            onChange={e => setMembers(e.target.value)}
                            onFocus={() => setFocused('members')}
                            onBlur={() => setFocused(null)}
                            placeholder="5"
                            style={inputStyle('members')}
                        />
                    </div>

                    {/* Duration */}
                    <div>
                        <label style={{
                            fontFamily: SANS, fontSize: 9,
                            letterSpacing: '0.22em', color: 'rgba(221,217,208,0.28)',
                            textTransform: 'uppercase',
                            display: 'flex', justifyContent: 'space-between',
                            marginBottom: 10,
                        }}>
                            <span>Round Duration</span>
                            <span>DAYS</span>
                        </label>
                        <input
                            type="number" value={duration}
                            onChange={e => setDuration(e.target.value)}
                            onFocus={() => setFocused('duration')}
                            onBlur={() => setFocused(null)}
                            placeholder="7"
                            style={inputStyle('duration')}
                        />
                    </div>
                </div>

                {/* pot preview */}
                <div style={{
                    marginTop: 40,
                    height: pot ? 'auto' : 0,
                    overflow: 'hidden',
                    opacity: pot ? 1 : 0,
                    transition: 'opacity 0.35s ease, height 0.35s ease',
                }}>
                    <div style={{
                        borderTop: `1px solid ${BORDER}`,
                        borderBottom: `1px solid ${BORDER}`,
                        padding: '20px 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                    }}>
                        <span style={{
                            fontFamily: SANS, fontSize: 9,
                            letterSpacing: '0.22em', color: MUTED,
                            textTransform: 'uppercase',
                        }}>Pot per round</span>
                        <span style={{
                            fontFamily: SERIF,
                            fontStyle: 'italic',
                            fontWeight: 300,
                            fontSize: 42,
                            letterSpacing: '-0.01em',
                            color: FG,
                            lineHeight: 1,
                        }}>
                            {pot} <span style={{ fontSize: 18, color: MUTED }}>SOL</span>
                        </span>
                    </div>
                </div>

                {/* submit */}
                <button
                    onClick={handleCreate}
                    disabled={!canSubmit}
                    style={{
                        marginTop: 40,
                        width: '100%',
                        padding: '18px 28px',
                        background: canSubmit ? FG : 'transparent',
                        color: canSubmit ? BG : 'rgba(221,217,208,0.2)',
                        border: `1px solid ${canSubmit ? FG : 'rgba(221,217,208,0.15)'}`,
                        borderRadius: 2,
                        fontFamily: SANS,
                        fontSize: 11,
                        letterSpacing: '0.18em',
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                    }}
                    onMouseEnter={e => { if (canSubmit) e.currentTarget.style.opacity = '0.8' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                    {loading ? (
                        <>
                            <span style={{
                                width: 10, height: 10, borderRadius: '50%',
                                border: `1px solid ${BG}`,
                                borderTopColor: 'transparent',
                                display: 'inline-block',
                                animation: 'spin 0.7s linear infinite',
                            }} />
                            CONFIRMING
                        </>
                    ) : 'CREATE POOL →'}
                </button>

                {/* wallet warning */}
                {!anchorWallet && (
                    <p style={{
                        fontFamily: SANS, fontSize: 10,
                        letterSpacing: '0.14em', color: 'rgba(221,217,208,0.22)',
                        textAlign: 'center', marginTop: 16,
                    }}>
                        CONNECT WALLET TO CONTINUE
                    </p>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] { -moz-appearance: textfield; }
                input::placeholder {
                    color: rgba(221,217,208,0.18);
                    font-style: italic;
                }
            `}</style>
        </div>
    )
}