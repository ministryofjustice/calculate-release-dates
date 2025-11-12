import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import dateFilter from 'nunjucks-date-filter'
import AdjustmentTablesModel, { adjustmentsTablesFromAdjustmentDTOs } from './AdjustmentTablesModel'
import {
  AdjustmentStatus,
  AnalysedAdjustment,
  AnalysedSentenceAndOffence,
} from '../../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

const njkEnv = nunjucks.configure([
  __dirname,
  'node_modules/govuk-frontend/dist/',
  'node_modules/govuk-frontend/dist/components/',
])
njkEnv.addFilter('date', dateFilter)
const anAdjustment = {
  analysisResult: 'SAME',
  bookingId: 123458,
  person: 'A3752DZ',
  id: 'id',
  days: 1,
  remand: null,
  additionalDaysAwarded: null,
  unlawfullyAtLarge: null,
  lawfullyAtLarge: null,
  specialRemission: null,
  taggedBail: null,
  timeSpentInCustodyAbroad: null,
  timeSpentAsAnAppealApplicant: null,
  sentenceSequence: 3,
  adjustmentArithmeticType: 'DEDUCTION',
  prisonName: 'Kirkham (HMP)',
  prisonId: 'KMI',
  lastUpdatedBy: 'CRD_TEST_USER',
  status: 'ACTIVE',
  lastUpdatedDate: '2024-03-27T12:24:50.36377',
  createdDate: '2024-03-27T12:24:50.36377',
  effectiveDays: 1,
  source: 'DPS',
}

const aDeduction = {
  ...anAdjustment,
  adjustmentArithmeticType: 'DEDUCTION',
}

const anAddition = {
  ...anAdjustment,
  adjustmentArithmeticType: 'ADDITION',
}

const aRemand = {
  ...aDeduction,
  adjustmentType: 'REMAND',
  remand: {
    chargeId: [789456],
  },
  toDate: '2023-03-03',
  fromDate: '2023-01-01',
  adjustmentTypeText: 'Remand',
} as AnalysedAdjustment

const aTaggedBail = {
  ...aDeduction,
  adjustmentType: 'TAGGED_BAIL',
  taggedBail: {
    caseSequence: 1,
  },
  toDate: '2023-03-03',
  fromDate: '2023-01-01',
  adjustmentTypeText: 'Tagged bail',
} as AnalysedAdjustment

const aCustodyAbroard = {
  ...aDeduction,
  adjustmentType: 'CUSTODY_ABROAD',
  timeSpentInCustodyAbroad: {
    chargeIds: [],
    documentationSource: 'COURT_WARRANT',
  },
  adjustmentTypeText: 'Time spent in custody abroad',
} as AnalysedAdjustment

const aRADA = {
  ...aDeduction,
  adjustmentType: 'RESTORATION_OF_ADDITIONAL_DAYS_AWARDED',
  adjustmentTypeText: 'Restoration of additional days awarded',
  fromDate: '2023-01-01',
} as AnalysedAdjustment

const aSpecialRemission = {
  ...aDeduction,
  adjustmentType: 'SPECIAL_REMISSION',
  adjustmentTypeText: 'Special remission',
  specialRemission: { type: 'MERITORIOUS_CONDUCT' },
} as AnalysedAdjustment

const aUnusedDeduction = {
  ...aDeduction,
  adjustmentType: 'UNUSED_DEDUCTIONS',
  adjustmentTypeText: 'Unused deductions',
} as AnalysedAdjustment

const anADA = {
  ...anAddition,
  adjustmentType: 'ADDITIONAL_DAYS_AWARDED',
  adjustmentTypeText: 'Additional days awarded',
  additionalDaysAwarded: { adjudicationId: ['1'], prospective: false },
  fromDate: '2023-01-01',
} as AnalysedAdjustment

const aUAL = {
  ...anAddition,
  adjustmentType: 'UNLAWFULLY_AT_LARGE',
  adjustmentTypeText: 'Unlawfully at large',
  unlawfullyAtLarge: { type: 'RECALL' },
  fromDate: '2023-01-01',
  toDate: '2023-03-03',
} as AnalysedAdjustment

const aLAL = {
  ...anAddition,
  adjustmentType: 'LAWFULLY_AT_LARGE',
  adjustmentTypeText: 'Lawfully at large',
  lawfullyAtLarge: { affectsDates: 'YES' },
  fromDate: '2023-01-01',
  toDate: '2023-03-03',
} as AnalysedAdjustment

const anAppealApplicant = {
  ...anAddition,
  adjustmentType: 'APPEAL_APPLICANT',
  adjustmentTypeText: 'Time spent as an appeal applicant not to count',
  timeSpentAsAnAppealApplicant: { chargeIds: [789456], courtOfAppealReferenceNumber: 'FOO' },
  fromDate: '2023-01-01',
  toDate: '2023-03-03',
} as AnalysedAdjustment

const sentencesAndOffences = [
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 1,
    caseReference: 'CASE001',
    courtDescription: 'Court 1',
    sentenceSequence: 1,
    offence: { offenderChargeId: 123, offenceEndDate: '2021-02-03', offenceDescription: 'Burglary' },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: true,
  } as AnalysedSentenceAndOffence,
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 1,
    lineSequence: 2,
    caseReference: 'CASE001',
    courtDescription: 'Court 1',
    sentenceSequence: 2,
    offence: {
      offenderChargeId: 456,
      offenceStartDate: '2021-01-04',
      offenceEndDate: '2021-01-05',
      offenceDescription: 'Attempt to solicit murder',
    },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: true,
  } as AnalysedSentenceAndOffence,
  {
    bookingId: 1203780,
    sentenceSequence: 3,
    lineSequence: 3,
    caseSequence: 2,
    courtDescription: 'Aldershot and Farnham County Court',
    sentenceStatus: 'A',
    sentenceCalculationType: '14FTR_ORA',
    sentenceTypeDescription: 'ORA 14 Day Fixed Term Recall',
    sentenceDate: '2018-06-15',
    terms: [{ years: 0, months: 0, weeks: 0, days: 14 }],
    offence: {
      offenderChargeId: 246,
      offenceStartDate: '2018-04-01',
      offenceCode: 'FA06003B',
      offenceDescription: 'Intent to supply controlled drugs',
      indicators: [],
    },
    sentenceAndOffenceAnalysis: 'SAME',
    isSDSPlus: false,
  } as AnalysedSentenceAndOffence,
  {
    terms: [
      {
        years: 3,
      },
    ],
    sentenceTypeDescription: 'SDS Standard Sentence',
    caseSequence: 2,
    lineSequence: 4,
    sentenceSequence: 4,
    offence: {
      offenderChargeId: 789,
      offenceStartDate: '2021-01-04',
      offenceEndDate: '2021-01-05',
      offenceDescription: 'Failure to pay a fine',
    },
    sentenceAndOffenceAnalysis: 'NEW',
    isSDSPlus: true,
  } as AnalysedSentenceAndOffence,
]

describe('Tests for adjustments tables component', () => {
  it('If there are no deductions then hide the deductions section', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs([anADA], sentencesAndOffences)
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(0)
    expect($('[data-qa=additions-heading]')).toHaveLength(1)
    expect($('[data-qa=no-active-adjustments-hint]')).toHaveLength(0)
  })

  it('If there are no additions then hide the additions section', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs([aRADA], sentencesAndOffences)
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(1)
    expect($('[data-qa=additions-heading]')).toHaveLength(0)
    expect($('[data-qa=no-active-adjustments-hint]')).toHaveLength(0)
  })

  it('If there are no deductions or additions then hide both sections and show the no active adjustments hint', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs([], sentencesAndOffences)
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(0)
    expect($('[data-qa=additions]')).toHaveLength(0)
    expect($('[data-qa=no-active-adjustments-hint]').text().trim()).toStrictEqual('There are no active adjustments.')
  })

  it('Should show deductions section and remand table if there is remand present', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aRemand,
          id: 'remand-1',
          days: 1,
          remand: { chargeId: [123, 456] },
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
        },
        {
          ...aRemand,
          id: 'remand-2',
          days: 10,
          remand: { chargeId: [789] },
          toDate: '2024-06-07',
          fromDate: '2024-05-06',
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(1)
    const remandTable = $('[data-qa=remand-table]')
    expect(remandTable).toHaveLength(1)
    const remandRows = remandTable.find('tbody').find('tr')
    expect(remandRows).toHaveLength(3)

    const firstRowCells = remandRows.eq(0).find('td')
    expect(firstRowCells.eq(0).text()).toStrictEqual('25/12/2022 to 01/02/2023')
    expect(firstRowCells.eq(1).text()).toStrictEqual('1')

    const secondRowCells = remandRows.eq(1).find('td')
    expect(secondRowCells.eq(0).text()).toStrictEqual('06/05/2024 to 07/06/2024')
    expect(secondRowCells.eq(1).text()).toStrictEqual('10')

    const totalRow = remandRows.eq(2).find('td')
    expect(totalRow.eq(0).text()).toStrictEqual('Total days')
    expect(totalRow.eq(1).text()).toStrictEqual('11')

    expect($('[data-qa=tagged-bail-table]')).toHaveLength(0)
    expect($('[data-qa=custody-abroad-table]')).toHaveLength(0)
    expect($('[data-qa=rada-table]')).toHaveLength(0)
    expect($('[data-qa=special-remission-table]')).toHaveLength(0)
  })

  it('Should show recall tag for remand adjustments where relevant', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aRemand,
          id: 'remand-1',
          days: 1,
          remand: { chargeId: [246] },
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    const remandTable = $('[data-qa=remand-table]')
    const remandRows = remandTable.find('tbody').find('tr')
    const firstRowCells = remandRows.eq(0).find('td')
    expect(firstRowCells.eq(0).html()).toStrictEqual(
      '25/12/2022 to 01/02/2023<span class="moj-badge moj-badge--black govuk-!-margin-left-4">RECALL</span>',
    )
  })

  it('Should show deductions section and tagged bail table if there is tagged bail present', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aTaggedBail,
          id: 'tb-1',
          days: 1,
          taggedBail: { caseSequence: 1 },
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
          sentenceSequence: 1,
        },
        {
          ...aTaggedBail,
          id: 'tb-2',
          days: 10,
          taggedBail: { caseSequence: 2 },
          toDate: '2024-06-07',
          fromDate: '2024-05-06',
          sentenceSequence: 4,
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(1)
    const taggedBailTable = $('[data-qa=tagged-bail-table]')
    expect(taggedBailTable).toHaveLength(1)
    const taggedBailRows = taggedBailTable.find('tbody').find('tr')
    expect(taggedBailRows).toHaveLength(3)

    const firstRowCells = taggedBailRows.eq(0).find('td')
    expect(firstRowCells.eq(0).html()).toStrictEqual('Court case 1')
    expect(firstRowCells.eq(1).text()).toStrictEqual('1')

    const secondRowCells = taggedBailRows.eq(1).find('td')
    expect(secondRowCells.eq(0).html()).toStrictEqual('Court case 2')
    expect(secondRowCells.eq(1).text()).toStrictEqual('10')

    const totalRow = taggedBailRows.eq(2).find('td')
    expect(totalRow.eq(0).text()).toStrictEqual('Total days')
    expect(totalRow.eq(1).text()).toStrictEqual('11')

    expect($('[data-qa=remand-table]')).toHaveLength(0)
    expect($('[data-qa=custody-abroad-table]')).toHaveLength(0)
    expect($('[data-qa=rada-table]')).toHaveLength(0)
    expect($('[data-qa=special-remission-table]')).toHaveLength(0)
  })

  it('Should show recall tag for tagged bail where relevant', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aTaggedBail,
          id: 'tb-1',
          days: 1,
          taggedBail: { caseSequence: 2 },
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
          sentenceSequence: 3,
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(1)
    const taggedBailTable = $('[data-qa=tagged-bail-table]')
    expect(taggedBailTable).toHaveLength(1)
    const taggedBailRows = taggedBailTable.find('tbody').find('tr')
    expect(taggedBailRows).toHaveLength(2)

    const firstRowCells = taggedBailRows.eq(0).find('td')
    expect(firstRowCells.eq(0).html()).toStrictEqual(
      'Court case 2<span class="moj-badge moj-badge--black govuk-!-margin-left-4">RECALL</span>',
    )
    expect(firstRowCells.eq(1).text()).toStrictEqual('1')
  })

  it('Unused deductions less than total days of remand should show only in remand', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aRemand,
          id: 'remand-1',
          days: 20,
          remand: { chargeId: [123] },
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
        },
        {
          ...aTaggedBail,
          id: 'tb-1',
          days: 20,
          taggedBail: { caseSequence: 2 },
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
          sentenceSequence: 3,
        },
        {
          ...aUnusedDeduction,
          id: 'ud-1',
          days: 5,
        },
        {
          ...aUnusedDeduction,
          id: 'ud-2',
          days: 5,
        },
        {
          ...aUnusedDeduction,
          id: 'ud-3',
          days: 5,
          status: 'INACTIVE', // should never get one but should also be ignored
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)

    const remandTable = $('[data-qa=remand-table]')
    const remandRows = remandTable.find('tbody').find('tr')
    expect(remandRows.eq(1).find('td').eq(1).text()).toStrictEqual('20 including 10 days unused')

    const taggedBailTable = $('[data-qa=tagged-bail-table]')
    const taggedBailRows = taggedBailTable.find('tbody').find('tr')
    expect(taggedBailRows.eq(1).find('td').eq(1).text()).toStrictEqual('20')
  })

  it('Unused deductions equaling than total days of remand should show only in remand', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aRemand,
          id: 'remand-1',
          days: 10,
          remand: { chargeId: [123] },
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
        },
        {
          ...aTaggedBail,
          id: 'tb-1',
          days: 20,
          taggedBail: { caseSequence: 2 },
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
          sentenceSequence: 3,
        },
        {
          ...aUnusedDeduction,
          id: 'ud-1',
          days: 5,
        },
        {
          ...aUnusedDeduction,
          id: 'ud-2',
          days: 5,
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)

    const remandTable = $('[data-qa=remand-table]')
    const remandRows = remandTable.find('tbody').find('tr')
    expect(remandRows.eq(1).find('td').eq(1).text()).toStrictEqual('10 including 10 days unused')

    const taggedBailTable = $('[data-qa=tagged-bail-table]')
    const taggedBailRows = taggedBailTable.find('tbody').find('tr')
    expect(taggedBailRows.eq(1).find('td').eq(1).text()).toStrictEqual('20')
  })

  it('Unused deductions more than total days of remand should show in remand and tagged bail', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aRemand,
          id: 'remand-1',
          days: 10,
          remand: { chargeId: [123] },
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
        },
        {
          ...aTaggedBail,
          id: 'tb-1',
          days: 10,
          taggedBail: { caseSequence: 2 },
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
          sentenceSequence: 3,
        },
        {
          ...aUnusedDeduction,
          id: 'ud-1',
          days: 10,
        },
        {
          ...aUnusedDeduction,
          id: 'ud-2',
          days: 5,
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)

    const remandTable = $('[data-qa=remand-table]')
    const remandRows = remandTable.find('tbody').find('tr')
    expect(remandRows.eq(1).find('td').eq(1).text()).toStrictEqual('10 including 10 days unused')

    const taggedBailTable = $('[data-qa=tagged-bail-table]')
    const taggedBailRows = taggedBailTable.find('tbody').find('tr')
    expect(taggedBailRows.eq(1).find('td').eq(1).text()).toStrictEqual('10 including 5 days unused')
  })

  it('Should show deductions section and time spent in custody abroad table if there is any present', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aCustodyAbroard,
          id: 'ca-1',
          days: 1,
          timeSpentInCustodyAbroad: { chargeIds: [123, 456], documentationSource: 'COURT_WARRANT' },
        },
        {
          ...aCustodyAbroard,
          id: 'ca-2',
          days: 10,
          timeSpentInCustodyAbroad: { chargeIds: [789], documentationSource: 'PPCS_LETTER' },
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(1)
    const custodyAbroadTable = $('[data-qa=custody-abroad-table]')
    expect(custodyAbroadTable).toHaveLength(1)
    const custodyAbroadRows = custodyAbroadTable.find('tbody').find('tr')
    expect(custodyAbroadRows).toHaveLength(3)

    const firstRowCells = custodyAbroadRows.eq(0).find('td')
    expect(firstRowCells.eq(0).text()).toStrictEqual('Sentencing warrant from the court')
    expect(firstRowCells.eq(1).text()).toStrictEqual('1')

    const secondRowCells = custodyAbroadRows.eq(1).find('td')
    expect(secondRowCells.eq(0).text()).toStrictEqual('Letter from PPCS')
    expect(secondRowCells.eq(1).text()).toStrictEqual('10')

    const totalRow = custodyAbroadRows.eq(2).find('td')
    expect(totalRow.eq(0).text()).toStrictEqual('Total days')
    expect(totalRow.eq(1).text()).toStrictEqual('11')

    expect($('[data-qa=remand-table]')).toHaveLength(0)
    expect($('[data-qa=tagged-bail-table]')).toHaveLength(0)
    expect($('[data-qa=rada-table]')).toHaveLength(0)
    expect($('[data-qa=special-remission-table]')).toHaveLength(0)
  })

  it('Should show recall tag for time spent in custody abroad adjustments where relevant', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aCustodyAbroard,
          id: 'custody-abroad-1',
          days: 1,
          timeSpentInCustodyAbroad: { chargeIds: [246], documentationSource: 'COURT_WARRANT' },
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    const custodyAbroadTable = $('[data-qa=custody-abroad-table]')
    const custodyAbroadRows = custodyAbroadTable.find('tbody').find('tr')
    const firstRowCells = custodyAbroadRows.eq(0).find('td')
    expect(firstRowCells.eq(0).html()).toStrictEqual(
      'Sentencing warrant from the court<span class="moj-badge moj-badge--black govuk-!-margin-left-4">RECALL</span>',
    )
  })

  it('Should show deductions section and RADA table if there are any present', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aRADA,
          id: 'rada-1',
          days: 1,
          fromDate: '2025-01-02',
        },
        {
          ...aRADA,
          id: 'rada-2',
          days: 10,
          fromDate: '2025-03-04',
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(1)
    const radaTable = $('[data-qa=rada-table]')
    expect(radaTable).toHaveLength(1)
    const radaRows = radaTable.find('tbody').find('tr')
    expect(radaRows).toHaveLength(3)

    const firstRowCells = radaRows.eq(0).find('td')
    expect(firstRowCells.eq(0).text()).toStrictEqual('02/01/2025')
    expect(firstRowCells.eq(1).text()).toStrictEqual('1')

    const secondRowCells = radaRows.eq(1).find('td')
    expect(secondRowCells.eq(0).text()).toStrictEqual('04/03/2025')
    expect(secondRowCells.eq(1).text()).toStrictEqual('10')

    const totalRow = radaRows.eq(2).find('td')
    expect(totalRow.eq(0).text()).toStrictEqual('Total days')
    expect(totalRow.eq(1).text()).toStrictEqual('11')

    expect($('[data-qa=remand-table]')).toHaveLength(0)
    expect($('[data-qa=tagged-bail-table]')).toHaveLength(0)
    expect($('[data-qa=custody-abroad-table]')).toHaveLength(0)
    expect($('[data-qa=special-remission-table]')).toHaveLength(0)
  })

  it('Should show deductions section and special remissions table if there are any present', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aSpecialRemission,
          id: 'sr-1',
          days: 1,
          specialRemission: { type: 'MERITORIOUS_CONDUCT' },
        },
        {
          ...aSpecialRemission,
          id: 'sr-2',
          days: 10,
          specialRemission: { type: 'RELEASE_IN_ERROR' },
        },
        {
          ...aSpecialRemission,
          id: 'sr-3',
          days: 20,
          specialRemission: { type: 'RELEASE_DATE_CALCULATED_TOO_EARLY' },
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(1)
    const specialRemissionsTable = $('[data-qa=special-remission-table]')
    expect(specialRemissionsTable).toHaveLength(1)
    const srRows = specialRemissionsTable.find('tbody').find('tr')
    expect(srRows).toHaveLength(4)

    const firstRowCells = srRows.eq(0).find('td')
    expect(firstRowCells.eq(0).text()).toStrictEqual('Meritorious (excellent) conduct')
    expect(firstRowCells.eq(1).text()).toStrictEqual('1')

    const secondRowCells = srRows.eq(1).find('td')
    expect(secondRowCells.eq(0).text()).toStrictEqual('Release in error')
    expect(secondRowCells.eq(1).text()).toStrictEqual('10')

    const thirdRowCells = srRows.eq(2).find('td')
    expect(thirdRowCells.eq(0).text()).toStrictEqual('Release date calculated too early')
    expect(thirdRowCells.eq(1).text()).toStrictEqual('20')

    const totalRow = srRows.eq(3).find('td')
    expect(totalRow.eq(0).text()).toStrictEqual('Total days')
    expect(totalRow.eq(1).text()).toStrictEqual('31')

    expect($('[data-qa=remand-table]')).toHaveLength(0)
    expect($('[data-qa=tagged-bail-table]')).toHaveLength(0)
    expect($('[data-qa=custody-abroad-table]')).toHaveLength(0)
    expect($('[data-qa=rada-table]')).toHaveLength(0)
  })

  it('Should show all deductions sections', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aRemand,
          id: 'remand-1',
          days: 1,
          remand: { chargeId: [123] },
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
        },
        {
          ...aTaggedBail,
          id: 'tb-1',
          days: 2,
          taggedBail: { caseSequence: 1 },
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
          sentenceSequence: 1,
        },
        {
          ...aCustodyAbroard,
          id: 'ca-1',
          days: 3,
          timeSpentInCustodyAbroad: { chargeIds: [123, 456], documentationSource: 'COURT_WARRANT' },
        },
        {
          ...aRADA,
          id: 'rada-1',
          days: 4,
          fromDate: '2025-01-02',
        },
        {
          ...aSpecialRemission,
          id: 'sr-3',
          days: 5,
          specialRemission: { type: 'RELEASE_DATE_CALCULATED_TOO_EARLY' },
        },
        {
          ...aUnusedDeduction,
          id: 'ud-1',
          days: 10,
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(1)
    expect($('[data-qa=remand-table]')).toHaveLength(1)
    expect($('[data-qa=tagged-bail-table]')).toHaveLength(1)
    expect($('[data-qa=custody-abroad-table]')).toHaveLength(1)
    expect($('[data-qa=rada-table]')).toHaveLength(1)
    expect($('[data-qa=special-remission-table]')).toHaveLength(1)
  })

  it('Should show all deductions with minimal details as loaded from a previous calc with old style adjustments', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aRemand,
          id: 'remand-1',
          days: 1,
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
        },
        {
          ...aTaggedBail,
          id: 'tb-1',
          days: 2,
          toDate: '2023-02-01',
          fromDate: '2022-12-25',
        },
        {
          ...aCustodyAbroard,
          id: 'ca-1',
          days: 3,
        },
        {
          ...aRADA,
          id: 'rada-1',
          days: 4,
          fromDate: '2025-01-02',
        },
        {
          ...aSpecialRemission,
          id: 'sr-3',
          days: 5,
        },
        {
          ...aUnusedDeduction,
          id: 'ud-1',
          days: 10,
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(1)
    expect($('[data-qa=remand-table]').find('tbody').find('tr')).toHaveLength(2)
    expect($('[data-qa=tagged-bail-table]').find('tbody').find('tr')).toHaveLength(2)
    expect($('[data-qa=custody-abroad-table]').find('tbody').find('tr')).toHaveLength(2)
    expect($('[data-qa=rada-table]').find('tbody').find('tr')).toHaveLength(2)
    expect($('[data-qa=special-remission-table]').find('tbody').find('tr')).toHaveLength(2)
  })

  it.each(['INACTIVE', 'DELETED', 'INACTIVE_WHEN_DELETED'])(
    'should not show deduction adjustments that have a status other than active (%s)',
    (nonActiveStatus: AdjustmentStatus) => {
      const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
        [
          {
            ...aRemand,
            id: 'remand-1',
            days: 1,
            toDate: '2023-02-01',
            fromDate: '2022-12-25',
            status: 'ACTIVE',
          },
          {
            ...aRemand,
            id: 'remand-2',
            days: 10,
            toDate: '2023-02-01',
            fromDate: '2022-12-25',
            status: nonActiveStatus,
          },
          {
            ...aTaggedBail,
            id: 'tb-1',
            days: 2,
            toDate: '2023-02-01',
            fromDate: '2022-12-25',
            status: 'ACTIVE',
          },
          {
            ...aTaggedBail,
            id: 'tb-2',
            days: 20,
            toDate: '2023-02-01',
            fromDate: '2022-12-25',
            status: nonActiveStatus,
          },
          {
            ...aCustodyAbroard,
            id: 'ca-1',
            days: 3,
            status: 'ACTIVE',
          },
          {
            ...aCustodyAbroard,
            id: 'ca-2',
            days: 30,
            status: nonActiveStatus,
          },
          {
            ...aRADA,
            id: 'rada-1',
            days: 4,
            fromDate: '2025-01-02',
            status: 'ACTIVE',
          },
          {
            ...aRADA,
            id: 'rada-2',
            days: 40,
            fromDate: '2025-01-02',
            status: nonActiveStatus,
          },
          {
            ...aSpecialRemission,
            id: 'sr-1',
            days: 5,
            status: 'ACTIVE',
          },
          {
            ...aSpecialRemission,
            id: 'sr-2',
            days: 50,
            status: nonActiveStatus,
          },
          {
            ...aUnusedDeduction,
            id: 'ud-1',
            days: 10,
            status: 'ACTIVE',
          },
          {
            ...aUnusedDeduction,
            id: 'ud-2',
            days: 100,
            status: nonActiveStatus,
          },
        ],
        sentencesAndOffences,
      )
      const content = nunjucks.render('test.njk', { model })
      const $ = cheerio.load(content)
      expect($('[data-qa=deductions-heading]')).toHaveLength(1)
      expect($('[data-qa=remand-table]').find('tbody').find('tr')).toHaveLength(2)
      expect($('[data-qa=tagged-bail-table]').find('tbody').find('tr')).toHaveLength(2)
      expect($('[data-qa=custody-abroad-table]').find('tbody').find('tr')).toHaveLength(2)
      expect($('[data-qa=rada-table]').find('tbody').find('tr')).toHaveLength(2)
      expect($('[data-qa=special-remission-table]').find('tbody').find('tr')).toHaveLength(2)
    },
  )

  it('Should show additions section and ADA table if there are any present', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...anADA,
          id: 'ada-1',
          days: 1,
          fromDate: '2025-01-02',
        },
        {
          ...anADA,
          id: 'ada-2',
          days: 10,
          fromDate: '2025-03-04',
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=additions-heading]')).toHaveLength(1)
    const adaTable = $('[data-qa=ada-table]')
    expect(adaTable).toHaveLength(1)
    const adaRows = adaTable.find('tbody').find('tr')
    expect(adaRows).toHaveLength(3)

    const firstRowCells = adaRows.eq(0).find('td')
    expect(firstRowCells.eq(0).text()).toStrictEqual('02/01/2025')
    expect(firstRowCells.eq(1).text()).toStrictEqual('1')

    const secondRowCells = adaRows.eq(1).find('td')
    expect(secondRowCells.eq(0).text()).toStrictEqual('04/03/2025')
    expect(secondRowCells.eq(1).text()).toStrictEqual('10')

    const totalRow = adaRows.eq(2).find('td')
    expect(totalRow.eq(0).text()).toStrictEqual('Total days')
    expect(totalRow.eq(1).text()).toStrictEqual('11')

    expect($('[data-qa=ual-table]')).toHaveLength(0)
    expect($('[data-qa=lal-table]')).toHaveLength(0)
    expect($('[data-qa=appeal-applicant-table]')).toHaveLength(0)
  })

  it('Should show additions section and UAL table if there are any present', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aUAL,
          id: 'ual-1',
          days: 1,
          unlawfullyAtLarge: { type: 'RECALL' },
          fromDate: '2025-01-02',
          toDate: '2025-01-05',
        },
        {
          ...aUAL,
          id: 'ual-2',
          days: 2,
          unlawfullyAtLarge: { type: 'RELEASE_IN_ERROR' },
          fromDate: '2025-02-04',
          toDate: '2025-03-09',
        },
        {
          ...aUAL,
          id: 'ual-3',
          days: 3,
          unlawfullyAtLarge: { type: 'ESCAPE' },
          fromDate: '2025-11-01',
          toDate: '2025-11-04',
        },
        {
          ...aUAL,
          id: 'ual-4',
          days: 4,
          unlawfullyAtLarge: { type: 'IMMIGRATION_DETENTION' },
          fromDate: '2025-11-25',
          toDate: '2025-11-29',
        },
        {
          ...aUAL,
          id: 'ual-5',
          days: 5,
          unlawfullyAtLarge: { type: 'SENTENCED_IN_ABSENCE' },
          fromDate: '2025-12-30',
          toDate: '2026-01-04',
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=additions-heading]')).toHaveLength(1)
    const ualTable = $('[data-qa=ual-table]')
    expect(ualTable).toHaveLength(1)
    const ualRows = ualTable.find('tbody').find('tr')
    expect(ualRows).toHaveLength(6)

    const firstRowCells = ualRows.eq(0).find('td')
    expect(firstRowCells.eq(0).text()).toStrictEqual('02/01/2025 to 05/01/2025')
    expect(firstRowCells.eq(1).text()).toStrictEqual('1')
    expect(firstRowCells.eq(2).text()).toStrictEqual('Recall')

    const secondRowCells = ualRows.eq(1).find('td')
    expect(secondRowCells.eq(0).text()).toStrictEqual('04/02/2025 to 09/03/2025')
    expect(secondRowCells.eq(1).text()).toStrictEqual('2')
    expect(secondRowCells.eq(2).text()).toStrictEqual('Release in error')

    const thirdRowCells = ualRows.eq(2).find('td')
    expect(thirdRowCells.eq(0).text()).toStrictEqual('01/11/2025 to 04/11/2025')
    expect(thirdRowCells.eq(1).text()).toStrictEqual('3')
    expect(thirdRowCells.eq(2).text()).toStrictEqual('Escape, including absconds and ROTL failures')

    const fourthRowCells = ualRows.eq(3).find('td')
    expect(fourthRowCells.eq(0).text()).toStrictEqual('25/11/2025 to 29/11/2025')
    expect(fourthRowCells.eq(1).text()).toStrictEqual('4')
    expect(fourthRowCells.eq(2).text()).toStrictEqual('Immigration detention')

    const fifthRowCells = ualRows.eq(4).find('td')
    expect(fifthRowCells.eq(0).text()).toStrictEqual('30/12/2025 to 04/01/2026')
    expect(fifthRowCells.eq(1).text()).toStrictEqual('5')
    expect(fifthRowCells.eq(2).text()).toStrictEqual('Sentenced in absence')

    const totalRow = ualRows.eq(5).find('td')
    expect(totalRow.eq(0).text()).toStrictEqual('Total days')
    expect(totalRow.eq(1).text()).toStrictEqual('15')
    expect(totalRow.eq(2).text()).toStrictEqual('')

    expect($('[data-qa=ada-table]')).toHaveLength(0)
    expect($('[data-qa=lal-table]')).toHaveLength(0)
    expect($('[data-qa=appeal-applicant-table]')).toHaveLength(0)
  })

  it('Should show additions section and LAL table if there are any present', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...aLAL,
          id: 'lal-1',
          days: 1,
          lawfullyAtLarge: { affectsDates: 'YES' },
          fromDate: '2025-01-02',
          toDate: '2025-01-05',
        },
        {
          ...aLAL,
          id: 'lal-2',
          days: 2,
          lawfullyAtLarge: { affectsDates: 'NO' },
          fromDate: '2025-02-04',
          toDate: '2025-03-09',
        },
        {
          ...aLAL,
          id: 'lal-3',
          days: 3,
          lawfullyAtLarge: { affectsDates: 'YES' },
          fromDate: '2025-11-01',
          toDate: '2025-11-04',
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=additions-heading]')).toHaveLength(1)
    const lalTable = $('[data-qa=lal-table]')
    expect(lalTable).toHaveLength(1)
    const lalRows = lalTable.find('tbody').find('tr')
    expect(lalRows).toHaveLength(4)

    const firstRowCells = lalRows.eq(0).find('td')
    expect(firstRowCells.eq(0).text()).toStrictEqual('02/01/2025 to 05/01/2025')
    expect(firstRowCells.eq(1).text()).toStrictEqual('1')
    expect(firstRowCells.eq(2).text()).toStrictEqual('Yes')

    const secondRowCells = lalRows.eq(1).find('td')
    expect(secondRowCells.eq(0).text()).toStrictEqual('04/02/2025 to 09/03/2025')
    expect(secondRowCells.eq(1).text()).toStrictEqual('2 (excluded)')
    expect(secondRowCells.eq(2).text()).toStrictEqual('No')

    const thirdRowCells = lalRows.eq(2).find('td')
    expect(thirdRowCells.eq(0).text()).toStrictEqual('01/11/2025 to 04/11/2025')
    expect(thirdRowCells.eq(1).text()).toStrictEqual('3')
    expect(thirdRowCells.eq(2).text()).toStrictEqual('Yes')

    const totalRow = lalRows.eq(3).find('td')
    expect(totalRow.eq(0).text()).toStrictEqual('Total days')
    expect(totalRow.eq(1).text()).toStrictEqual('4')
    expect(totalRow.eq(2).text()).toStrictEqual('')

    expect($('[data-qa=ada-table]')).toHaveLength(0)
    expect($('[data-qa=ual-table]')).toHaveLength(0)
    expect($('[data-qa=appeal-applicant-table]')).toHaveLength(0)
  })

  it('Should show additions section and appeal applicant table if there are any present', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...anAppealApplicant,
          id: 'aa-1',
          days: 1,
          timeSpentAsAnAppealApplicant: { chargeIds: [123, 456], courtOfAppealReferenceNumber: 'COARN1' },
          fromDate: '2025-01-02',
          toDate: '2025-01-05',
        },
        {
          ...anAppealApplicant,
          id: 'aa-2',
          days: 2,
          timeSpentAsAnAppealApplicant: { chargeIds: [789] },
          fromDate: '2025-02-04',
          toDate: '2025-03-09',
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=additions-heading]')).toHaveLength(1)
    const lalTable = $('[data-qa=appeal-applicant-table]')
    expect(lalTable).toHaveLength(1)
    const lalRows = lalTable.find('tbody').find('tr')
    expect(lalRows).toHaveLength(3)

    const firstRowCells = lalRows.eq(0).find('td')
    expect(firstRowCells.eq(0).text()).toStrictEqual('COARN1')
    expect(firstRowCells.eq(1).text()).toStrictEqual('1')

    const secondRowCells = lalRows.eq(1).find('td')
    expect(secondRowCells.eq(0).text()).toStrictEqual('Unknown')
    expect(secondRowCells.eq(1).text()).toStrictEqual('2')

    const totalRow = lalRows.eq(2).find('td')
    expect(totalRow.eq(0).text()).toStrictEqual('Total days')
    expect(totalRow.eq(1).text()).toStrictEqual('3')

    expect($('[data-qa=ada-table]')).toHaveLength(0)
    expect($('[data-qa=ual-table]')).toHaveLength(0)
    expect($('[data-qa=lal-table]')).toHaveLength(0)
  })

  it('Should show recall tag for appeal applicant table if relevant', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...anAppealApplicant,
          id: 'aa-1',
          days: 1,
          timeSpentAsAnAppealApplicant: { chargeIds: [246], courtOfAppealReferenceNumber: 'COARN1' },
          fromDate: '2025-01-02',
          toDate: '2025-01-05',
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=additions-heading]')).toHaveLength(1)
    const lalTable = $('[data-qa=appeal-applicant-table]')
    const lalRows = lalTable.find('tbody').find('tr')
    const firstRowCells = lalRows.eq(0).find('td')
    expect(firstRowCells.eq(0).html()).toStrictEqual(
      'COARN1<span class="moj-badge moj-badge--black govuk-!-margin-left-4">RECALL</span>',
    )
  })

  it('Should show all additions sections with the correct total additions excluding LAL that does not count', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...anADA,
          id: 'ada-1',
          days: 1,
          fromDate: '2025-01-02',
        },
        {
          ...aUAL,
          id: 'ual-1',
          days: 2,
          unlawfullyAtLarge: { type: 'RECALL' },
          fromDate: '2025-01-02',
          toDate: '2025-01-05',
        },
        {
          ...aLAL,
          id: 'lal-1',
          days: 3,
          lawfullyAtLarge: { affectsDates: 'YES' },
          fromDate: '2025-01-02',
          toDate: '2025-01-05',
        },
        {
          ...aLAL,
          id: 'lal-2',
          days: 50, // excluded from total
          lawfullyAtLarge: { affectsDates: 'NO' },
          fromDate: '2025-02-04',
          toDate: '2025-03-09',
        },
        {
          ...anAppealApplicant,
          id: 'aa-1',
          days: 4,
          timeSpentAsAnAppealApplicant: { chargeIds: [123, 456], courtOfAppealReferenceNumber: 'COARN1' },
          fromDate: '2025-01-02',
          toDate: '2025-01-05',
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=additions-heading]')).toHaveLength(1)
    expect($('[data-qa=appeal-applicant-table]')).toHaveLength(1)
    expect($('[data-qa=ada-table]')).toHaveLength(1)
    expect($('[data-qa=ual-table]')).toHaveLength(1)
    expect($('[data-qa=lal-table]')).toHaveLength(1)
  })

  it('Should show all additions sections with minimal data as loaded from previous calculation with old style adjustments', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
      [
        {
          ...anADA,
          id: 'ada-1',
          days: 1,
          fromDate: '2025-01-02',
        },
        {
          ...aUAL,
          id: 'ual-1',
          days: 2,
          fromDate: '2025-01-02',
          toDate: '2025-01-05',
        },
        {
          ...aLAL,
          id: 'lal-1',
          days: 3,
          fromDate: '2025-01-02',
          toDate: '2025-01-05',
        },
        {
          ...anAppealApplicant,
          id: 'aa-1',
          days: 4,
          fromDate: '2025-01-02',
          toDate: '2025-01-05',
        },
      ],
      sentencesAndOffences,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=additions-heading]')).toHaveLength(1)
    expect($('[data-qa=appeal-applicant-table]').find('tbody').find('tr')).toHaveLength(2)
    expect($('[data-qa=ada-table]').find('tbody').find('tr')).toHaveLength(2)
    expect($('[data-qa=ual-table]').find('tbody').find('tr')).toHaveLength(2)
    expect($('[data-qa=lal-table]').find('tbody').find('tr')).toHaveLength(2)
  })

  it.each(['INACTIVE', 'DELETED', 'INACTIVE_WHEN_DELETED'])(
    'Should only show additions with active status',
    (nonActiveStatus: AdjustmentStatus) => {
      const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs(
        [
          {
            ...anADA,
            id: 'ada-1',
            days: 1,
            fromDate: '2025-01-02',
            status: 'ACTIVE',
          },
          {
            ...anADA,
            id: 'ada-2',
            days: 10,
            fromDate: '2025-01-02',
            status: nonActiveStatus,
          },
          {
            ...aUAL,
            id: 'ual-1',
            days: 2,
            fromDate: '2025-01-02',
            toDate: '2025-01-05',
            status: 'ACTIVE',
          },
          {
            ...aUAL,
            id: 'ual-2',
            days: 20,
            fromDate: '2025-01-02',
            toDate: '2025-01-05',
            status: nonActiveStatus,
          },
          {
            ...aLAL,
            id: 'lal-1',
            days: 3,
            fromDate: '2025-01-02',
            toDate: '2025-01-05',
            status: 'ACTIVE',
          },
          {
            ...aLAL,
            id: 'lal-2',
            days: 30,
            fromDate: '2025-01-02',
            toDate: '2025-01-05',
            status: nonActiveStatus,
          },
          {
            ...anAppealApplicant,
            id: 'aa-1',
            days: 4,
            fromDate: '2025-01-02',
            toDate: '2025-01-05',
            status: 'ACTIVE',
          },
          {
            ...anAppealApplicant,
            id: 'aa-2',
            days: 40,
            fromDate: '2025-01-02',
            toDate: '2025-01-05',
            status: nonActiveStatus,
          },
        ],
        sentencesAndOffences,
      )
      const content = nunjucks.render('test.njk', { model })
      const $ = cheerio.load(content)
      expect($('[data-qa=additions-heading]')).toHaveLength(1)
      expect($('[data-qa=appeal-applicant-table]').find('tbody').find('tr')).toHaveLength(2)
      expect($('[data-qa=ada-table]').find('tbody').find('tr')).toHaveLength(2)
      expect($('[data-qa=ual-table]').find('tbody').find('tr')).toHaveLength(2)
      expect($('[data-qa=lal-table]').find('tbody').find('tr')).toHaveLength(2)
    },
  )
})
