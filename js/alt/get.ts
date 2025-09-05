import { PublicKey } from "@solana/web3.js";

const web3 = require("@solana/web3.js");
const lookupTableAddresses = [
    "FSK2j2CX5ZNSgNmLdJ8mggP5a7qXRCYvGzE3pyiKrs2R",
    "4SUUQ2pu2VDHaoqLJYcn3AGV6tStaf5onuv9HpydbjKJ",
    "83PeDR9o9XYuxBATyJkhSCyA8LASozw7C4RkGC6GF3Rg",
];

(async () => {
    const connection = new web3.Connection("https://testnet.fogo.io");
    const add = new PublicKey(lookupTableAddresses[0]);
    const table = await connection.getAddressLookupTable(add);
    console.log("ALT contains:", table);
})();
