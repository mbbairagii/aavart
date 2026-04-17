use anchor_lang::prelude::*;

declare_id!("ABhVs3ycfxZvEp2xiP7JjkU4fuCXDNJ5XjUpCXmFPq9E");

#[program]
pub mod aavart {
    use super::*;

    pub fn create_pool(
        ctx: Context<CreatePool>,
        contribution_amount: u64,
        max_members: u8,
        round_duration: i64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let creator = ctx.accounts.creator.key();

        pool.creator = creator;
        pool.contribution_amount = contribution_amount;
        pool.max_members = max_members;
        pool.round_duration = round_duration;
        pool.current_round = 0;
        pool.members = vec![creator];
        pool.recipients = vec![];
        pool.paid_this_round = vec![];
        pool.status = PoolStatus::WaitingForMembers;
        pool.bump = ctx.bumps.pool;
        pool.vault_bump = ctx.bumps.vault;

        // creator pays first contribution into vault
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.creator.key(),
            &ctx.accounts.vault.key(),
            contribution_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.creator.to_account_info(),
                ctx.accounts.vault.to_account_info(),
            ],
        )?;

        Ok(())
    }

    pub fn join_pool(ctx: Context<JoinPool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let member = ctx.accounts.member.key();

        require!(
            pool.status == PoolStatus::WaitingForMembers,
            AavartError::PoolNotWaiting
        );
        require!(
            pool.members.len() < pool.max_members as usize,
            AavartError::PoolFull
        );
        require!(!pool.members.contains(&member), AavartError::AlreadyMember);

        pool.members.push(member);

        // transfer contribution to vault
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.member.key(),
            &ctx.accounts.vault.key(),
            pool.contribution_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.member.to_account_info(),
                ctx.accounts.vault.to_account_info(),
            ],
        )?;

        // if pool is full, start it
        if pool.members.len() == pool.max_members as usize {
            pool.status = PoolStatus::Active;
            pool.recipients = pool.members.clone();
            pool.paid_this_round = vec![false; pool.max_members as usize];
        }

        Ok(())
    }

    pub fn contribute(ctx: Context<Contribute>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let member = ctx.accounts.member.key();

        require!(
            pool.status == PoolStatus::Active,
            AavartError::PoolNotActive
        );

        let member_index = pool
            .members
            .iter()
            .position(|m| m == &member)
            .ok_or(AavartError::AlreadyMember)?;

        require!(
            !pool.paid_this_round[member_index],
            AavartError::AlreadyPaid
        );

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.member.key(),
            &ctx.accounts.vault.key(),
            pool.contribution_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.member.to_account_info(),
                ctx.accounts.vault.to_account_info(),
            ],
        )?;

        pool.paid_this_round[member_index] = true;

        Ok(())
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        require!(
            pool.status == PoolStatus::Active,
            AavartError::PoolNotActive
        );

        let current_recipient = pool.recipients[pool.current_round as usize];
        require!(
            ctx.accounts.recipient.key() == current_recipient,
            AavartError::NotYourTurn
        );
        require!(
            pool.paid_this_round.iter().all(|&p| p),
            AavartError::NotAllPaid
        );

        // 1% protocol fee to treasury
        let pot = pool.contribution_amount * pool.max_members as u64;
        let fee = pot / 100;
        let payout = pot - fee;

        let vault_bump = pool.vault_bump;
        let pool_key = pool.key();
        let seeds = &[b"vault", pool_key.as_ref(), &[vault_bump]];
        let signer_seeds = &[&seeds[..]];

        // pay treasury
        let fee_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.vault.key(),
            &ctx.accounts.treasury.key(),
            fee,
        );
        anchor_lang::solana_program::program::invoke_signed(
            &fee_ix,
            &[
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        // pay recipient
        let pay_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.vault.key(),
            &ctx.accounts.recipient.key(),
            payout,
        );
        anchor_lang::solana_program::program::invoke_signed(
            &pay_ix,
            &[
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.recipient.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        // advance round
        pool.current_round += 1;
        pool.paid_this_round = vec![false; pool.max_members as usize];

        if pool.current_round as usize >= pool.max_members as usize {
            pool.status = PoolStatus::Complete;
        }

        Ok(())
    }
}

// ─── Data Structures ───────────────────────────────────────────

#[account]
pub struct Pool {
    pub creator: Pubkey,
    pub contribution_amount: u64,
    pub max_members: u8,
    pub round_duration: i64,
    pub current_round: u8,
    pub members: Vec<Pubkey>,
    pub recipients: Vec<Pubkey>,
    pub paid_this_round: Vec<bool>,
    pub status: PoolStatus,
    pub vault_bump: u8,
    pub bump: u8,
}

impl Pool {
    pub fn size(max_members: u8) -> usize {
        8                           // discriminator
        + 32                        // creator
        + 8                         // contribution_amount
        + 1                         // max_members
        + 8                         // round_duration
        + 1                         // current_round
        + 4 + (32 * max_members as usize)  // members vec
        + 4 + (32 * max_members as usize)  // recipients vec
        + 4 + (1 * max_members as usize)   // paid_this_round vec
        + 1                         // status
        + 1                         // vault_bump
        + 1 // bump
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum PoolStatus {
    WaitingForMembers,
    Active,
    Complete,
}

// ─── Errors ────────────────────────────────────────────────────

#[error_code]
pub enum AavartError {
    #[msg("Pool is full")]
    PoolFull,
    #[msg("Pool is not in waiting state")]
    PoolNotWaiting,
    #[msg("Pool is not active")]
    PoolNotActive,
    #[msg("Already paid this round")]
    AlreadyPaid,
    #[msg("Not your turn to claim")]
    NotYourTurn,
    #[msg("Not all members have paid")]
    NotAllPaid,
    #[msg("Already a member")]
    AlreadyMember,
}

#[derive(Accounts)]
#[instruction(contribution_amount: u64, max_members: u8, round_duration: i64)]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = Pool::size(max_members),
        seeds = [b"pool", creator.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"vault", pool.key().as_ref()],
        bump
    )]
    /// CHECK: vault is a PDA that holds SOL
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
pub struct JoinPool<'info> {
    #[account(mut)]
    pub member: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.creator.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"vault", pool.key().as_ref()],
        bump = pool.vault_bump
    )]
    /// CHECK: vault PDA holds SOL
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub struct Contribute<'info> {
    #[account(mut)]
    pub member: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.creator.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"vault", pool.key().as_ref()],
        bump = pool.vault_bump
    )]
    /// CHECK: vault PDA
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.creator.as_ref()],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"vault", pool.key().as_ref()],
        bump = pool.vault_bump
    )]
    /// CHECK: vault PDA
    pub vault: UncheckedAccount<'info>,

    /// CHECK: treasury wallet
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
