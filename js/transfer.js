import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const conn = new Connection("https://api.devnet.solana.com", "confirmed");

const [sender, receiver] = Array(2)
  .fill(0)
  .map(() => new Keypair());

const airdropTxSignature = await conn.requestAirdrop(
  sender.publicKey,
  LAMPORTS_PER_SOL
);

console.info(
  "Confirm airdrop: ",
  await conn.confirmTransaction(airdropTxSignature)
);

const instruction = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: receiver.publicKey,
  lamports: 0.01 * LAMPORTS_PER_SOL,
});

const tx = new Transaction().add(instruction);

const transfertxSignature = await sendAndConfirmTransaction(conn, tx, [sender]);

console.info(transfertxSignature);

console.log({ sender: sender.publicKey, receiver: receiver.publicKey });
