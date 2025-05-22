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
  let sampleMarketId: anchor.BN

  beforeAll(async () => {
    ctx = await startAnchor('', [{ name: 'nostradamus', programId: programAddress }], [])
    provider = new BankrunProvider(ctx)
    program = new anchor.Program<Nostradamus>(IDL, provider)
    await program.methods.initializeMarketsCount().rpc()
  })

  it('Create a prediction market', async () => {
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

  it('Create outcomes for a prediction market', async () => {
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
    let market = await program.account.predictionMarket.fetch(marketAddress)
    expect(market.outcomesCount).toEqual(0)

    // Outcome A
    await program.methods.addMarketOutcome(nextMarketId.value, 'A').rpc()
    market = await program.account.predictionMarket.fetch(marketAddress)
    expect(market.outcomesCount).toEqual(1)

    // Outcome B
    await program.methods.addMarketOutcome(nextMarketId.value, 'B').rpc()
    market = await program.account.predictionMarket.fetch(marketAddress)
    expect(market.outcomesCount).toEqual(2)

    const outcomes = ['A', 'B']
    for (let i = 0; i < 2; i++) {
      const [outcomeAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('outcome'),
          nextMarketId.value.toArrayLike(Buffer, 'le', 16),
          new anchor.BN(i).toArrayLike(Buffer, 'le', 1),
        ],
        programAddress,
      )

      const outcome = await program.account.outcome.fetch(outcomeAddress)
      expect(outcome.index).toEqual(i)
      expect(outcome.title).toEqual(outcomes[i])
      expect(outcome.marketId).toEqual(market.id)
    }
    sampleMarketId = nextMarketId.value
  })

  it('Should create a prediction pda for users to allow them participate in a discrete market', async () => {
    await Promise.all(
      Array.from({ length: 2 }).map((_, idx) =>
        program.methods.createPrediction(sampleMarketId, idx, new anchor.BN(1)).rpc(),
      ),
    )

    const [[predictionA_Address], [predictionB_Address]] = Array.from({ length: 2 }).map((_, idx) =>
      PublicKey.findProgramAddressSync(
        [
          Buffer.from('positions'),
          sampleMarketId.toArrayLike(Buffer, 'le', 16),
          new anchor.BN(idx).toArrayLike(Buffer, 'le', 1),
          new anchor.BN(1).toArrayLike(Buffer, 'le', 16),
          provider.wallet.publicKey.toBuffer(),
        ],
        programAddress,
      ),
    )

    const predictions = await Promise.all(
      [predictionA_Address, predictionB_Address].map((address) => program.account.prediction.fetch(address)),
    )
    for (let i = 0; i < 2; i++) {
      expect(predictions[i].marketId).toEqual(sampleMarketId)
      expect(predictions[i].outcomeIndex).toEqual(i)
      expect(predictions[i].ratio.toString()).toEqual('1')
      expect(predictions[i].investment.toNumber()).toEqual(0)
    }
  })
  it('Should enable users to buy outcomes in an opened prediction.', async () => {
    const testInvestmentAmount = 10
    await Promise.all(
      Array.from({ length: 2 }).map((_, idx) =>
        program.methods
          .tradePredictedOutcome(sampleMarketId, idx, new anchor.BN(1), new anchor.BN(testInvestmentAmount))
          .rpc(),
      ),
    )

    const [[predictionA_Address], [predictionB_Address]] = Array.from({ length: 2 }).map((_, idx) =>
      PublicKey.findProgramAddressSync(
        [
          Buffer.from('positions'),
          sampleMarketId.toArrayLike(Buffer, 'le', 16),
          new anchor.BN(idx).toArrayLike(Buffer, 'le', 1),
          new anchor.BN(1).toArrayLike(Buffer, 'le', 16),
          provider.wallet.publicKey.toBuffer(),
        ],
        programAddress,
      ),
    )

    const predictions = await Promise.all(
      [predictionA_Address, predictionB_Address].map((address) => program.account.prediction.fetch(address)),
    )

    for (let i = 0; i < 2; i++) {
      expect(predictions[i].marketId).toEqual(sampleMarketId)
      expect(predictions[i].outcomeIndex).toEqual(i)
      expect(predictions[i].ratio.toString()).toEqual('1')
      expect(predictions[i].investment.toString()).toEqual(testInvestmentAmount.toString())
    }
  })

  it('Should enable users to sell outcomes in an opened prediction.', async () => {
    const [[predictionA_Address], [predictionB_Address]] = Array.from({ length: 2 }).map((_, idx) =>
      PublicKey.findProgramAddressSync(
        [
          Buffer.from('positions'),
          sampleMarketId.toArrayLike(Buffer, 'le', 16),
          new anchor.BN(idx).toArrayLike(Buffer, 'le', 1),
          new anchor.BN(1).toArrayLike(Buffer, 'le', 16),
          provider.wallet.publicKey.toBuffer(),
        ],
        programAddress,
      ),
    )
    const testSellAmount = 7
    const initialInvestmentAmounts = (
      await Promise.all(
        [predictionA_Address, predictionB_Address].map((address) => program.account.prediction.fetch(address)),
      )
    ).map((x) => x.investment)

    await Promise.all(
      Array.from({ length: 2 }).map((_, idx) =>
        program.methods
          .tradePredictedOutcome(sampleMarketId, idx, new anchor.BN(1), new anchor.BN(testSellAmount).neg())
          .rpc(),
      ),
    )

    const predictions = await Promise.all(
      [predictionA_Address, predictionB_Address].map((address) => program.account.prediction.fetch(address)),
    )

    for (let i = 0; i < 2; i++) {
      expect(predictions[i].marketId).toEqual(sampleMarketId)
      expect(predictions[i].outcomeIndex).toEqual(i)
      expect(predictions[i].ratio.toString()).toEqual('1')
      expect(predictions[i].investment.toString()).toEqual(initialInvestmentAmounts[i].sub(new anchor.BN(testSellAmount)).toString())
    }
  })
})
