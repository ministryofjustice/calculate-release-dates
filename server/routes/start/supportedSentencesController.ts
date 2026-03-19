import { Request, Response } from 'express'
import { Controller } from '../controller'

export default class SupportedSentencesController implements Controller {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { nomsId } = req.params
    return res.render('pages/supportedSentences', { nomsId })
  }
}
