import {
    Connection,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction,
    Transaction,
} from "@solana/web3.js";
import { AddressLookupTableProgram } from "@solana/web3.js";
import fs from "fs";
import { loadKeypairFromFile } from "./utils";

async function main() {
    // Connect to devnet
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Generate a new keypair
    const keypair = loadKeypairFromFile(
        "/home/paya/.config/solana/secondary.json"
    );

    // Get recent blockhash for transaction
    const slot = await connection.getSlot("confirmed");

    // Create lookup table instruction
    const [lookupTableInst, lookupTableAddress] =
        AddressLookupTableProgram.createLookupTable({
            authority: keypair.publicKey,
            payer: keypair.publicKey,
            recentSlot: slot,
        });

    // Create transaction with the lookup table instruction
    const tx = new Transaction().add(lookupTableInst);

    // Send transaction
    await sendAndConfirmTransaction(connection, tx, [keypair]);
    console.log("Lookup Table created!");
    console.log("Lookup Table Address:", lookupTableAddress.toBase58());
}

main().catch((err) => {
    console.error(err);
});
