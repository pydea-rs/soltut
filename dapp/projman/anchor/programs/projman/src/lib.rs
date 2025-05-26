use anchor_lang::prelude::*;
use std::time::{SystemTime, UNIX_EPOCH};

declare_id!("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H");

#[error_code]
pub enum ProjmanErrors {
    #[msg("Nothing updated!")]
    NothingUpdated,
    #[msg("Progress needs to be a valid percentage of the work!")]
    InvalidProgress,
    #[msg("Start time must be in future!")]
    InvalidTime
}

fn get_time() -> u64 {
    let now = SystemTime::now();
    now.duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs()
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
        let starts_at_changed = starts_at != project.starts_at;

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
        project.progress = progress;
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
        seeds = [b"project", user.key().as_ref(), ident.as_bytes().as_ref()],
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
        seeds = [b"project", user.key().as_ref(), ident.as_bytes().as_ref()],
        bump = project.bump,
    )]
    pub project: Account<'info, Project>,

    #[account()]
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(ident: String)]
pub struct UpdateProjectProgress<'info> {
    #[account()]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"project", user.key().as_ref(), ident.as_bytes().as_ref()],
        bump = project.bump,
    )]
    pub project: Account<'info, Project>,
}

#[derive(Accounts)]
pub struct DeleteProject<'info> {

}

#[account]
#[derive(InitSpace)]
pub struct Project {
    #[max_len(64)]
    pub title: String,
    #[max_len(16)]
    pub ident: String,
    #[max_len(256)]
    pub description: String,
    pub progress: f32,
    pub starts_at: u64,
    pub bump: u8,
}
