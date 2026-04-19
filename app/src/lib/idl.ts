
export const IDL = {
    address: "ABhVs3ycfxZvEp2xiP7JjkU4fuCXDNJ5XjUpCXmFPq9E",
    metadata: {
        address: "ABhVs3ycfxZvEp2xiP7JjkU4fuCXDNJ5XjUpCXmFPq9E"
    },
    version: "0.1.0",
    name: "aavart",
    instructions: [
        {
            name: "createPool",
            accounts: [
                { name: "creator", isMut: true, isSigner: true },
                { name: "pool", isMut: true, isSigner: false },
                { name: "vault", isMut: true, isSigner: false },
                { name: "systemProgram", isMut: false, isSigner: false },
            ],
            args: [
                { name: "contributionAmount", type: "u64" },
                { name: "maxMembers", type: "u8" },
                { name: "roundDuration", type: "i64" },
            ],
        },
        {
            name: "joinPool",
            accounts: [
                { name: "member", isMut: true, isSigner: true },
                { name: "pool", isMut: true, isSigner: false },
                { name: "vault", isMut: true, isSigner: false },
                { name: "systemProgram", isMut: false, isSigner: false },
            ],
            args: [],
        },
        {
            name: "contribute",
            accounts: [
                { name: "member", isMut: true, isSigner: true },
                { name: "pool", isMut: true, isSigner: false },
                { name: "vault", isMut: true, isSigner: false },
                { name: "systemProgram", isMut: false, isSigner: false },
            ],
            args: [],
        },
        {
            name: "claim",
            accounts: [
                { name: "recipient", isMut: true, isSigner: true },
                { name: "pool", isMut: true, isSigner: false },
                { name: "vault", isMut: true, isSigner: false },
                { name: "treasury", isMut: true, isSigner: false },
                { name: "systemProgram", isMut: false, isSigner: false },
            ],
            args: [],
        },
    ],
    accounts: [
        {
            name: "Pool",
            type: {
                kind: "struct",
                fields: [
                    { name: "creator", type: "publicKey" },
                    { name: "contributionAmount", type: "u64" },
                    { name: "maxMembers", type: "u8" },
                    { name: "roundDuration", type: "i64" },
                    { name: "currentRound", type: "u8" },
                    { name: "members", type: { vec: "publicKey" } },
                    { name: "recipients", type: { vec: "publicKey" } },
                    { name: "paidThisRound", type: { vec: "bool" } },
                    { name: "status", type: { defined: "PoolStatus" } },
                    { name: "vaultBump", type: "u8" },
                    { name: "bump", type: "u8" },
                ],
            },
        },
    ],
    types: [
        {
            name: "PoolStatus",
            type: {
                kind: "enum",
                variants: [
                    { name: "WaitingForMembers" },
                    { name: "Active" },
                    { name: "Complete" },
                ],
            },
        },
    ],
    errors: [
        { code: 6000, name: "PoolFull", msg: "Pool is full" },
        { code: 6001, name: "PoolNotWaiting", msg: "Pool is not in waiting state" },
        { code: 6002, name: "PoolNotActive", msg: "Pool is not active" },
        { code: 6003, name: "AlreadyPaid", msg: "Already paid this round" },
        { code: 6004, name: "NotYourTurn", msg: "Not your turn to claim" },
        { code: 6005, name: "NotAllPaid", msg: "Not all members have paid" },
        { code: 6006, name: "AlreadyMember", msg: "Already a member" },
    ],
}