import { loadKeypairFromFile } from "./utils";

import * as web3 from "@solana/web3.js";

const lookupTableAddresses = [
    "FSK2j2CX5ZNSgNmLdJ8mggP5a7qXRCYvGzE3pyiKrs2R",
    "4SUUQ2pu2VDHaoqLJYcn3AGV6tStaf5onuv9HpydbjKJ",
    "83PeDR9o9XYuxBATyJkhSCyA8LASozw7C4RkGC6GF3Rg",
];

(async () => {
    const connection = new web3.Connection("https://testnet.fogo.io");

    const payer = loadKeypairFromFile(
        "/home/paya/p4ya.gcc/astrol/pyron/Stuff/programs/keypairs/fogo-upgrade-authority.json"
    );

    const alt = new web3.PublicKey(lookupTableAddresses[0]);
    const extendInstruction = web3.AddressLookupTableProgram.extendLookupTable({
        payer: payer.publicKey,
        authority: payer.publicKey,
        lookupTable: alt,
        addresses: [
            new web3.PublicKey("89ZQeCPwkzSPJyTpktCKWNY6hBWMKuYt47R85Jo36yyh"),
        ],
    });

    const tx = new web3.Transaction().add(extendInstruction);

    const sig = await web3.sendAndConfirmTransaction(connection, tx, [payer]);
    console.log("tx signature: ", sig);
})();
