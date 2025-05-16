import { Connection, PublicKey } from "@solana/web3.js";
import { MintLayout } from "@solana/spl-token";

const conn = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

const usdcMintAccountAddress = new PublicKey(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

const info = await conn.getAccountInfo(usdcMintAccountAddress);

// Decode the mint account data
const mintInfo = MintLayout.decode(info.data); // or use getMint from start

console.log(mintInfo)