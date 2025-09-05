import { Keypair } from "@solana/web3.js";
import fs from "fs";

export function loadKeypairFromFile(path: string): Keypair {
    const secret = JSON.parse(fs.readFileSync(path, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(secret));
}
