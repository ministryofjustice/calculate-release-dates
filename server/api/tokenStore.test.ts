// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import redis from 'redis-mock'
import TokenStore from './tokenStore'

const redisClient = redis.createClient()

describe('tokenStore', () => {
  let tokenStore: TokenStore

  beforeEach(() => {
    tokenStore = new TokenStore(redisClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('Can retrieve token', async () => {
    redisClient.get.mockImplementation((key: unknown, callback: (arg0: unknown, arg1: string) => unknown) =>
      callback(null, 'token-1'),
    )

    await expect(tokenStore.getToken('user-1')).resolves.toBe('token-1')

    expect(redisClient.get).toHaveBeenCalledWith('user-1', expect.any(Function))
  })

  it('Can set token', async () => {
    await tokenStore.setToken('user-1', 'token-1', 10)

    expect(redisClient.set).toHaveBeenCalledWith('user-1', 'token-1', 'EX', 10, expect.any(Function))
  })
})
