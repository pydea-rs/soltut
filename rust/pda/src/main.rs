use solana_sdk::pubkey::Pubkey;
use std::str::FromStr;

fn find_pda(str_program_address: &'static str, str_entity_address: &'static str, other_seeds: &[&str]) -> anyhow::Result<(Pubkey, u8)> {
    let program_address = Pubkey::from_str(str_program_address)?;
    
    let mut seed_bytes: Vec<&[u8]> = other_seeds.iter().map(|s| s.as_bytes()).collect();
    let optional_add = Pubkey::from_str(str_entity_address)?;
    seed_bytes.push(optional_add.as_ref());
    let seeds = seed_bytes.as_slice().as_ref();
    let result = Pubkey::find_program_address(seeds, &program_address);
    Ok(result)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let (pda, bump) = find_pda("11111111111111111111111111111111", "B9Lf9z5BfNPT4d5KMeaBFx8x1G4CULZYR1jA2kmxRDka", &["fuck", "you"])?;
    println!("pda: {} with bump: {}", pda, bump);
    Ok(())
}