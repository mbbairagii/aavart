import { useState } from 'react'
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, BN, type Idl, setProvider } from '@coral-xyz/anchor'
import { SystemProgram, Transaction } from '@solana/web3.js'
import { IDL } from '../lib/idl'
import { getPoolPDA, getVaultPDA , PROGRAM_ID} from '../lib/program'
import { PublicKey } from '@solana/web3.js'


export default function CreatePool({ onBack }: { onBack: () => void }) {
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
            console.log('connection:', connection)
            console.log('anchorWallet:', anchorWallet)
            const provider = new AnchorProvider(connection, anchorWallet, {
                preflightCommitment: 'confirmed',
                commitment: 'confirmed',
            })
            setProvider(provider)
            const program = new Program(IDL as any, PROGRAM_ID, provider)
            console.log('program created')
            const publicKey = anchorWallet.publicKey
            const [poolPDA] = getPoolPDA(publicKey)
            const [vaultPDA] = getVaultPDA(poolPDA)

            // Build the transaction instead of calling .rpc() directly
            const tx = await program.methods
                .createPool(
                    new BN(parseFloat(amount) * 1e9),
                    parseInt(members),
                    new BN(parseInt(duration) * 86400)
                )
                .accounts({
                    creator: publicKey,
                    pool: poolPDA,
                    vault: vaultPDA,
                    systemProgram: SystemProgram.programId,
                })
                .transaction()

            tx.feePayer = publicKey
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
            const sig = await provider.sendAndConfirm(tx, [], { skipPreflight: true })
            alert('pool created! address: ' + poolPDA.toString() + '\nsig: ' + sig)
        } catch (e: any) {
            console.error(e)
            alert('error: ' + e.message)
        }
        setLoading(false)
    }


    const pot = amount && members ? (parseFloat(amount) * parseInt(members)).toFixed(2) : null


    return (
        <div className="max-w-lg mx-auto px-6 py-12 flex flex-col gap-8">
            <button onClick={onBack} className="text-zinc-500 hover:text-white text-sm transition">← back</button>
            <h2 className="text-2xl font-bold">create a pool</h2>
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-zinc-400">contribution per round (SOL)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.5"
                        className="py-4 px-4 bg-zinc-900 rounded-xl border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-zinc-400">number of members</label>
                    <input type="number" value={members} onChange={e => setMembers(e.target.value)} placeholder="5"
                        className="py-4 px-4 bg-zinc-900 rounded-xl border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-zinc-400">round duration (days)</label>
                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="7"
                        className="py-4 px-4 bg-zinc-900 rounded-xl border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600" />
                </div>
                {pot && (
                    <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                        <p className="text-zinc-400 text-sm">each round, the winner receives</p>
                        <p className="text-2xl font-bold mt-1">{pot} SOL</p>
                    </div>
                )}
                <button onClick={handleCreate} disabled={!amount || !members || !duration || loading}
                    className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    {loading ? 'creating...' : 'create pool'}
                </button>
            </div>
        </div>
    )
}