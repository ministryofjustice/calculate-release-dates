import jwt from 'jsonwebtoken'

export default function createUserToken(authorities: string[]) {
  const payload = {
    user_name: 'user1',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    authorities,
    jti: 'a610a10-cca6-41db-985f-e87efb303aaf',
    client_id: 'clientid',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

export const testDateTypeDefinitions = [
  { type: 'CRD', description: 'Conditional release date' },
  { type: 'LED', description: 'Licence expiry date' },
  { type: 'SED', description: 'Sentence expiry date' },
  { type: 'NPD', description: 'Non-parole date' },
  { type: 'ARD', description: 'Automatic release date' },
  { type: 'TUSED', description: 'Top up supervision expiry date' },
  { type: 'PED', description: 'Parole eligibility date' },
  { type: 'SLED', description: 'Sentence and licence expiry date' },
  { type: 'HDCED', description: 'Home detention curfew eligibility date' },
  { type: 'NCRD', description: 'Notional conditional release date' },
  { type: 'ETD', description: 'Early transfer date' },
  { type: 'MTD', description: 'Mid transfer date' },
  { type: 'LTD', description: 'Late transfer date' },
  { type: 'DPRRD', description: 'Detention and training order post recall release date' },
  { type: 'PRRD', description: 'Post recall release date' },
  { type: 'ESED', description: 'Effective sentence end date' },
  { type: 'ERSED', description: 'Early removal scheme eligibility date' },
  { type: 'TERSED', description: 'Tariff-expired removal scheme eligibility date' },
  { type: 'APD', description: 'Approved parole date' },
  { type: 'HDCAD', description: 'Home detention curfew approved date' },
  { type: 'None', description: 'None of the above dates apply' },
  { type: 'Tariff', description: 'known as the Tariff expiry date' },
  { type: 'ROTL', description: 'Release on temporary licence' },
]

export const testDateTypeToDescriptions = {
  CRD: 'Conditional release date',
  LED: 'Licence expiry date',
  SED: 'Sentence expiry date',
  NPD: 'Non-parole date',
  ARD: 'Automatic release date',
  TUSED: 'Top up supervision expiry date',
  PED: 'Parole eligibility date',
  SLED: 'Sentence and licence expiry date',
  HDCED: 'Home detention curfew eligibility date',
  NCRD: 'Notional conditional release date',
  ETD: 'Early transfer date',
  MTD: 'Mid transfer date',
  LTD: 'Late transfer date',
  DPRRD: 'Detention and training order post recall release date',
  PRRD: 'Post recall release date',
  ESED: 'Effective sentence end date',
  ERSED: 'Early removal scheme eligibility date',
  TERSED: 'Tariff-expired removal scheme eligibility date',
  APD: 'Approved parole date',
  HDCAD: 'Home detention curfew approved date',
  None: 'None of the above dates apply',
  Tariff: 'known as the Tariff expiry date',
  ROTL: 'Release on temporary licence',
}
