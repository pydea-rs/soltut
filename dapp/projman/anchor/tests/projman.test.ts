import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Projman } from '../target/types/projman'
import { PublicKey } from '@solana/web3.js'
import * as IDL from '../target/idl/projman.json'
import { ProgramTestContext, startAnchor } from 'solana-bankrun'
import { BankrunProvider } from 'anchor-bankrun'
import { getNextIdent } from '../../src/components/utils'

const programId = new PublicKey('EVv5dxogrbbrWL6Yywv2JFAHqcdeoo2LMrj8BPgFfsm1')

describe('projman', () => {
  // Configure the client to use the local cluster.
  let context: ProgramTestContext
  let provider: anchor.Provider
  let program: Program<Projman>

  beforeAll(async () => {
    context = await startAnchor('', [{ name: 'projman', programId }], [])
    provider = new BankrunProvider(context)
    program = new anchor.Program<Projman>(IDL, provider)
  })

  it('should run the program', async () => {
    // Add your test here.
    const startsAt = new Date(2026, 1, 1).getTime() / 1e3
    const ident = getNextIdent()
    await program.methods.createProject(ident, 'title', 'description', new anchor.BN(startsAt | 0)).rpc()

    if (!provider.wallet) {
      throw new Error('Invalid wallet!')
    }
    const [projectAccountAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('projects'), provider.wallet.publicKey.toBuffer(), Buffer.from(ident)],
      program.programId,
    )

    const project = await program.account.project.fetch(projectAccountAddress)

    expect(project.ident).toEqual(ident)
    expect(project.title).toEqual('title')
    expect(project.description).toEqual('description')
    expect(project.progress).toEqual(0.0)
    expect(project.startsAt.toNumber()).toEqual(startsAt)
  })
})
