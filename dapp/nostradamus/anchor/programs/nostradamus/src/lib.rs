#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

use anchor_lang::solana_program::{program::invoke, system_instruction};

const DISCRIMINATOR_SIZE: usize = 8;

#[error_code]
pub enum TradeErrors {
    #[msg("You don't have enough balance for this!")]
    InsufficientCollateralBalance,

    #[msg("You can't sell than more than your investment!")]
    InsufficientOutcomeBalance,

    #[msg("Invalid argument provided as outcome amount!")]
    InvalidAmount,
}
declare_id!("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");

#[program]
pub mod nostradamus {

    use anchor_lang::solana_program::program::invoke_signed;

    use super::*;

    pub fn initialize_markets_count(ctx: Context<InitializeMarketsCount>) -> Result<()> {
        ctx.accounts.markets_count.value = 0;
        ctx.accounts.markets_count.bump = ctx.bumps.markets_count;
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
        pm.bump = ctx.bumps.prediction_market;
        Ok(())
    }

    pub fn add_market_outcome(
        ctx: Context<AddMarketOutcome>,
        market_id: u128,
        title: String,
    ) -> Result<()> {
        let outcome = &mut ctx.accounts.outcome;
        outcome.market_id = market_id;
        outcome.title = title;
        outcome.index = ctx.accounts.market.outcomes_count;
        ctx.accounts.market.outcomes_count += 1;
        outcome.bump = ctx.bumps.outcome;
        Ok(())
    }

    pub fn create_prediction(
        ctx: Context<CreatePrediction>,
        market_id: u128,
        outcome_index: u8,
        ratio: u128,
    ) -> Result<()> {
        msg!(
            "Creating prediction for market: {}, outcome: {}, ratio: {}",
            market_id,
            outcome_index,
            ratio
        );
        let prediction = &mut ctx.accounts.prediction;
        prediction.market_id = market_id;
        prediction.outcome_index = outcome_index;
        prediction.ratio = ratio;
        prediction.bump = ctx.bumps.prediction;
        Ok(())
    }

    pub fn trade_predicted_outcome(
        ctx: Context<TradePredictedOutcome>,
        market_id: u128,
        outcome_index: u8,
        ratio: u128,
        amount: i64,
    ) -> Result<()> {
        let prediction = &mut ctx.accounts.prediction;
        require!(amount != 0, TradeErrors::InvalidAmount);

        if amount > 0 {
            let buying_amount = amount as u64; // FIXME: Needs revising after AMM Price Implementation
            require!(
                buying_amount < ctx.accounts.user.lamports(),
                TradeErrors::InsufficientCollateralBalance
            );
            invoke(
                &system_instruction::transfer(
                    ctx.accounts.user.key,
                    &prediction.key(),
                    buying_amount,
                ),
                &[
                    ctx.accounts.user.to_account_info(),
                    prediction.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?; // TODO: These transfers are just sample transfers and needs revising.
            prediction.investment += buying_amount as u128;
        } else {
            let selling_amount = amount.abs() as u64;
            require!(
                (selling_amount as u128) <= prediction.investment,
                TradeErrors::InsufficientOutcomeBalance
            );

            let prediction_seeds: &[&[u8]] = &[
                b"positions",
                &market_id.to_le_bytes(),
                &[outcome_index],
                &ratio.to_le_bytes(),
                ctx.accounts.user.key.as_ref(),
                &[prediction.bump],
            ]; // NOTE - This section needs updating in case of prediction seeds changing.
            invoke_signed(
                &system_instruction::transfer(
                    &prediction.key(),
                    ctx.accounts.user.key,
                    selling_amount,
                ),
                &[
                    prediction.to_account_info(),
                    ctx.accounts.user.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[prediction_seeds],
            )?; // FIXME: This still has a bug
            prediction.investment -= selling_amount as u128;
        }
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
        mut,
        seeds = [b"counter"],
        bump = markets_count.bump,
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
        bump = market.bump,
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

#[derive(Accounts)]
#[instruction(market_id: u128, outcome_index: u8, ratio: u128)]
pub struct CreatePrediction<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"prediction_market", market_id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, PredictionMarket>,

    #[account(
        seeds = [b"outcome", market_id.to_le_bytes().as_ref(), outcome_index.to_le_bytes().as_ref()],
        bump = outcome.bump,
    )]
    pub outcome: Account<'info, Outcome>,

    #[account(
        init,
        payer = user,
        space = DISCRIMINATOR_SIZE + Prediction::INIT_SPACE,
        seeds = [b"positions", market.id.to_le_bytes().as_ref(), outcome.index.to_le_bytes().as_ref(), ratio.to_le_bytes().as_ref(), user.key().as_ref()],
        bump
    )]
    pub prediction: Account<'info, Prediction>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(market_id: u128, outcome_index: u8, ratio: u128, amount: i64)]
pub struct TradePredictedOutcome<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"prediction_market", market_id.to_le_bytes().as_ref()],
        bump = market.bump,
    )]
    pub market: Account<'info, PredictionMarket>,

    #[account(
        seeds = [b"outcome", market_id.to_le_bytes().as_ref(), outcome_index.to_le_bytes().as_ref()],
        bump = outcome.bump,
    )]
    pub outcome: Account<'info, Outcome>,

    #[account(
        mut,
        seeds = [b"positions", market.id.to_le_bytes().as_ref(), outcome.index.to_le_bytes().as_ref(), ratio.to_le_bytes().as_ref(), user.key().as_ref()],
        bump = prediction.bump,
    )]
    pub prediction: Account<'info, Prediction>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct MarketCounter {
    pub value: u128,
    pub bump: u8,
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
    pub bump: u8,
} // maybe add has_deeper_outcomes, and is_continues flags, to prevent unwanted predictions with unwanted ratios>

#[account]
#[derive(InitSpace)]
pub struct Outcome {
    pub market_id: u128,
    #[max_len(32)]
    pub title: String,
    pub index: u8,
    pub bump: u8,
    // TODO: For resolution ad trueness_ratio or use other algorithms
}

#[account]
#[derive(InitSpace)]
pub struct Prediction {
    pub market_id: u128,
    pub outcome_index: u8,
    pub ratio: u128, // 100% - Yes, 0 - No; Can also be 0->100% or any continues value in continues prediction markets (9 digits decimal -> / 1e9)
    pub investment: u128,
    pub bump: u8,
}
