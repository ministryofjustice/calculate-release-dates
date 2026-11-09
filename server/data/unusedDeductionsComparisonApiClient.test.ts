import nock from 'nock'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import CalculateReleaseDatesApiClient from './calculateReleaseDatesApiClient'

const mockAuthenticationClient: AuthenticationClient = {
  getToken: jest.fn().mockResolvedValue('test-system-token'),
} as unknown as jest.Mocked<AuthenticationClient>
const client = new CalculateReleaseDatesApiClient(mockAuthenticationClient)

describe('Unused deductions comparison API client', () => {
  let fakeApi: nock.Scope

  beforeEach(() => {
    config.apis.calculateReleaseDates.url = 'http://localhost:8100'
    fakeApi = nock(config.apis.calculateReleaseDates.url)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('creates a run for a prison', async () => {
    const created = { comparisonShortReference: 'abc12345' }
    fakeApi.post('/unused-deductions/comparison', { prison: 'MDI' }).reply(200, created)

    const result = await client.createUnusedDeductionsComparison({ prison: 'MDI' }, 'user1')

    expect(result).toEqual(created)
    expect(nock.isDone()).toBe(true)
  })

  it('creates a run for a manual list of prisoners', async () => {
    fakeApi.post('/unused-deductions/comparison', { prisonerIds: ['A1234BC'] }).reply(200, {})

    await client.createUnusedDeductionsComparison({ prisonerIds: ['A1234BC'] }, 'user1')

    expect(nock.isDone()).toBe(true)
  })

  it('lists comparisons a page at a time', async () => {
    const page = { content: [{ comparisonShortReference: 'abc12345' }], page: { number: 1, size: 10 } }
    fakeApi.get('/unused-deductions/comparison').query({ page: 1, size: 10 }).reply(200, page)

    const result = await client.getUnusedDeductionsComparisons(1, 10, 'user1')

    expect(result).toEqual(page)
    expect(nock.isDone()).toBe(true)
  })

  it('gets a comparison', async () => {
    fakeApi.get('/unused-deductions/comparison/abc12345').reply(200, { people: [] })

    const result = await client.getUnusedDeductionsComparison('abc12345', {}, 'user1')

    expect(result).toEqual({ people: [] })
  })

  it('passes the paging and filter options and omits the blank ones', async () => {
    fakeApi
      .get('/unused-deductions/comparison/abc12345')
      .query({ outcome: 'MISMATCH', prisonerId: 'A12', page: 2, size: 25 })
      .reply(200, { people: [] })

    await client.getUnusedDeductionsComparison(
      'abc12345',
      { outcome: 'MISMATCH', prisonerId: 'A12', page: 2, size: 25 },
      'user1',
    )
    expect(nock.isDone()).toBe(true)
  })

  it('does not send blank filters', async () => {
    fakeApi.get('/unused-deductions/comparison/abc12345').query({ page: 0, size: 50 }).reply(200, { people: [] })

    await client.getUnusedDeductionsComparison('abc12345', { outcome: '', prisonerId: '', page: 0, size: 50 }, 'user1')
    expect(nock.isDone()).toBe(true)
  })

  it('gets the detail of a person in a comparison', async () => {
    fakeApi.get('/unused-deductions/comparison/abc12345/person/def67890').reply(200, { adjustments: [] })

    const result = await client.getUnusedDeductionsComparisonPerson('abc12345', 'def67890', 'user1')

    expect(result).toEqual({ adjustments: [] })
  })
})
