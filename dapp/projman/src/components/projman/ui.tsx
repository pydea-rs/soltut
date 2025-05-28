'use client'

import { useProjmanProgram } from './data-access'
import { Button } from '@/components/ui/button'

export function ProjmanCreate() {
  const { createNewProject } = useProjmanProgram()

  return (
    <Button
      onClick={() =>
        createNewProject.mutateAsync({ title: 'test', description: 'test', startsAt: new Date(2026, 1, 1) })
      }
      disabled={createNewProject.isPending}
    >
      Run program{createNewProject.isPending && '...'}
    </Button>
  )
}

export function ProjmanProgram() {
  const {  getProgramAccount } = useProjmanProgram()

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
