import {
  createInitializeMint2Instruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const conn = new Connection("https://api.devnet.solana.com", "confirmed");

const authorityWallet = new Keypair(),
  mintAccount = new Keypair();

const airdropTX = await conn.requestAirdrop(
  authorityWallet.publicKey,
  LAMPORTS_PER_SOL
);

await conn.confirmTransaction(airdropTX, "confirmed");

const rentExemptLamports = await getMinimumBalanceForRentExemptMint(conn); // Get he min lamports required so that the token stays onchain for ever.

const createMintAccountInstruction = SystemProgram.createAccount({
  fromPubkey: authorityWallet.publicKey,
  lamports: rentExemptLamports,
  newAccountPubkey: mintAccount.publicKey,
  programId: TOKEN_2022_PROGRAM_ID,
  space: MINT_SIZE,
});

const initMintInstruction = createInitializeMint2Instruction(
  mintAccount.publicKey,
  2,
  authorityWallet.publicKey,
  authorityWallet.publicKey,
  TOKEN_2022_PROGRAM_ID
);

const tx = new Transaction().add(
  createMintAccountInstruction,
  initMintInstruction
);

const sig = await sendAndConfirmTransaction(conn, tx, [
  authorityWallet,
  mintAccount,
]);

console.log({ mintAccount: mintAccount.publicKey, signature: sig });
