import { createClient } from 'redis'
import { promisify } from 'util'

import logger from '../../logger'
import config from '../config'

const createRedisClient = () => {
  return createClient({
    socket: {
      host: config.redis.host,
      port: config.redis.port,
      tls: config.redis.tls_enabled === 'true',
    },
    password: config.redis.password,

    // prefix: 'systemToken:',
  })
}

export default class TokenStore {
  private readonly getRedisAsync: (key: string) => Promise<string>

  private readonly setRedisAsync: (key: string, value: string, mode: string, durationSeconds: number) => Promise<void>

  constructor(redisClient = createRedisClient()) {
    redisClient.on('error', error => {
      logger.error(error, `Redis error`)
    })

    this.getRedisAsync = promisify(redisClient.get).bind(redisClient)
    this.setRedisAsync = promisify(redisClient.set).bind(redisClient)
  }

  public async setToken(key: string, token: string, durationSeconds: number): Promise<void> {
    await this.setRedisAsync(key, token, 'EX', durationSeconds)
  }

  public async getToken(key: string): Promise<string> {
    return this.getRedisAsync(key)
  }
}
