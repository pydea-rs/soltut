import { loadKeypairFromFile } from "./utils";

import * as web3 from "@solana/web3.js";
const lookupTableAddresses = [
    "6rJrj26sJbzBSrSUFimcxpGmWpoAL84eNoxt81eq343L",
];
(async () => {
    const connection = new web3.Connection(
        web3.clusterApiUrl("devnet"),
        "confirmed"
    );

    const payer = loadKeypairFromFile(
        "/home/paya/.config/solana/secondary.json"
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
