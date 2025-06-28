import { PublicKey } from "@solana/web3.js";

const findPdaByAllBumps = (
    programAddressString,
    entityAddressString,
    otherSeedsStrings
) => {
    const programId = new PublicKey(programAddressString),
        entityAddress = new PublicKey(entityAddressString);
    let matches = [];
    const seeds = [
        entityAddress.toBuffer(),
        ...otherSeedsStrings.map((x) => Buffer.from(x)),
    ];
    for (let bump = 255; bump >= 0; bump--) {
        try {
            const pda = PublicKey.createProgramAddressSync(
                [...seeds, Buffer.from([bump])],
                programId
            );
            matches.push({ pda: pda.toString(), bump });
        } catch (ex) {}
    }
    return matches;
};

const matches = findPdaByAllBumps(
    "11111111111111111111111111111111",
    "B9Lf9z5BfNPT4d5KMeaBFx8x1G4CULZYR1jA2kmxRDka",
    ["hello", "World"]
);

console.warn("Canonical Bump: ", matches[0].bump, " => PDA: ", matches[0].pda);
console.log("- - - - - - - - - - - - | - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ")
console.log("\tBUMP\t\t|\t\tPDA")
console.log("- - - - - - - - - - - - | - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ")
for(let i = 1; i < matches.length; i++)
    console.info(`\t${matches[i].bump}\t\t|\t\t${matches[i].pda}`)