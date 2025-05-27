// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import ProjmanIDL from '../target/idl/projman.json'
import type { Projman } from '../target/types/projman'

// Re-export the generated IDL and type
export { Projman, ProjmanIDL }

// The programId is imported from the program IDL.
export const PROJMAN_PROGRAM_ID = new PublicKey(ProjmanIDL.address)

// This is a helper function to get the Projman Anchor program.
export function getProjmanProgram(provider: AnchorProvider, address?: PublicKey): Program<Projman> {
  return new Program({ ...ProjmanIDL, address: address ? address.toBase58() : ProjmanIDL.address } as Projman, provider)
}

// This is a helper function to get the program ID for the Projman program depending on the cluster.
export function getProjmanProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Projman program on devnet and testnet.
      return new PublicKey('6z68wfurCMYkZG51s1Et9BJEd9nJGUusjHXNt4dGbNNF')
    case 'mainnet-beta':
    default:
      return PROJMAN_PROGRAM_ID
  }
}
