import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Aavart } from "../target/types/aavart";
import { assert } from "chai";
import {
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

// module-scoped so all tests share the same keypairs
const member2 = Keypair.generate();
const member3 = Keypair.generate();
const treasury = Keypair.generate();

function getPoolPDA(creator: PublicKey, programId: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), creator.toBuffer()],
    programId
  );
}

function getVaultPDA(poolKey: PublicKey, programId: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), poolKey.toBuffer()],
    programId
  );
}

describe("aavart", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Aavart as Program<Aavart>;
  const creator = provider.wallet.publicKey;

  let poolPDA: PublicKey;
  let vaultPDA: PublicKey;

  before(async () => {
    [poolPDA] = getPoolPDA(creator, program.programId);
    [vaultPDA] = getVaultPDA(poolPDA, program.programId);

    // airdrop to member2 and member3
    for (const m of [member2, member3]) {
      const sig = await provider.connection.requestAirdrop(
        m.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }
  });

  // ── Test 1: create_pool ──────────────────────────────────────
  it("creates a pool", async () => {
    await program.methods
      .createPool(new BN(0.5 * LAMPORTS_PER_SOL), 3, new BN(7 * 86400))
      .accounts({
        creator,
        pool: poolPDA,
        vault: vaultPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const pool = await program.account.pool.fetch(poolPDA);
    assert.equal(pool.maxMembers, 3);
    assert.equal(pool.contributionAmount.toNumber(), 0.5 * LAMPORTS_PER_SOL);
    assert.equal(pool.members.length, 1);
    assert.equal(pool.members[0].toString(), creator.toString());
    assert.deepEqual(pool.status, { waitingForMembers: {} });
    console.log("  pool PDA:", poolPDA.toString());
  });

  // ── Test 2: join_pool (partial) ──────────────────────────────
  it("member2 joins — pool still waiting", async () => {
    await program.methods
      .joinPool()
      .accounts({
        member: member2.publicKey,
        pool: poolPDA,
        vault: vaultPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([member2])
      .rpc();

    const pool = await program.account.pool.fetch(poolPDA);
    assert.equal(pool.members.length, 2);
    assert.deepEqual(pool.status, { waitingForMembers: {} });
    console.log("  2/3 members joined, still waiting");
  });

  // ── Test 3: join_pool (fills pool → auto-start) ──────────────
  it("member3 joins — pool auto-starts", async () => {
    await program.methods
      .joinPool()
      .accounts({
        member: member3.publicKey,
        pool: poolPDA,
        vault: vaultPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([member3])
      .rpc();

    const pool = await program.account.pool.fetch(poolPDA);
    assert.equal(pool.members.length, 3);
    assert.deepEqual(pool.status, { active: {} });
    assert.equal(pool.paidThisRound.length, 3);
    assert.equal(pool.recipients.length, 3);
    assert.equal(pool.paidThisRound.every((p: boolean) => !p), true);
    console.log("  pool active, recipients:", pool.recipients.map((r: PublicKey) => r.toString()));
  });

  // ── Test 4: contribute (all 3 members) ───────────────────────
  it("all members contribute round 1", async () => {
    // creator contributes
    await program.methods
      .contribute()
      .accounts({
        member: creator,
        pool: poolPDA,
        vault: vaultPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // member2 contributes
    await program.methods
      .contribute()
      .accounts({
        member: member2.publicKey,
        pool: poolPDA,
        vault: vaultPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([member2])
      .rpc();

    // member3 contributes
    await program.methods
      .contribute()
      .accounts({
        member: member3.publicKey,
        pool: poolPDA,
        vault: vaultPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([member3])
      .rpc();

    const pool = await program.account.pool.fetch(poolPDA);
    assert.equal(pool.paidThisRound.every((p: boolean) => p), true);
    console.log("  all 3 paid, vault ready for claim");
  });

  // ── Test 5: claim (round 1 recipient) ────────────────────────
  it("round 1 recipient claims the pot", async () => {
    const pool = await program.account.pool.fetch(poolPDA);
    const recipientKey = pool.recipients[0];

    // figure out which signer matches round 0 recipient
    const signerMap: Record<string, Keypair | null> = {
      [creator.toString()]: null, // provider wallet signs automatically
      [member2.publicKey.toString()]: member2,
      [member3.publicKey.toString()]: member3,
    };
    const recipientSigner = signerMap[recipientKey.toString()];
    const extraSigners = recipientSigner ? [recipientSigner] : [];

    const recipientBalanceBefore = await provider.connection.getBalance(recipientKey);

    await program.methods
      .claim()
      .accounts({
        recipient: recipientKey,
        pool: poolPDA,
        vault: vaultPDA,
        treasury: treasury.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers(extraSigners)
      .rpc();

    const recipientBalanceAfter = await provider.connection.getBalance(recipientKey);
    const poolAfter = await program.account.pool.fetch(poolPDA);

    const expectedPayout = (0.5 * LAMPORTS_PER_SOL * 3) * 0.99; // 1% fee
    assert.approximately(
      recipientBalanceAfter - recipientBalanceBefore,
      expectedPayout,
      10000 // allow small variance for tx fees
    );
    assert.equal(poolAfter.currentRound, 1);
    assert.equal(poolAfter.paidThisRound.every((p: boolean) => !p), true);
    assert.deepEqual(poolAfter.status, { active: {} }); // 2 rounds remain
    console.log("  recipient got ~", (recipientBalanceAfter - recipientBalanceBefore) / LAMPORTS_PER_SOL, "SOL");
    console.log("  round advanced to:", poolAfter.currentRound);
  });
});