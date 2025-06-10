'use client'

import { getProjmanProgram, getProjmanProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { CreateNewProjectArgs, UpdateProjectArgs, UpdateProjectProgressArgs } from './types'
import * as anchor from '@coral-xyz/anchor'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import { getNextIdent } from '../utils'
import { PublicKey } from '@solana/web3.js'

export function useProjmanProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()

  const provider = useAnchorProvider()
  const programId = useMemo(() => getProjmanProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getProjmanProgram(provider, programId), [provider, programId])
  const transactionToast = useTransactionToast()

  const accounts = useQuery({
    queryKey: ['ProjmanAccounts', 'all', { cluster }],
    queryFn: () => program.account.project.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createNewProject = useMutation<{ ident: string; sig: string }, Error, CreateNewProjectArgs>({
    mutationKey: ['project', 'create', { cluster }],
    mutationFn: async ({ title, description, startsAt }) => {
      const ident = getNextIdent()
      return {
        sig: await program.methods
          .createProject(ident, title, description, new anchor.BN((startsAt.getTime() / 1e3) | 0))
          .rpc(),
        ident,
      }
    },
    onSuccess: ({ ident, sig }) => {
      transactionToast(sig)
      toast.success(`New Project ID: ${ident}`)
      accounts.refetch()
    },
    onError: (err) => toast.error('Failed to create project', { description: err.message }),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createNewProject,
  }
}

export function useProjmanProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()

  const transactionToast = useTransactionToast()

  const { program, accounts } = useProjmanProgram()

  const accountQuery = useQuery({
    queryFn: () => program.account.project.fetch(account),
    queryKey: ['get-projman-account', { cluster, account }],
    enabled: !!account,
  })

  const updateProject = useMutation<string, Error, UpdateProjectArgs>({
    mutationKey: ['project', 'update', { cluster }],
    mutationFn: async ({ ident, title, description, startsAt }) =>
      program.methods
        .updateProject(ident, title || '', description || '', new anchor.BN(((startsAt?.getTime() ?? 0) / 1e3) | 0))
        .rpc(),
    onSuccess: (signature: string) => {
      transactionToast(signature)
      toast.success(`Projetct successfully updated.`)
      accounts.refetch()
      accountQuery.refetch()
    },
    onError: (err: Error) => toast.error('Failed updating project', { description: err.message }),
  })

  const updateProjectProgress = useMutation<string, Error, UpdateProjectProgressArgs>({
    mutationKey: ['project', 'update-progress', { cluster }],
    mutationFn: ({ ident, progress }) => program.methods.updateProjectProgress(ident.toString(), progress).rpc(),
    onSuccess: (signature: string) => {
      transactionToast(signature)
      toast.success(`Projetct successfully updated.`)
      accounts.refetch()
      accountQuery.refetch()
    },
    onError: (err: Error) => toast.error('Failed updating project', { description: err.message }),
  })

  const cancelProject = useMutation({
    mutationKey: ['project', 'delete', { cluster }],
    mutationFn: (ident: string) => {
      return program.methods.cancelProject(ident.toString()).rpc()
    }, // I don't why this doesnt need async>
    onSuccess: (signature: string) => {
      transactionToast(signature)
      toast.info('Project canceled!')
      accounts.refetch()
      accountQuery.refetch()
    },
    onError: (err: Error) => toast.error('Failed updating project', { description: err.message }),
  })
  return { program, accountQuery, updateProject, updateProjectProgress, cancelProject }
}
