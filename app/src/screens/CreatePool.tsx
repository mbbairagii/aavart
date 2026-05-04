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
            console.log('program id:', program.programId.toString())
            console.log('wallet:', publicKey.toString())
            console.log('poolPDA:', poolPDA.toString())
            console.log('vaultPDA:', vaultPDA.toString())
            const tx = await program.methods
                .createPool(new BN(parseFloat(amount) * 1e9), parseInt(members), new BN(parseInt(duration) * 86400))
                .accounts({ creator: publicKey, pool: poolPDA, vault: vaultPDA, systemProgram: SystemProgram.programId })
                .transaction()
            tx.feePayer = publicKey
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
            const signed = await anchorWallet.signTransaction(tx)
            const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true })
            console.log('tx sig:', sig)
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

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 14px',
        background: '#fff', border: '2px solid #111',
        boxShadow: '3px 3px 0 #111',
        fontSize: 14, outline: 'none',
        fontFamily: 'var(--font-ui)', color: '#111',
        transition: 'box-shadow 0.1s ease',
    }

    return (
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 28px', display: 'flex', flexDirection: 'column', gap: 32 }}>

            <div>
                <button onClick={onBack} style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: '#666', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.05em' }}>
                    ← BACK
                </button>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 56, letterSpacing: '0.04em', lineHeight: 0.9 }}>
                    CREATE<br />A POOL
                </h2>
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: '#666', marginTop: 10 }}>set the rules — your circle follows.</p>
            </div>

            <div className="panel-lg" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                    <label style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                        CONTRIBUTION / ROUND (SOL)
                    </label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.10" style={inputStyle}
                        onFocus={e => (e.currentTarget.style.boxShadow = '5px 5px 0 #111')}
                        onBlur={e => (e.currentTarget.style.boxShadow = '3px 3px 0 #111')} />
                </div>
                <div>
                    <label style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                        NUMBER OF MEMBERS
                    </label>
                    <input type="number" value={members} onChange={e => setMembers(e.target.value)} placeholder="5" style={inputStyle}
                        onFocus={e => (e.currentTarget.style.boxShadow = '5px 5px 0 #111')}
                        onBlur={e => (e.currentTarget.style.boxShadow = '3px 3px 0 #111')} />
                </div>
                <div>
                    <label style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                        ROUND DURATION (DAYS)
                    </label>
                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="7" style={inputStyle}
                        onFocus={e => (e.currentTarget.style.boxShadow = '5px 5px 0 #111')}
                        onBlur={e => (e.currentTarget.style.boxShadow = '3px 3px 0 #111')} />
                </div>

                {pot && (
                    <div style={{
                        background: '#111', border: '2px solid #111', padding: '16px 20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: '#999', letterSpacing: '0.08em', textTransform: 'uppercase' }}>pot per round</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: '#f5f2eb', letterSpacing: '0.04em' }}>
                            {pot} SOL
                        </span>
                    </div>
                )}

                <button onClick={handleCreate}
                    disabled={!amount || !members || !duration || loading}
                    className="btn-comic"
                    style={{ width: '100%', textAlign: 'center', fontSize: 20 }}>
                    {loading ? 'CONFIRMING...' : 'CREATE POOL →'}
                </button>
            </div>
        </div>
    )
}