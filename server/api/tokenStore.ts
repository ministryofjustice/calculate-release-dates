import logger from '../../logger'
import { createRedisClient } from '../data/redisClient'

const getRedisClient = () => {
  const client = createRedisClient({ legacyMode: true })
  client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))
  return client
}

export default class TokenStore {
  private readonly getRedisAsync: (key: string) => Promise<string>

  private readonly setRedisAsync: (key: string, value: string, mode: { EX: number }) => Promise<string>

  private readonly redisClientInternal

  get redisClient() {
    return this.redisClientInternal
  }

  constructor(redisClientImplementation = getRedisClient()) {
    redisClientImplementation.on('error', (error: never) => {
      logger.error(error, `Redis error`)
    })

    this.redisClientInternal = redisClientImplementation
    this.getRedisAsync = this.redisClientInternal.get
    this.setRedisAsync = this.redisClientInternal.set
  }

  public async setToken(key: string, token: string, durationSeconds: number): Promise<void> {
    await this.setRedisAsync(key, token, {
      EX: durationSeconds,
    })
  }

  public async getToken(key: string): Promise<string> {
    return this.getRedisAsync(key)
  }
}
