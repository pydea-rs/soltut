#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
const DISCRIMINATOR_SIZE: usize = 8;

declare_id!("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");

#[program]
pub mod nostradamus {
    use super::*;

    pub fn initialize_prediction_market(
        ctx: Context<InitializePredictionMarket>,
        id: u64,
        question: String,
        start_at: u64,
        close_at: u64,
        outcomes_count: u8,
    ) -> Result<()> {
        let pm = &mut ctx.accounts.prediction_market;
        pm.id = id;
        pm.question = question;
        pm.start_at = start_at;
        pm.close_at = close_at;
        pm.outcomes_count = outcomes_count;
        msg!("{} has created {}'s new prediction market: {}", ctx.program_id, ctx.accounts.user.key(), pm.question);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct InitializePredictionMarket<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = DISCRIMINATOR_SIZE + PredictionMarket::INIT_SPACE,
        seeds=[b"prediction_market", user.key().as_ref(), id.to_le_bytes().as_ref()],
        bump,
    )]
    pub prediction_market: Account<'info, PredictionMarket>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct PredictionMarket {
    pub id: u64,

    #[max_len(256)]
    pub question: String,
    pub start_at: u64,
    pub close_at: u64,
    pub outcomes_count: u8,

    pub oracle: Pubkey,
}
