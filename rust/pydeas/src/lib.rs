use anchor_lang::prelude::*;

pub const PROGRAM_DISCRIMINATOR_SIZE: usize = 8;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod pydeas {
    use super::*;

    pub fn throw_out_idea(ctx: Context<ThrowOutIdea>, title: String, explanation: String, priority: u8, progress: f32, tags: Vec<String>) -> Result<()> {
        msg!("{}: Whatsup?", ctx.program_id);
        let user_public_address = ctx.accounts.user.key();

        msg!("User {} -> {}: {}", user_public_address, title, explanation);
                
        ctx.accounts.idea.set_inner(
            Idea{id: ctx.accounts.counter.value, title, explanation, priority, progress, tags}
        );
        ctx.accounts.counter.value += 1;

        Ok(())
    } 
}

#[account]  // data template
#[derive(InitSpace)]  // Icd nitSpace needs specifying heap allocating types
pub struct Idea {
    pub id: u64,

    #[max_len(16)]
    pub title: String,

    #[max_len(128)]
    pub explanation: String,
    
    pub priority: u8,
    pub progress: f32,
    
    #[max_len(5, 16)] // 5x16-chars
    pub tags: Vec<String>,
}

#[account]
#[derive(InitSpace)]
pub struct Counter {
    value: u64
}

#[derive(Accounts)]
pub struct ThrowOutIdea<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = PROGRAM_DISCRIMINATOR_SIZE + Counter::INIT_SPACE,
        seeds = [b"counter", user.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,

    #[account( 
        init, // init_if_needed, // SHOULD BE enabled directly in toml  using 'feature = init_if_needed'
        payer = user, 
        space = PROGRAM_DISCRIMINATOR_SIZE + Idea::INIT_SPACE,
        seeds = [b"idea", user.key().as_ref(), &counter.value.to_le_bytes()],
        bump
     )]
    pub idea: Account<'info, Idea>,

    pub system_program: Program<'info, System>
}