#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

const DISCRIMINATOR_SIZE: usize = 8;

declare_id!("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");

#[program]
pub mod nostradamus {
    use super::*;

    pub fn initialize_markets_count(ctx: Context<InitializeMarketsCount>) -> Result<()>{
        ctx.accounts.markets_count.value = 0;
        Ok(())
    }

    pub fn initialize_prediction_market(
        ctx: Context<InitializePredictionMarket>,
        question: String,
        start_at: u64,
        close_at: u64,
    ) -> Result<()> {
        let pm = &mut ctx.accounts.prediction_market;
        pm.question = question;
        pm.start_at = start_at;
        pm.close_at = close_at;
        pm.outcomes_count = 0;
        pm.id = ctx.accounts.markets_count.value;
        ctx.accounts.markets_count.value += 1;
        pm.oracle = *ctx.program_id;

        Ok(())
    }

    pub fn add_market_outcome(ctx: Context<AddMarketOutcome>, market_id: u128, title: String) -> Result<()> {
        let outcome = &mut ctx.accounts.outcome;
        outcome.market_id = market_id;
        outcome.title = title;
        outcome.index = ctx.accounts.market.outcomes_count;
        outcome.investments = 0;
        ctx.accounts.market.outcomes_count += 1;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMarketsCount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = DISCRIMINATOR_SIZE + MarketCounter::INIT_SPACE,
        seeds = [b"counter"],
        bump
    )]
    pub markets_count: Account<'info, MarketCounter>,

    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct InitializePredictionMarket<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = DISCRIMINATOR_SIZE + MarketCounter::INIT_SPACE,
        seeds = [b"counter"],
        bump
    )]
    pub markets_count: Account<'info, MarketCounter>,

    #[account(
        init,
        payer = user,
        space = DISCRIMINATOR_SIZE + PredictionMarket::INIT_SPACE,
        seeds=[b"prediction_market", markets_count.value.to_le_bytes().as_ref()],
        bump,
    )]
    pub prediction_market: Account<'info, PredictionMarket>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(market_id: u128)]
pub struct AddMarketOutcome<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"prediction_market", market_id.to_le_bytes().as_ref()],
        bump
    )]
    pub market: Account<'info, PredictionMarket>,

    #[account(
        init,
        payer = user,
        space = DISCRIMINATOR_SIZE + Outcome::INIT_SPACE,
        seeds = [b"outcome", market.id.to_le_bytes().as_ref(), market.outcomes_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub outcome: Account<'info, Outcome>,


    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct MarketCounter {
    pub value: u128,
}

#[account]
#[derive(InitSpace)]
pub struct PredictionMarket {
    pub id: u128,
    #[max_len(256)]
    pub question: String,
    pub start_at: u64,
    pub close_at: u64,
    pub outcomes_count: u8,
    pub oracle: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct Outcome {
    pub market_id: u128,
    #[max_len(32)]
    pub title: String,
    pub index: u8,
    pub investments: u64,
}
