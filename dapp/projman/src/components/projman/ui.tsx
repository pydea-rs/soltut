'use client'

import { useState } from 'react'
import { useProjmanProgram } from './data-access'
import { Button } from '@/components/ui/button'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import { Input } from '../ui/input'

export function ProjmanCreate() {
  const { createNewProject } = useProjmanProgram()
  const [title, setTitle] = useState<string>('Unnamed')
  const [description, setDescription] = useState<string>('')
  const [startsAt, setStartsAt] = useState<Date>(new Date())
  const wallet = useWallet()

  const isFormValid = () =>
    title?.trim().length > 3 && title?.length < 64 && description?.length < 256 && startsAt >= new Date()

  const onSubmit = () => {
    if (!wallet?.publicKey) {
      toast.error('First connect your wallet!')
      return
    }
    if (!isFormValid()) {
      toast.error('Checkout your input!')
      return
    }
    createNewProject.mutateAsync({ title, description, startsAt })
  }

  return wallet?.publicKey ? (
    <div>
      <Input
        type="text"
        placeholder="Enrter project title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-bordered w-full max-w-xs"
        maxLength={64}
        minLength={3}
        onInvalid={() => <p className="text-red">Title must be 3 to 64 characters long.</p>}
      ></Input>
      <textarea
        placeholder="Enter the description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={256}
        className="textarea textarea-bordered w-full"
        onInvalid={() => <p className="text-red">Description must be less than 256 characters long.</p>}
      ></textarea>
      <Input
        type="date"
        value={startsAt.toISOString().substring(0, 10)}
        onChange={(e) => setStartsAt(new Date(e.target.value))}
        className="input input-bordered w-full max-w-xs"
      ></Input>

      <Button
        variant={'default'}
        type="submit"
        className="btn btn-primary btn-xs lg:btn-md"
        onClick={onSubmit}
        disabled={createNewProject.isPending || !wallet?.publicKey}
      >
        Run program{createNewProject.isPending && '...'}
      </Button>
    </div>
  ) : (
    <p>Connect your wallet ...</p>
  )
}

export function ProjmanProgram() {
  const { getProgramAccount } = useProjmanProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      <pre>{JSON.stringify(getProgramAccount.data.value, null, 2)}</pre>
    </div>
  )
}
