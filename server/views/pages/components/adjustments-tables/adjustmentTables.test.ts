import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import dateFilter from 'nunjucks-date-filter'
import AdjustmentTablesModel, { adjustmentsTablesFromAdjustmentDTOs } from './AdjustmentTablesModel'
import { AnalysedAdjustment } from '../../../../@types/calculateReleaseDates/calculateReleaseDatesClientTypes'

const njkEnv = nunjucks.configure([
  __dirname,
  'node_modules/govuk-frontend/dist/',
  'node_modules/govuk-frontend/dist/components/',
])
njkEnv.addFilter('date', dateFilter)

const aDeduction = {
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

const someCharges = new Map([
  [123, { offenceDescription: 'Burglary', isRecall: false }],
  [456, { offenceDescription: 'Attempt to solicit murder', isRecall: false }],
  [789, { offenceDescription: 'Failure to pay a fine', isRecall: false }],
  [246, { offenceDescription: 'Intent to supply controlled drugs', isRecall: true }],
])

describe('Tests for adjustments tables component', () => {
  it('If there are no deductions then hide the deductions section', () => {
    const model: AdjustmentTablesModel = adjustmentsTablesFromAdjustmentDTOs([], someCharges)
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(0)
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
      someCharges,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    expect($('[data-qa=deductions-heading]')).toHaveLength(1)
    const remandTable = $('[data-qa=remand-table]')
    expect(remandTable).toHaveLength(1)
    const remandRows = remandTable.find('tbody').find('tr')
    expect(remandRows).toHaveLength(3)

    const firstRowCells = remandRows.eq(0).find('td')
    expect(firstRowCells.eq(0).text()).toStrictEqual('From 25 December 2022 to 01 February 2023')
    expect(firstRowCells.eq(1).html()).toStrictEqual('Burglary<br>Attempt to solicit murder')
    expect(firstRowCells.eq(2).text()).toStrictEqual('1')

    const secondRowCells = remandRows.eq(1).find('td')
    expect(secondRowCells.eq(0).text()).toStrictEqual('From 06 May 2024 to 07 June 2024')
    expect(secondRowCells.eq(1).html()).toStrictEqual('Failure to pay a fine')
    expect(secondRowCells.eq(2).text()).toStrictEqual('10')

    const totalRow = remandRows.eq(2).find('td')
    expect(totalRow.eq(0).text()).toStrictEqual('Total days')
    expect(totalRow.eq(1).html()).toStrictEqual('')
    expect(totalRow.eq(2).text()).toStrictEqual('11')
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
      someCharges,
    )
    const content = nunjucks.render('test.njk', { model })
    const $ = cheerio.load(content)
    const remandTable = $('[data-qa=remand-table]')
    const remandRows = remandTable.find('tbody').find('tr')
    const firstRowCells = remandRows.eq(0).find('td')
    expect(firstRowCells.eq(1).html()).toStrictEqual(
      'Intent to supply controlled drugs<span class="moj-badge moj-badge--black">RECALL</span>',
    )
  })
})
