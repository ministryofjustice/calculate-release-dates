import request from 'supertest'
import { Express } from 'express'
import { appWithAllRoutes } from './testutils/appSetup'
import BulkLoadService from '../services/bulkLoadService'
import OneThousandCalculationsService from '../services/oneThousandCalculationsService'
import OneThousandCalculationsRow from '../models/OneThousandCalculationsRow'

let app: Express

jest.mock('../services/bulkLoadService')
jest.mock('../services/OneThousandCalculationsService')
const bulkLoadService = new BulkLoadService() as jest.Mocked<BulkLoadService>
const oneThousandCalculationsService = new OneThousandCalculationsService(
  null,
  null
) as jest.Mocked<OneThousandCalculationsService>

beforeEach(() => {
  app = appWithAllRoutes({ bulkLoadService, oneThousandCalculationsService })
})

afterEach(() => {
  jest.resetAllMocks()
})

const row = {
  NOMS_ID: 'ABCDEFG',
  DOB: '1978-04-30',
  REQUEST_ID: 3819,
  CALCULATED_DATES:
    '{"SED":"2022-01-01","LED":"2022-01-06","ARD":"2022-01-02","CRD":"2022-01-03","HDCED":"2022-01-07","ESED":"2022-01-20","DPRRD":"2022-01-18","ETD":"2022-01-13","LTD":"2022-01-15","MTD":"2022-01-14","NPD":"2022-01-04","PED":"2022-01-08","PRRD":"2022-01-05","TUSED":"2022-01-16","ERSED":"2022-11-11"}',
  CRD: '2022-01-03',
  NOMIS_CRD: '2022-01-03',
  NOMIS_CRD_OVERRIDE: '2022-01-23',
  CRD_MATCH: 'N',
  LED: '2022-01-06',
  NOMIS_LED: '2022-01-06',
  NOMIS_LED_CALCULATED: '2022-01-30',
  NOMIS_LED_OVERRIDE: '2022-01-31',
  LED_MATCH: 'Y',
  SED: '2022-01-01',
  NOMIS_SED: '2022-01-01',
  NOMIS_SED_CALCULATED: '2022-01-28',
  NOMIS_SED_OVERRIDE: '2022-01-29',
  SED_MATCH: 'Y',
  NOMIS_NPD: '2022-01-04',
  NOMIS_NPD_OVERRIDE: '2022-01-24',
  NPD_MATCH: 'Y',
  NOMIS_ARD: '2022-01-02',
  NOMIS_ARD_OVERRIDE: '2022-01-22',
  ARD_MATCH: 'N',
  NOMIS_TUSED: '2022-01-16',
  NOMIS_TUSED_CALCULATED: '2022-02-09',
  NOMIS_TUSED_OVERRIDE: '2022-02-10',
  TUSED_MATCH: 'Y',
  NOMIS_PED: '2022-01-08',
  NOMIS_PED_CALCULATED: '2022-02-01',
  NOMIS_PED_OVERRIDE: '2022-02-02',
  PED_MATCH: 'Y',
  HDCED: '2022-01-07',
  NOMIS_HDCED: '2022-01-07',
  NOMIS_HDCED_CALCULATED: '2022-02-07',
  NOMIS_HDCED_OVERRIDE: '2022-02-08',
  HDCED_MATCH: 'Y',
  NOMIS_ETD: '2022-01-13',
  NOMIS_MTD: '2022-01-14',
  NOMIS_LTD: '2022-01-15',
  NOMIS_DPRRD: '2022-01-18',
  NOMIS_DPRRD_OVERRIDE: '2022-01-26',
  NOMIS_PRRD: '2022-01-05',
  NOMIS_PRRD_OVERRIDE: '2022-01-25',
  PRRD_MATCH: 'N',
  ESED: '2022-01-20',
  NOMIS_ESED: '2022-01-20',
  ERSED: '2022-11-11',
  NOMIS_ERSED: '2022-11-11',
  ERSED_MATCH: 'Y',
  NOMIS_ROTL: '2022-11-12',
  SENTENCE_LENGTH: '04/05/25',
  NOMIS_ESL: '04/05/26',
  NOMIS_JSL: '04/05/25',
  REASON_CODE: 'NEW',
  COMMENT: 'This is a NOMIS calculation',
  IS_ESL_SAME: 'N',
  IS_JSL_SAME: 'Y',
  IS_PED_ADJUSTED_TO_CRD: 'Y',
  IS_HDCED_14_DAY_RULE: 'Y',
  HAS_SDS_PLUS_PCSC: 'Y',
  SEX_OFFENDER: 'Y',
  LOCATION: 'Kirkham (HMP)',
  SENTENCES:
    '[{"bookingId":1202003,"sentenceSequence":1,"lineSequence":1,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932803,"offenceStartDate":"2012-02-10","offenceCode":"TH68010A","offenceDescription":"Attempt theft from shop","indicators":["D","50"]}]},{"bookingId":1202003,"sentenceSequence":2,"consecutiveToSequence":1,"lineSequence":2,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932805,"offenceStartDate":"2012-02-10","offenceCode":"AW06049","offenceDescription":"Administer a poisonous / injurious drug / substance to a protected animal","indicators":["113","99"]}]},{"bookingId":1202003,"sentenceSequence":3,"consecutiveToSequence":2,"lineSequence":3,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932804,"offenceStartDate":"2022-02-10","offenceCode":"SX03200","offenceDescription":"Adult abuse position of trust - cause child 13 - 17 watch a sexual act cared for in s.21 premises - SOA 2003","indicators":["ERS","S","24","S15/CJIB","PIMMS3","S1","M","V","H","PIMMS1","SOR"]}]},{"bookingId":1202003,"sentenceSequence":4,"consecutiveToSequence":3,"lineSequence":4,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA Sentencing Code Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932806,"offenceStartDate":"2022-02-10","offenceCode":"RC86374","offenceDescription":"Additional braking device insecure","indicators":["101"]}]},{"bookingId":1202076,"sentenceSequence":5,"lineSequence":1,"caseSequence":1,"courtDescription":"Bolton Youth Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"FTR","sentenceTypeDescription":"Fixed Term Recall Pre ORA Sentence","sentenceDate":"2020-01-03","terms":[{"years":0,"months":0,"weeks":0,"days":876,"code":"IMP"}],"offences":[{"offenderChargeId":3932857,"offenceStartDate":"2019-09-19","offenceCode":"RT88513","offenceDescription":"Ride in a rear passenger seat in a motor vehicle on a road and fail to wear seat belt","indicators":[]}]},{"bookingId":1202076,"sentenceSequence":6,"lineSequence":2,"caseSequence":1,"courtDescription":"Bolton Youth Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"Sentencing Code Standard Determinate Sentence","sentenceDate":"2022-02-03","terms":[{"years":0,"months":0,"weeks":0,"days":876,"code":"IMP"}],"offences":[{"offenderChargeId":3932858,"offenceStartDate":"2021-11-29","offenceCode":"SX03224A","offenceDescription":"Adult attempt to engage in sexual communication with a child","indicators":["99"]}]},{"bookingId":1202076,"sentenceSequence":6,"lineSequence":2,"caseSequence":1,"courtDescription":"Bolton Youth Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"A/FINE","sentenceTypeDescription":"Imprisonment in Default of Fine","sentenceDate":"2022-02-03","terms":[{"years":0,"months":0,"weeks":0,"days":876,"code":"IMP"}],"offences":[{"offenderChargeId":3550166,"offenceStartDate":"2015-07-24","offenceCode":"ZZ01008","offenceDescription":"CIVIL : Other Non-Payment","indicators":["700"]}]}]',
  ADJUSTMENTS:
    '{"sentenceAdjustments":[{"sentenceSequence":1,"type":"RECALL_SENTENCE_REMAND","numberOfDays":3,"fromDate":null,"toDate":null,"active":true},{"sentenceSequence":1,"type":"REMAND","numberOfDays":1,"fromDate":"2022-01-06","toDate":"2022-01-06","active":true}],"bookingAdjustments":[]}',
  RETURN_TO_CUSTODY: '{"bookingId":1202076,"returnToCustodyDate":"2022-01-07"}',
  FINE_PAYMENTS: '[{"bookingId":1202076,"paymentDate":"2022-01-01","paymentAmount":100.99}]',
  CONSECUTIVE_SENTENCES:
    '[{"bookingId":1202003,"sentenceSequence":1,"lineSequence":1,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932803,"offenceStartDate":"2012-02-10","offenceCode":"TH68010A","offenceDescription":"Attempt theft from shop","indicators":["D","50"]}]},{"bookingId":1202003,"sentenceSequence":2,"consecutiveToSequence":1,"lineSequence":2,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP","sentenceTypeDescription":"CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":3,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932805,"offenceStartDate":"2012-02-10","offenceCode":"AW06049","offenceDescription":"Administer a poisonous / injurious drug / substance to a protected animal","indicators":["113","99"]}]},{"bookingId":1202003,"sentenceSequence":3,"consecutiveToSequence":2,"lineSequence":3,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2003","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA CJA03 Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932804,"offenceStartDate":"2022-02-10","offenceCode":"SX03200","offenceDescription":"Adult abuse position of trust - cause child 13 - 17 watch a sexual act cared for in s.21 premises - SOA 2003","indicators":["ERS","S","24","S15/CJIB","PIMMS3","S1","M","V","H","PIMMS1","SOR"]}]},{"bookingId":1202003,"sentenceSequence":4,"consecutiveToSequence":3,"lineSequence":4,"caseSequence":1,"courtDescription":"Abergavenny Magistrates Court","sentenceStatus":"A","sentenceCategory":"2020","sentenceCalculationType":"ADIMP_ORA","sentenceTypeDescription":"ORA Sentencing Code Standard Determinate Sentence","sentenceDate":"2022-03-10","terms":[{"years":0,"months":2,"weeks":0,"days":0,"code":"IMP"}],"offences":[{"offenderChargeId":3932806,"offenceStartDate":"2022-02-10","offenceCode":"RC86374","offenceDescription":"Additional braking device insecure","indicators":["101"]}]}]',
  DPRRD: '2022-01-18',
  DPRRD_MATCH: 'N',
  ETD: '2022-01-13',
  LTD: '2022-01-15',
  MTD: '2022-01-14',
  NPD: '2022-01-04',
  PED: '2022-01-08',
  PRRD: '2022-01-05',
  TUSED: '2022-01-16',
  ARD: '2022-01-02',
  NOMIS_ETD_OVERRIDE: '',
  NOMIS_LTD_OVERRIDE: '',
  NOMIS_MTD_OVERRIDE: '',
  LTD_MATCH: 'Y',
  ETD_MATCH: 'Y',
  MTD_MATCH: 'Y',
  NOMIS_ETD_CALCULATED: '2022-01-13',
  NOMIS_LTD_CALCULATED: '2022-01-15',
  NOMIS_MTD_CALCULATED: '2022-01-14',
  ERROR_JSON: undefined,
  ERROR_TEXT: undefined,
  ALL_DATES_MATCH: 'N',
} as OneThousandCalculationsRow

describe('Compare routes tests', () => {
  it('GET /compare should return the Bulk Comparison index page', () => {
    return request(app)
      .get('/compare')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Perform bulk comparison of variations between offenders release dates')
      })
  })

  it('GET /compare/manual should return the Manual Comparison input page', () => {
    return request(app)
      .get('/compare/manual')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manual Bulk Comparison')
        expect(res.text).toContain('textarea')
      })
  })

  it('POST /compare/manual should return the Manual Comparison input page', () => {
    oneThousandCalculationsService.runCalculations.mockResolvedValue([row])

    return request(app)
      .post('/compare/manual')
      .send({ prisonerIds: 'ABC123D\r\n' })
      .expect(200)
      .expect('Content-Type', /text\/csv/)
      .expect('Content-Disposition', /attachment; filename=/)
      .expect(res => {
        expect(res.text).toContain('Attempt theft from shop')
      })
  })
})
