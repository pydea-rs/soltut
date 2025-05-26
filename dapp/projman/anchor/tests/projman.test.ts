import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Projman } from '../target/types/projman'
import { PublicKey } from '@solana/web3.js'

describe('projman', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())
  let provider: anchor.Provider
  const program = anchor.workspace.Projman as Program<Projman>

  beforeAll(() => {
    provider = anchor.getProvider()
  })
  it('should run the program', async () => {
    // Add your test here.
    const startsAt = Date.now() / 1e3
    await program.methods.createProject('ident', 'title', 'description', new anchor.BN(startsAt)).rpc()

    if (!provider.wallet) {
      throw new Error('Invalid wallet!')
    }
    const [projectAccountAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('project'), provider.wallet?.publicKey.toBuffer(), Buffer.from('ident')],
      program.programId,
    )

    const project = await program.account.project.fetch(projectAccountAddress)

    expect(project.ident).toEqual('ident')
    expect(project.title).toEqual('title')
    expect(project.description).toEqual('description')
    expect(project.progress).toEqual(0.0)
    expect(project.startsAt.toNumber()).toBeGreaterThan(startsAt)
  })
})
