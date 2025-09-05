import { loadKeypairFromFile } from "./utils";

const web3 = require("@solana/web3.js");

// connect to a cluster and get the current `slot`
(async () => {
    const connection = new web3.Connection("https://testnet.fogo.io");
    const slot = await connection.getSlot();

    const payer = loadKeypairFromFile(
        "/home/paya/p4ya.gcc/astrol/pyron/Stuff/programs/keypairs/fogo-upgrade-authority.json"
    );

    const [lookupTableInst, lookupTableAddress] =
        web3.AddressLookupTableProgram.createLookupTable({
            authority: payer.publicKey,
            payer: payer.publicKey,
            recentSlot: slot,
        });

    console.log("lookup table address:", lookupTableAddress.toBase58());
})();
