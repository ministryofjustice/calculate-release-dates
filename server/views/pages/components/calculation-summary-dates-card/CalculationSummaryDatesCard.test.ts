import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import dateFilter from 'nunjucks-date-filter'
import CalculationSummaryDatesCardModel, { filteredListOfDates } from './CalculationSummaryDatesCardModel'
import { validPreCalcHints } from '../../../../utils/utils'

const njkEnv = nunjucks.configure([__dirname])
njkEnv.addFilter('date', dateFilter)
njkEnv.addFilter('validPreCalcHints', validPreCalcHints)

describe('ReleaseDateType', () => {
  it('should not have some of the properties in filteredListOfDates', () => {
    expect(filteredListOfDates).not.toContain('NCRD')
    expect(filteredListOfDates).not.toContain('ESED')
    expect(filteredListOfDates).not.toContain('None')
  })
})

describe('Tests for actions card component', () => {
  it('Should show lines in order', () => {
    const calculationSummaryDatesCardModel: CalculationSummaryDatesCardModel = {
      releaseDates: [
        {
          shortName: 'SLED',
          fullName: 'Sentence and licence expiry date',
          date: '2010-09-01',
          hints: [],
        },
        {
          shortName: 'ABC',
          fullName: 'First in the alphabet but last in the list',
          date: '1975-09-01',
          hints: [],
        },
      ],
      showNoDatesApply: false,
    }
    const content = nunjucks.render('test.njk', { calculationSummaryDatesCardModel })

    const keys = getKeys(content)
    expect(keys.length).toStrictEqual(2)
    expect(keys[0]).toStrictEqual(['SLED', 'Sentence and licence expiry date'])
    expect(keys[1]).toStrictEqual(['ABC', 'First in the alphabet but last in the list'])

    const values = getValues(content)
    expect(values.length).toStrictEqual(2)
    expect(values[0]).toStrictEqual(['Wednesday, 01 September 2010'])
    expect(values[1]).toStrictEqual(['Monday, 01 September 1975'])
  })

  it('Should show no dates line if requested', () => {
    const calculationSummaryDatesCardModel: CalculationSummaryDatesCardModel = {
      releaseDates: [],
      showNoDatesApply: true,
    }
    const content = nunjucks.render('test.njk', { calculationSummaryDatesCardModel })
    const $ = cheerio.load(content)
    expect($('[data-qa=None-date]').get()).toHaveLength(1)
  })

  it('Should not show no dates line if not requested, even if there are no dates', () => {
    const calculationSummaryDatesCardModel: CalculationSummaryDatesCardModel = {
      releaseDates: [],
      showNoDatesApply: false,
    }
    const content = nunjucks.render('test.njk', { calculationSummaryDatesCardModel })
    const $ = cheerio.load(content)
    expect($('[data-qa=None-date]').get()).toHaveLength(0)
  })

  it('should show all hints for a date', () => {
    const calculationSummaryDatesCardModel: CalculationSummaryDatesCardModel = {
      releaseDates: [
        {
          shortName: 'SLED',
          fullName: 'Sentence and licence expiry date',
          date: '2010-09-01',
          hints: [
            {
              html: '<p data-qa="foo-hint">Some hint</p>',
            },
            {
              html: '<p data-qa="bar-hint">Some other hint</p>',
            },
          ],
        },
      ],
      showNoDatesApply: false,
    }
    const content = nunjucks.render('test.njk', { calculationSummaryDatesCardModel })
    const values = getValues(content)
    expect(values).toHaveLength(1)
    expect(values[0]).toStrictEqual(['Wednesday, 01 September 2010', 'Some hint', 'Some other hint'])
  })
  it('hints with links should work', () => {
    const calculationSummaryDatesCardModel: CalculationSummaryDatesCardModel = {
      releaseDates: [
        {
          shortName: 'SLED',
          fullName: 'Sentence and licence expiry date',
          date: '2010-09-01',
          hints: [
            {
              html: '<p data-qa="foo-hint"><a data-qa="my-link" href="/my-link">Some hint</a></p>',
            },
          ],
        },
      ],
      showNoDatesApply: false,
    }
    const content = nunjucks.render('test.njk', { calculationSummaryDatesCardModel })
    const values = getValues(content)
    expect(values).toHaveLength(1)
    expect(values[0]).toStrictEqual(['Wednesday, 01 September 2010', 'Some hint'])
    const $ = cheerio.load(content)
    expect($('[data-qa=my-link]').first().attr('href')).toStrictEqual('/my-link')
  })
  function getKeys(content: string) {
    return getTextLines(content, '.custom-summary-list__key')
  }

  function getValues(content: string) {
    return getTextLines(content, '.govuk-summary-list__value')
  }

  function getTextLines(content: string, selector: string) {
    const $ = cheerio.load(content)
    return $(selector)
      .get()
      .map(key => $(key).text())
      .map(heading =>
        heading
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0),
      )
  }
})
