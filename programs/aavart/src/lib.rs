use anchor_lang::prelude::*;

declare_id!("ABhVs3ycfxZvEp2xiP7JjkU4fuCXDNJ5XjUpCXmFPq9E");

#[program]
pub mod aavart {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
