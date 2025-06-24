use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let program_address = Pubkey::from_str("11111111111111111111111111111111")?;

    let seed_bytes = b"whatever";
    let optiona_add = b"B9Lf9z5BfNPT4d5KMeaBFx8x1G4CULZYR1jA2kmxRDka";
    let seeds = &[seed_bytes, optiona_add.as_ref()];
    let (pda, bump) = Pubkey::find_program_address(seeds, &program_address);
    println!("PDA: {}, bump: {}", pda, bump);
    Ok(())
}
