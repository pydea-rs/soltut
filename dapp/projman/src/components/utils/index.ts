import { v4 as uuidv4 } from 'uuid'

export const getNextIdent = () => uuidv4().replaceAll('-', '')
