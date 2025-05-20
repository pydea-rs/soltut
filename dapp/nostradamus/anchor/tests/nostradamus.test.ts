import * as anchor from '@coral-xyz/anchor'
const IDL = require('../target/idl/nostradamus.json')
import { Nostradamus } from '../target/types/nostradamus'
import { startAnchor, BankrunProvider } from 'anchor-bankrun'
import { PublicKey } from '@solana/web3.js'
const programAddress = new PublicKey('FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS')

describe('nostradamus', () => {
  it('Initialize nostradamus', async () => {
    const ctx = await startAnchor('', [{ name: 'nostradamus', programId: programAddress }], []),
      provider = new BankrunProvider(ctx)

    const program = new anchor.Program<Nostradamus>(IDL, provider)
    const question = 'Will this fuck run finally?'

    await program.methods
      .initializePredictionMarket(
        question,
        new anchor.BN(Date.now() / 1e3),
        new anchor.BN(new Date(2026, 1, 1).getTime() / 1e3),
        2,
      )
      .rpc()

    const [marketAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('prediction_market'), provider.wallet.publicKey.toBuffer(), Buffer.from(question)],
      programAddress,
    );

    const market = await program.account.predictionMarket.fetch(marketAddress);
    
    console.log(market);
    expect(market.question).toEqual(question);
    expect(market.oracle).toEqual(programAddress);
    expect(market.outcomesCount).toEqual(2);
    expect(market.startAt).not.toEqual(market.closeAt);
  })
})
