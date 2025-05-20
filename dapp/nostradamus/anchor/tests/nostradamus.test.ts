import * as anchor from '@coral-xyz/anchor'
const IDL = require('../target/idl/nostradamus.json')
import { Nostradamus } from '../target/types/nostradamus'
import { startAnchor, BankrunProvider } from 'anchor-bankrun'
import { PublicKey } from '@solana/web3.js'
import { ProgramTestContext } from 'solana-bankrun'
const programAddress = new PublicKey('FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS')

describe('nostradamus', () => {
  let ctx: ProgramTestContext
  let provider: BankrunProvider
  let program: anchor.Program<Nostradamus>

  beforeAll(async () => {
    ctx = await startAnchor('', [{ name: 'nostradamus', programId: programAddress }], [])
    provider = new BankrunProvider(ctx)
    program = new anchor.Program<Nostradamus>(IDL, provider)
    await program.methods.initializeMarketsCount().rpc()
  })

  it('Initialize nostradamus', async () => {
    const question = 'Will this ?'
    const [marketsCountAddress] = PublicKey.findProgramAddressSync([Buffer.from('counter')], programAddress)

    const nextMarketId = await program.account.marketCounter.fetch(marketsCountAddress)

    await program.methods
      .initializePredictionMarket(
        question,
        new anchor.BN(Date.now() / 1e3),
        new anchor.BN(new Date(2026, 1, 1).getTime() / 1e3),
      )
      .rpc()
    const [marketAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('prediction_market'), nextMarketId.value.toArrayLike(Buffer, 'le', 16)],
      programAddress,
    )
    const market = await program.account.predictionMarket.fetch(marketAddress)
    expect(market.id).toEqual(nextMarketId.value)
    expect(market.question).toEqual(question)
    expect(market.oracle).toEqual(programAddress)
    expect(market.outcomesCount).toEqual(0)
    expect(market.startAt).not.toEqual(market.closeAt)
  })
})
