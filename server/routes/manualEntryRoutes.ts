import { RequestHandler } from 'express'
import CalculateReleaseDatesService from '../services/calculateReleaseDatesService'
import PrisonerService from '../services/prisonerService'
import ManualCalculationService from '../services/manualCalculationService'
import { ManualEntrySelectedDate } from '../models/ManualEntrySelectedDate'

const determinateConfig = {
  name: 'dateSelect',
  fieldset: {
    legend: {
      text: 'Select the dates you need to enter',
      isPageHeading: true,
      classes: 'govuk-fieldset__legend--xl',
    },
  },
  hint: {
    text: 'Select all that apply to the manual calculation.',
  },
  items: [
    {
      value: 'SED',
      text: 'SED (Sentence Expiry Date)',
    },
    {
      value: 'LED',
      text: 'LED (Licence Expiry Date)',
    },
    {
      value: 'CRD',
      text: 'CRD (Conditional Release Date)',
    },
    {
      value: 'HDCED',
      text: 'HDCED (Home Detention Curfew Release Date)',
    },
    {
      value: 'TUSED',
      text: 'TUSED (Top Up Supervision Expiry Date)',
    },
    {
      value: 'PRRD',
      text: 'PRRD (Post Recall Release Date)',
    },
    {
      value: 'PED',
      text: 'PED (Parole Eligibility Date)',
    },
    {
      value: 'ROTL',
      text: 'ROTL (Release on Temporary Licence)',
    },
    {
      value: 'ERSED',
      text: 'ERSED (Early Removal Scheme Eligibility Date)',
    },
    {
      value: 'ARD',
      text: 'ARD (Automatic Release Date)',
    },
    {
      value: 'HDCAD',
      text: 'HDCAD (Home Detention Curfew Approved Date)',
    },
    {
      value: 'MTD',
      text: 'MTD (Mid Transfer Date)',
    },
    {
      value: 'ETD',
      text: 'ETD (Early Transfer Date)',
    },
    {
      value: 'LTD',
      text: 'LTD (Late Transfer Date)',
    },
    {
      value: 'APD',
      text: 'APD (Approved Parole Date)',
    },
    {
      value: 'NPD',
      text: 'NPD (Non-Parole Date)',
    },
    {
      value: 'DPRRD',
      text: 'DPRRD (Detention and Training Order Post Recall Release Date)',
    },
  ],
}
const indeterminateConfig = {
  name: 'dateSelect',
  fieldset: {
    legend: {
      text: 'Select the dates you need to enter',
      isPageHeading: true,
      classes: 'govuk-fieldset__legend--xl',
    },
  },
  hint: {
    text: 'Select all that apply to the manual calculation.',
  },
  items: [
    {
      value: 'tariff',
      text: 'Tariff',
    },
    {
      value: 'TERSED',
      text: 'TERSED (Tariff-Expired Removal Scheme Eligibility Date)',
    },
    {
      value: 'ROTL',
      text: 'ROTL (Release on Temporary Licence)',
    },
    {
      value: 'APD',
      text: 'APD (Approved Parole Date)',
    },
    {
      divider: 'or',
    },
    {
      value: 'none',
      text: 'None',
      checked: true,
      behaviour: 'exclusive',
    },
  ],
}
const errorMessage = {
  errorMessage: {
    text: 'Select at least one release date.',
  },
}
export default class ManualEntryRoutes {
  constructor(
    private readonly calculateReleaseDatesService: CalculateReleaseDatesService,
    private readonly prisonerService: PrisonerService,
    private readonly manualCalculationService: ManualCalculationService
  ) {}

  public landingPage: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    return res.render('pages/manualEntry/manualEntry', { prisonerDetail })
  }

  public submitSelectedDates: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    // TODO add this as middleware
    const unsupportedSentenceOrCalculationMessages =
      await this.calculateReleaseDatesService.getUnsupportedSentenceOrCalculationMessages(nomsId, token)
    if (unsupportedSentenceOrCalculationMessages.length === 0) {
      return res.redirect(`/calculation/${nomsId}/check-information`)
    }
    const insufficientDatesSelected = req.body.dateSelect === undefined || req.body.dateSelect.length === 0
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const hasIndeterminateSentences = await this.manualCalculationService.hasIndeterminateSentences(
      prisonerDetail.bookingId,
      token
    )
    const config = hasIndeterminateSentences ? indeterminateConfig : determinateConfig
    if (insufficientDatesSelected) {
      const mergedConfig = { ...config, ...errorMessage }
      return res.render('pages/manualEntry/dateTypeSelection', {
        prisonerDetail,
        insufficientDatesSelected,
        mergedConfig,
      })
    }
    const selectedDateTypes: string[] = Array.isArray(req.body.dateSelect) ? req.body.dateSelect : [req.body.dateSelect]
    req.session.selectedManualEntryDates = selectedDateTypes.map((date: string) => {
      return {
        dateType: date,
        date: undefined,
      } as ManualEntrySelectedDate
    })

    return res.redirect(`/calculation/${nomsId}/manual-entry/enter-date`)
  }

  public dateSelection: RequestHandler = async (req, res): Promise<void> => {
    const { username, caseloads, token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetail = await this.prisonerService.getPrisonerDetail(username, nomsId, caseloads, token)
    const hasIndeterminateSentences = await this.manualCalculationService.hasIndeterminateSentences(
      prisonerDetail.bookingId,
      token
    )
    const config = hasIndeterminateSentences ? indeterminateConfig : determinateConfig
    return res.render('pages/manualEntry/dateTypeSelection', { prisonerDetail, config })
  }

  public enterDate: RequestHandler = async (req, res): Promise<void> => {
    return res.render('pages/manualEntry/dateEntry', {})
  }
}
