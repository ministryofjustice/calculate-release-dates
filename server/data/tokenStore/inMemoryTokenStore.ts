import TokenStore from './tokenStore'

export default class InMemoryTokenStore implements TokenStore {
  map = new Map<string, { token: string; expiry: Date }>()

  public async setToken(key: string, token: string, durationSeconds: number): Promise<void> {
    this.map.set(key, { token, expiry: new Date(Date.now() + durationSeconds * 1000) })
    return Promise.resolve()
  }

  public async getToken(key: string): Promise<string | null> {
    const tokenEntry = this.map.get(key)
    if (!tokenEntry || tokenEntry.expiry.getTime() < Date.now()) {
      return Promise.resolve(null)
    }
    return Promise.resolve(tokenEntry.token)
  }
}
