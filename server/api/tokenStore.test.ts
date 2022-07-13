import { createClient } from 'redis'
import TokenStore from './tokenStore'

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    on: jest.fn((eventName, listener) => {
      return listener
    }),
    get: jest.fn().mockResolvedValue('token-1'),
    set: jest.fn().mockResolvedValue('hello'),
    connect: jest.fn(),
  }),
}))

describe('tokenStore', () => {
  const tokenStore: TokenStore = new TokenStore(createClient())

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Can retrieve token', async () => {
    const { redisClient } = tokenStore

    await expect(tokenStore.getToken('user-1')).resolves.toBe('token-1')

    expect(redisClient.get).toHaveBeenCalledWith('user-1')
  })

  it('Can set token', async () => {
    const { redisClient } = tokenStore
    await tokenStore.setToken('user-1', 'token-1', 10)

    expect(redisClient.set).toHaveBeenCalledWith('user-1', 'token-1', { EX: 10 })
  })
})
