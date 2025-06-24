'use client'

import { useEffect, useState } from 'react'
import { useProjmanProgram, useProjmanProgramAccount } from './projman-data-access'
import { Button } from '@/components/ui/button'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import { Input } from '../ui/input'
import { PublicKey } from '@solana/web3.js'
import { motion } from 'framer-motion'
import * as Slider from '@radix-ui/react-slider'

export function ProjmanCreate() {
  const { createNewProject } = useProjmanProgram()
  const [title, setTitle] = useState('Unnamed')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState(new Date())
  const wallet = useWallet()

  const isFormValid = () =>
    title?.trim().length > 3 &&
    title?.length <= 64 &&
    description?.length <= 256 &&
    true //startsAt >= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  const onSubmit = async () => {
    if (!wallet?.publicKey) return toast.error('First connect your wallet!')
    if (!isFormValid()) return toast.error('Check your input fields!')
    await createNewProject.mutateAsync({
      title,
      description,
      startsAt: new Date(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate()),
    })
  }

  if (!wallet?.publicKey) {
    return (
      <div className="text-center py-6">
        <p className="text-lg text-muted">Connect your wallet to create a project</p>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6 max-w-xl mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div>
        <label className="block text-sm font-medium mb-1">Project Title</label>
        <Input
          type="text"
          placeholder="Enter project title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={64}
        />
        <p className="text-xs text-red-500 mt-1">
          {title?.trim().length > 0 && title.trim().length < 4 && 'Title must be at least 4 characters.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          placeholder="Enter the description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={256}
          className="textarea textarea-bordered w-full min-h-[6rem] rounded-md border border-gray-300 px-3 py-2"
        />
        <p className="text-xs text-red-500 mt-1">
          {description.length > 255 && 'Description must be less than 256 characters.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Start Date</label>
        <Input
          type="date"
          value={startsAt.toISOString().substring(0, 10)}
          onChange={(e) => setStartsAt(new Date(e.target.value))}
        />
        <p className="text-xs text-red-500 mt-1">{startsAt < new Date() && 'Start date must be in the future.'}</p>
      </div>

      <Button onClick={onSubmit} className="w-full py-3 text-lg" disabled={createNewProject.isPending}>
        {createNewProject.isPending ? 'Creating...' : 'Create Project'}
      </Button>
    </motion.div>
  )
}

export function ProjmanProgram({ account }: { account: PublicKey }) {
  const { accountQuery, updateProject, cancelProject, updateProjectProgress } = useProjmanProgramAccount({ account })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState(new Date())
  const [progress, setProgress] = useState<number[]>([0])
  const { publicKey } = useWallet()

  useEffect(() => {
    if (!accountQuery.isLoading && accountQuery.data) {
      setTitle(accountQuery.data.title)
      setDescription(accountQuery.data.description)
      setStartsAt(new Date(accountQuery.data.startsAt.toNumber() * 1000))
    }
  }, [accountQuery.isLoading, accountQuery.data])

  const isFormValid = () =>
    title?.trim().length > 3 &&
    title?.length <= 64 &&
    description?.length <= 256 &&
    startsAt >= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  const handleUpdateClick = async () => {
    const data = accountQuery.data
    if (!data || !data.ident) return toast.warning('Wait for project to load.')
    if (!publicKey) return toast.error('First connect your wallet!')
    if (!isFormValid()) return toast.error('Check your input fields.')

    const newTitle = title.trim() !== data.title ? title : undefined
    const newDescription = description.trim() !== data.description ? description : undefined
    const newStartsAt =
      startsAt.getTime() !== data.startsAt.toNumber() * 1000
        ? new Date(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate())
        : undefined
    const newProgress = progress[0] !== data.progress ? progress[0] : undefined
    if (newTitle?.length || newDescription?.length || newStartsAt) {
      await updateProject.mutateAsync({
        ident: data.ident,
        title: newTitle,
        description: newDescription,
        startsAt: newStartsAt,
      })
      if (!newProgress) return
    }
    if (newProgress) {
      await updateProjectProgress.mutateAsync({ ident: data.ident, progress: newProgress })
      return
    }

    toast.error('No changes detected.')
  }

  if (!publicKey) {
    return (
      <div className="text-center py-6">
        <p className="text-lg text-muted">Connect your wallet to manage this project</p>
      </div>
    )
  }

  if (accountQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    )
  }

  return (
    <motion.div
      className="card border border-gray-300 p-6 rounded-xl max-w-xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{accountQuery.data?.title}</h2>
        <Button size="sm" onClick={() => accountQuery.refetch()}>
          ↻
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={64} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={256}
          className="textarea textarea-bordered w-full min-h-[6rem] rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Start Date</label>
        <Input
          type="date"
          value={startsAt.toISOString().substring(0, 10)}
          onChange={(e) => setStartsAt(new Date(e.target.value))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Progress</label>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={progress}
          onValueChange={setProgress}
          max={100}
          step={1}
        >
          <Slider.Track className="bg-gray-200 relative grow rounded-full h-[4px]">
            <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-blue-500 rounded-full shadow hover:bg-blue-600 transition"
            aria-label="Project progress"
          />
        </Slider.Root>
        <p className="text-sm text-gray-500 mt-1">Progress: {progress[0]}%</p>
      </div>

      <div className="flex justify-between flex-col sm:flex-row gap-2 mt-4">
        <Button onClick={handleUpdateClick} disabled={updateProject.isPending} className="w-full sm:w-auto">
          {updateProject.isPending ? 'Updating...' : 'Update'}
        </Button>
        <Button
          onClick={() => accountQuery.data?.ident && cancelProject.mutate(accountQuery.data.ident)}
          disabled={cancelProject.isPending}
          className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white"
        >
          {cancelProject.isPending ? 'Cancelling...' : 'Cancel'}
        </Button>
      </div>
    </motion.div>
  )
}
