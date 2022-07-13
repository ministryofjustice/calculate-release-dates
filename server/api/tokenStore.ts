import { createClient } from 'redis'

import logger from '../../logger'
import config from '../config'

const createRedisClient = () => {
  return createClient({
    socket: {
      port: config.redis.port,
      host: config.redis.host,
      tls: config.redis.tls_enabled === 'true',
    },
    password: config.redis.password,
    // prefix: 'systemToken:',
  })
}

export default class TokenStore {
  private readonly getRedisAsync: (key: string) => Promise<string>

  private readonly setRedisAsync: (key: string, value: string, mode: { EX: number }) => Promise<string>

  private readonly redisClientInternal

  get redisClient() {
    return this.redisClientInternal
  }

  constructor(redisClientImplementation = createRedisClient()) {
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
