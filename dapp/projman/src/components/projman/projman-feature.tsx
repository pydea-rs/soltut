'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { ExplorerLink } from '../cluster/cluster-ui'
import { WalletButton } from '../solana/solana-provider'
import { useProjmanProgram } from './projman-data-access'
import { ProjmanCreate, ProjmanProgram } from './projman-ui'
import { AppHero } from '../app-hero'
import { ellipsify } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'

export default function ProjmanFeature() {
  const { publicKey } = useWallet()
  const { programId, accounts } = useProjmanProgram()
  const [myAccounts, setMyAccounts] = useState<PublicKey[] | undefined>(undefined)
  useEffect(() => {
    if (!publicKey) return

    setMyAccounts(
      accounts.data
        ?.filter(
          (account) =>
            account.publicKey.toString().toLowerCase() ===
            PublicKey.findProgramAddressSync(
              [Buffer.from('projects'), publicKey.toBuffer(), Buffer.from(account.account.ident)],
              programId,
            )[0]
              .toString()
              .toLowerCase(),
        )
        .map((x) => x.publicKey),
    )
  }, [accounts.data, publicKey, programId])

  return publicKey ? (
    <div>
      <AppHero title="Projman" subtitle={'Run the program by clicking the "Run program" button.'}>
        <p className="mb-6">
          <ExplorerLink path={`account/${programId}`} label={ellipsify(programId.toString())} />
        </p>
        <ProjmanCreate />
      </AppHero>
      {!accounts?.isLoading && myAccounts?.length ? (
        <ProjmanProgram account={myAccounts[0]} />
      ) : null}
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton className="btn btn-primary" />
        </div>
      </div>
    </div>
  )
}
