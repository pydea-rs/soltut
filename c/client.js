import {Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction} from '@solana/web3.js';
import fs from 'fs';

const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('payer.json'))));
const counter = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('counter.json'))));
const programId = new PublicKey('<PROGRAM_ID>');

// instruction data: u64 LE (e.g. 5)
const inc = 5n;
const data = Buffer.alloc(8);
data.writeBigUInt64LE(inc);

const ix = new TransactionInstruction({
  programId,
  keys: [
    {pubkey: counter.publicKey, isSigner: false, isWritable: true},
  ],
  data
});

await sendAndConfirmTransaction(conn, new Transaction().add(ix), [payer]);
