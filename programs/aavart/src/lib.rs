use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod aavart {
    use super::*;
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
