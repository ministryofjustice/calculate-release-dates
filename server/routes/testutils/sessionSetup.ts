import { Request } from 'express'

export default class SessionSetup {
  public sessionDoctor: (req: Request) => void = () => {}
}
