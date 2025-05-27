
export interface CreateNewProjectArgs {
  title: string
  description: string
  startsAt: Date
}

export interface ProjmanProject extends CreateNewProjectArgs {
  ident: string
  progress: number
}

export interface UpdateProjectArgs {
  ident: string
  title?: string
  description?: string
  startsAt?: Date
}

export interface UpdateProjectProgressArgs {
  ident: string
  progress: number
}

