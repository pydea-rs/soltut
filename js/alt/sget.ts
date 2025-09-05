import { PublicKey } from "@solana/web3.js";

const web3 = require("@solana/web3.js");
const lookupTableAddresses = ["6rJrj26sJbzBSrSUFimcxpGmWpoAL84eNoxt81eq343L"];

(async () => {
    // Connect to devnet
    const connection = new web3.Connection(
        web3.clusterApiUrl("devnet"),
        "confirmed"
    );

    const add = new PublicKey(lookupTableAddresses[0]);
    const table = await connection.getAddressLookupTable(add);
    console.log(
        "ALT contains:",
        table.value?.state?.addresses.map((a) => a.toBase58())
    );
})();
