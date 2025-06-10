use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("EVv5dxogrbbrWL6Yywv2JFAHqcdeoo2LMrj8BPgFfsm1");

#[error_code]
pub enum ProjmanErrors {
    #[msg("Nothing updated!")]
    NothingUpdated,
    #[msg("Progress needs to be a valid percentage of the work!")]
    InvalidProgress,
    #[msg("Start time must be in future!")]
    InvalidTime,
    #[msg("Project not started yet!")]
    NotStartedYet,
}

pub fn get_time() -> u64 {
    Clock::get().unwrap().unix_timestamp as u64
}

#[program]
pub mod projman {
    use super::*;

    pub fn create_project(
        ctx: Context<CreateProject>,
        ident: String,
        title: String,
        description: String,
        starts_at: u64,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;

        project.ident = ident;
        project.title = title;

        require!(get_time() <= starts_at, ProjmanErrors::InvalidTime);
        project.starts_at = starts_at;
        project.description = description;
        project.progress = 0.0_f32;
        project.bump = ctx.bumps.project;
        Ok(())
    }

    pub fn update_project(
        ctx: Context<UpdateProject>,
        _ident: String,
        title: String,
        description: String,
        starts_at: u64,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let title_changed = title.len() > 0;
        let description_changed = description.len() > 0;
        let starts_at_changed = starts_at > 0 && starts_at != project.starts_at;

        require!(
            title_changed || description_changed || starts_at_changed,
            ProjmanErrors::NothingUpdated
        );

        if title_changed {
            project.title = title;
        }
        if description_changed {
            project.description = description;
        }
        if starts_at_changed {
            require!(get_time() <= starts_at, ProjmanErrors::InvalidTime);
            project.starts_at = starts_at;
        }
        Ok(())
    }

    pub fn update_project_progress(ctx: Context<UpdateProjectProgress>, _ident: String, progress: f32) -> Result<()> {
        let project = &mut ctx.accounts.project;
        require!(progress != project.progress, ProjmanErrors::NothingUpdated);
        require!(progress <= 100.0_f32 && progress >= 0.0_f32, ProjmanErrors::InvalidProgress);
        require!(progress == 0.0_f32 || get_time() >= project.starts_at, ProjmanErrors::NotStartedYet);

        project.progress = progress;
        Ok(())
    }

    pub fn cancel_project(_ctx: Context<CancelProject>, _ident: String) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(ident: String)]
pub struct CreateProject<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + Project::INIT_SPACE,
        seeds = [b"projects", user.key().as_ref(), ident.as_bytes().as_ref()],
        bump
    )]
    pub project: Account<'info, Project>,

    #[account()]
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(ident: String)]
pub struct UpdateProject<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        realloc = 8 + Project::INIT_SPACE,
        realloc::payer = user,
        realloc::zero = true,
        seeds = [b"projects", user.key().as_ref(), ident.as_bytes().as_ref()],
        bump = project.bump,
    )]
    pub project: Account<'info, Project>,

    #[account()]
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(ident: String)]
pub struct UpdateProjectProgress<'info> {
    #[account()] // TODO: Does user pay here?
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"projects", user.key().as_ref(), ident.as_bytes().as_ref()],
        bump = project.bump,
    )]
    pub project: Account<'info, Project>,
}

#[derive(Accounts)]
#[instruction(ident: String)]
pub struct CancelProject<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"projects", user.key().as_ref(), ident.as_bytes().as_ref()],
        bump = project.bump,
        close = user,
    )]
    pub project: Account<'info, Project>,

    #[account()]
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Project {
    #[max_len(64)]
    pub title: String,
    #[max_len(32)]
    pub ident: String,
    #[max_len(256)]
    pub description: String,
    pub progress: f32,
    pub starts_at: u64,
    pub bump: u8,
}
