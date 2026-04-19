import { PublicKey } from '@solana/web3.js'

export const PROGRAM_ID = new PublicKey('ABhVs3ycfxZvEp2xiP7JjkU4fuCXDNJ5XjUpCXmFPq9E')
export const TREASURY = new PublicKey('ABhVs3ycfxZvEp2xiP7JjkU4fuCXDNJ5XjUpCXmFPq9E')

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