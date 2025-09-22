import { Request } from 'express'
import { GenuineOverrideInputs } from '../../models/genuine-override/genuineOverrideInputs'

const genuineOverrideInputsForPrisoner = (req: Request, prisonerNumber: string): GenuineOverrideInputs => {
  const { session } = req
  if (!session.genuineOverrideInputs) {
    session.genuineOverrideInputs = {}
  }
  if (!session.genuineOverrideInputs[prisonerNumber]) {
    session.genuineOverrideInputs[prisonerNumber] = {}
  }
  return session.genuineOverrideInputs[prisonerNumber]
}

export default genuineOverrideInputsForPrisoner
