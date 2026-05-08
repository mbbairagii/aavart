# Aavart · Decentralized Circle Savings

**Trustless on-chain chit fund on Solana. Pool funds, rotate payouts. No bank. No middleman.**

***

## What's this?

You know how in desi families, a group of people pool money every month and one person takes the whole pot — and this keeps rotating until everyone's been paid once? That's a chit fund. Been around forever. Works on trust.

Aavart removes the trust part. Everything — contributions, payouts, rotation — is handled by a Solana smart contract. Nobody can run away with the money. Nobody can skip their turn. The contract enforces it all.

```
5 friends · 0.5 SOL each · 5 rounds

Round 1 → all pay → Priya gets 2.5 SOL
Round 2 → all pay → Ravi gets 2.5 SOL
...and so on until everyone's received once.

Everyone paid 2.5 SOL. Everyone got 2.5 SOL back.
Zero banks. Zero middlemen. Zero trust needed.
```

***

## What it does

- Create a pool — pick the contribution amount, number of members, and round duration
- Share an invite link directly from your dashboard — members join via URL
- Smart contract handles the rotation and enforces who gets paid when
- Live dashboard shows round countdown, who's paid, who hasn't, and vault balance
- My Pools page to track every pool you're in
- Dark / light mode because why not

***

## On-Chain Program

Built with Anchor on Solana.

| Instruction | What it does |
|---|---|
| `create_pool` | Creates the pool, stores config on-chain, creator joins as member 1 |
| `join_pool` | Adds you to the pool, takes your first contribution, auto-starts when full |
| `contribute` | Pay your round contribution — pot releases once everyone's paid |
| `claim` | If it's your turn, claim the full pot (1% goes to protocol treasury) |

***

## Stack

| | |
|---|---|
| Smart contract | Rust + Anchor |
| Frontend | React + TypeScript + Vite |
| Wallet | `@solana/wallet-adapter-react` |
| Hosting | Vercel |
| Network | Solana Devnet / Mainnet |

***

## Run it locally

```bash
git clone https://github.com/mbbairagii/aavart.git
cd aavart/app
npm install
npm run dev
```

Build for production:
```bash
npm run build
```

Deploy the program:
```bash
anchor build
anchor deploy --provider.cluster devnet
```

***

## Env vars

Create `app/.env`:

```env
VITE_RPC_URL=https://api.devnet.solana.com
```

***

## Built by

[@yourusername](https://github.com/mbbairagii) 
