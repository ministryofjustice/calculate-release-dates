import createError from 'http-errors'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import PrisonerService from './prisonerService'
import CheckInformationService from './checkInformationService'
import { user } from '../routes/testutils/appSetup'
import {
  AnalysedSentenceAndOffence,
  CalculationUserInputs,
  ErsedEligibility,
  ValidationMessage,
} from '../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'
import {
  AnalysedPrisonApiBookingAndSentenceAdjustments,
  PrisonAPIAssignedLivingUnit,
  PrisonApiPrisoner,
  PrisonApiSentenceDetail,
} from '../@types/prisonApi/prisonClientTypes'
import { ErrorMessageType } from '../types/ErrorMessages'

jest.mock('./calculateReleaseDatesService')
jest.mock('./prisonerService')

describe('checkInformationService', () => {
  const stubbedPrisonerData = {
    offenderNo: 'A1234AA',
    firstName: 'Anon',
    lastName: 'Nobody',
    latestLocationId: 'LEI',
    locationDescription: 'Inside - Leeds HMP',
    dateOfBirth: '2000-06-24',
    age: 21,
    activeFlag: true,
    legalStatus: 'REMAND',
    category: 'Cat C',
    imprisonmentStatus: 'LIFE',
    imprisonmentStatusDescription: 'Serving Life Imprisonment',
    religion: 'Christian',
    agencyId: 'LEI',
    sentenceDetail: {
      sentenceStartDate: '12/12/2019',
      additionalDaysAwarded: 4,
      tariffDate: '12/12/2030',
      releaseDate: '12/12/2028',
      conditionalReleaseDate: '12/12/2025',
      confirmedReleaseDate: '12/12/2026',
      sentenceExpiryDate: '16/12/2030',
      licenceExpiryDate: '16/12/2030',
    } as PrisonApiSentenceDetail,
    assignedLivingUnit: {
      agencyName: 'Foo Prison (HMP)',
      description: 'D-2-003',
    } as PrisonAPIAssignedLivingUnit,
  } as PrisonApiPrisoner
  const stubbedNoAdjustments = {
    sentenceAdjustments: [],
    bookingAdjustments: [],
  } as AnalysedPrisonApiBookingAndSentenceAdjustments

  const ftrSentence = {
    sentenceSequence: 3,
    lineSequence: 3,
    caseSequence: 3,
    courtDescription: 'Preston Crown Court',
    sentenceStatus: 'A',
    sentenceCategory: '2020',
    sentenceCalculationType: '14FTR_ORA',
    sentenceTypeDescription: 'ORA 14 Day Fixed Term Recall',
    sentenceDate: '2021-09-03',
    terms: [
      {
        years: 0,
        months: 2,
        weeks: 0,
        days: 0,
      },
    ],
    offence: {
      offenderChargeId: 1,
      offenceStartDate: '2020-01-01',
      offenceCode: 'RL05016',
      offenceDescription: 'Access / exit by unofficial route - railway bye-law',
    },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: false,
    hasAnSDSEarlyReleaseExclusion: 'NO',
    revocationDates: ['2022-02-14', '2022-04-02'],
  } as AnalysedSentenceAndOffence

  const calculateReleaseDatesService = new CalculateReleaseDatesService(
    null,
  ) as jest.Mocked<CalculateReleaseDatesService>
  const prisonerService = new PrisonerService(null) as jest.Mocked<PrisonerService>

  const checkInformationService = new CheckInformationService(calculateReleaseDatesService, prisonerService)

  const nomsId = 'A1234BC'
  const { token, userRoles, caseloads } = user
  const userInputs = {} as CalculationUserInputs

  beforeEach(() => {
    prisonerService.getPrisonerDetail.mockResolvedValue(stubbedPrisonerData)
    calculateReleaseDatesService.getActiveAnalysedSentencesAndOffences.mockResolvedValue([])
    calculateReleaseDatesService.getErsedEligibility.mockResolvedValue({ isValid: true } as ErsedEligibility)
    calculateReleaseDatesService.getAdjustmentsForPrisoner.mockResolvedValue([])
    calculateReleaseDatesService.getBookingAndSentenceAdjustments.mockResolvedValue(stubbedNoAdjustments)
  })

  it('should build model with no validation errors present', async () => {
    calculateReleaseDatesService.validateBackend.mockResolvedValue([])

    const model = await checkInformationService.checkInformation(nomsId, userInputs, caseloads, token, userRoles)

    expect(model.isUnsupported).toBe(false)
    expect(model.validationErrors).toStrictEqual({ messages: [] })
  })

  it('should build model with unsupported validation errors using manual entry validation errors only', async () => {
    calculateReleaseDatesService.validateBackend.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
        message: 'Sentence type is not supported',
        calculationUnsupported: true,
      } as ValidationMessage,
    ])
    calculateReleaseDatesService.validateBookingForManualEntry.mockResolvedValue({
      messageType: ErrorMessageType.VALIDATION,
      messages: [{ text: 'Sentence type is not supported' }],
    })

    const model = await checkInformationService.checkInformation(nomsId, userInputs, caseloads, token, userRoles)

    expect(model.isUnsupported).toBe(true)
    expect(model.validationErrors).toStrictEqual({
      messageType: ErrorMessageType.VALIDATION,
      messages: [{ text: 'Sentence type is not supported' }],
    })
  })

  it('should build model with unsupported validation errors and no manual entry validation errors', async () => {
    calculateReleaseDatesService.validateBackend.mockResolvedValue([
      {
        type: 'UNSUPPORTED_SENTENCE',
        message: 'Sentence type is not supported',
        calculationUnsupported: true,
      } as ValidationMessage,
    ])
    calculateReleaseDatesService.validateBookingForManualEntry.mockResolvedValue({
      messages: [],
    })

    const model = await checkInformationService.checkInformation(nomsId, userInputs, caseloads, token, userRoles)

    expect(model.isUnsupported).toBe(true)
    expect(model.validationErrors).toStrictEqual({ messages: [] })
  })

  it('should build model with general validation errors', async () => {
    calculateReleaseDatesService.validateBackend.mockResolvedValue([
      {
        type: 'VALIDATION',
        message: 'Missing dates',
        calculationUnsupported: false,
      } as ValidationMessage,
    ])

    const model = await checkInformationService.checkInformation(nomsId, userInputs, caseloads, token, userRoles)

    expect(model.isUnsupported).toBe(false)
    expect(model.validationErrors).toStrictEqual({
      messageType: ErrorMessageType.VALIDATION,
      messages: [{ text: 'Missing dates' }],
    })
  })

  it('should not show multiple consecutive sentences to a single sentence errors', async () => {
    calculateReleaseDatesService.validateBackend.mockResolvedValue([
      {
        type: 'CONCURRENT_CONSECUTIVE',
        message: '0 years 0 months 5 weeks 0 days',
        calculationUnsupported: false,
      } as ValidationMessage,
      {
        type: 'VALIDATION',
        message: 'Missing dates',
        calculationUnsupported: false,
      } as ValidationMessage,
    ])

    const model = await checkInformationService.checkInformation(nomsId, userInputs, caseloads, token, userRoles)

    expect(model.validationErrors).toStrictEqual({
      messageType: ErrorMessageType.VALIDATION,
      messages: [{ text: 'Missing dates' }],
    })
  })

  it('should load RTC date when there are FTR sentences', async () => {
    calculateReleaseDatesService.validateBackend.mockResolvedValue([
      {
        type: 'VALIDATION',
        message: 'Missing dates',
        calculationUnsupported: false,
      } as ValidationMessage,
    ])
    calculateReleaseDatesService.getActiveAnalysedSentencesAndOffences.mockResolvedValue([ftrSentence])
    prisonerService.getReturnToCustodyDate.mockResolvedValue({ bookingId: 99, returnToCustodyDate: '2025-01-03' })

    const model = await checkInformationService.checkInformation(nomsId, userInputs, caseloads, token, userRoles)

    expect(model.returnToCustodyDate).toBe('2025-01-03')
    expect(prisonerService.getReturnToCustodyDate).toHaveBeenCalled()
  })

  it('should handle RTC date being missing when there are FTR sentences', async () => {
    calculateReleaseDatesService.validateBackend.mockResolvedValue([
      {
        type: 'VALIDATION',
        message: 'Missing dates',
        calculationUnsupported: false,
      } as ValidationMessage,
    ])
    calculateReleaseDatesService.getActiveAnalysedSentencesAndOffences.mockResolvedValue([ftrSentence])
    prisonerService.getReturnToCustodyDate.mockRejectedValue(createError(404, 'Not found'))

    const model = await checkInformationService.checkInformation(nomsId, userInputs, caseloads, token, userRoles)

    expect(model.returnToCustodyDate).toBeUndefined()
    expect(prisonerService.getReturnToCustodyDate).toHaveBeenCalled()
  })
})
