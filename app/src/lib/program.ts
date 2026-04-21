import { PublicKey } from '@solana/web3.js'

export const PROGRAM_ID = new PublicKey('J9C1N46wqffo2rtVp5YuvUSogJ6ctooQqKYtgFwYUR7t')
export const TREASURY = new PublicKey(import.meta.env.VITE_TREASURY)

const encoder = new TextEncoder()

export function getPoolPDA(creator: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [encoder.encode('pool'), creator.toBytes()],
    PROGRAM_ID
  )
}

export function getVaultPDA(pool: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [encoder.encode('vault'), pool.toBytes()],
    PROGRAM_ID
  )
}