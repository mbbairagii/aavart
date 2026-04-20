// tests/aavart.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Aavart } from "../target/types/aavart";
import { assert } from "chai";

describe("aavart", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Aavart as Program<Aavart>;

  it("creates a pool", async () => {
    const creator = provider.wallet.publicKey;

    const [poolPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), creator.toBuffer()],
      program.programId
    );
    const [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), poolPDA.toBuffer()],
      program.programId
    );

    await program.methods
      .createPool(
        new anchor.BN(0.5 * 1e9), // 0.5 SOL
        5,                          // 5 members
        new anchor.BN(7 * 86400)   // 7 days
      )
      .accounts({
        creator,
        pool: poolPDA,
        vault: vaultPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const pool = await program.account.pool.fetch(poolPDA);
    assert.equal(pool.maxMembers, 5);
    assert.equal(pool.contributionAmount.toNumber(), 0.5 * 1e9);
    assert.deepEqual(pool.status, { waitingForMembers: {} });
    console.log("✓ pool created at", poolPDA.toString());
  });
});