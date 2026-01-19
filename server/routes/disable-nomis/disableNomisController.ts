import { Request, Response } from 'express'
import { Controller } from '../controller'
import CalculateReleaseDatesService from '../../services/calculateReleaseDatesService'
import { FullPageError } from '../../types/FullPageError'

export default class DisableNomisController implements Controller {
  constructor(private readonly calculateReleaseDatesService: CalculateReleaseDatesService) {}

  GET = async (_: Request, res: Response): Promise<void> => {
    const { token, isDigitalSupportUser } = res.locals.user
    if (!isDigitalSupportUser) {
      throw FullPageError.notFoundError()
    }
    const disabledAgencies = await this.calculateReleaseDatesService.getDisabledNomisAgencies(token)
    return res.render('pages/disableNomis', {
      disabledAgencies,
      updated: false,
    })
  }

  POST = async (_: Request, res: Response): Promise<void> => {
    const { token, isDigitalSupportUser } = res.locals.user
    if (!isDigitalSupportUser) {
      throw FullPageError.notFoundError()
    }
    const updateResult = await this.calculateReleaseDatesService.updateDisabledNomisAgencies(token)
    return res.render('pages/disableNomis', {
      disabledAgencies: updateResult.current,
      switchedOn: updateResult.agenciesSwitchedOn,
      switchedOff: updateResult.agenciesSwitchedOff,
      updated: true,
    })
  }
}
