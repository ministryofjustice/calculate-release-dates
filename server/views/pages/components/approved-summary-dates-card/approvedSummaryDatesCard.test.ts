import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import dateFilter from 'nunjucks-date-filter'
import ApprovedSummaryDatesCardModel from './ApprovedSummaryDatesCardModel'

const njkEnv = nunjucks.configure([__dirname])
njkEnv.addFilter('date', dateFilter)

describe('Tests for actions card component', () => {
  it('Should show lines in order', () => {
    const approvedSummaryDatesCardModel: ApprovedSummaryDatesCardModel = {
      approvedDates: [
        {
          shortName: 'SLED',
          fullName: 'Sentence and licence expiry date',
          date: 'Wednesday, 01 September 2010',
          hints: [],
        },
        {
          shortName: 'ABC',
          fullName: 'First in the alphabet but last in the list',
          date: 'Monday, 01 September 1975',
          hints: [],
        },
      ],
      showActions: false,
    }
    const content = nunjucks.render('test.njk', { approvedSummaryDatesCardModel })

    const keys = getKeys(content)
    expect(keys.length).toStrictEqual(2)
    expect(keys[0]).toStrictEqual(['SLED', 'Sentence and licence expiry date'])
    expect(keys[1]).toStrictEqual(['ABC', 'First in the alphabet but last in the list'])

    const values = getValues(content)
    expect(values.length).toStrictEqual(2)
    expect(values[0]).toStrictEqual(['Wednesday, 01 September 2010'])
    expect(values[1]).toStrictEqual(['Monday, 01 September 1975'])
  })

  it('should show all hints for a date', () => {
    const approvedSummaryDatesCardModel: ApprovedSummaryDatesCardModel = {
      approvedDates: [
        {
          shortName: 'SLED',
          fullName: 'Sentence and licence expiry date',
          date: 'Wednesday, 01 September 2010',
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
      showActions: false,
    }
    const content = nunjucks.render('test.njk', { approvedSummaryDatesCardModel })
    const values = getValues(content)
    expect(values).toHaveLength(1)
    expect(values[0]).toStrictEqual(['Wednesday, 01 September 2010', 'Some hint', 'Some other hint'])
  })

  it('hints with links should work', () => {
    const approvedSummaryDatesCardModel: ApprovedSummaryDatesCardModel = {
      approvedDates: [
        {
          shortName: 'SLED',
          fullName: 'Sentence and licence expiry date',
          date: 'Wednesday, 01 September 2010',
          hints: [
            {
              html: '<p data-qa="foo-hint"><a data-qa="my-link" href="/my-link">Some hint</a></p>',
            },
          ],
        },
      ],
      showActions: false,
    }
    const content = nunjucks.render('test.njk', { approvedSummaryDatesCardModel })
    const values = getValues(content)
    expect(values).toHaveLength(1)
    expect(values[0]).toStrictEqual(['Wednesday, 01 September 2010', 'Some hint'])
    const $ = cheerio.load(content)
    expect($('[data-qa=my-link]').first().attr('href')).toStrictEqual('/my-link')
  })

  it('Should show actions for each approved date', () => {
    const approvedSummaryDatesCardModel: ApprovedSummaryDatesCardModel = {
      approvedDates: [
        {
          shortName: 'SLED',
          fullName: 'Sentence and licence expiry date',
          date: 'Wednesday, 01 September 2010',
          hints: [],
        },
        {
          shortName: 'ABC',
          fullName: 'Alphabet soup',
          date: 'Monday, 01 September 1975',
          hints: [],
        },
      ],
      showActions: true,
      actionConfig: {
        nomsId: 'NOM',
        calculationRequestId: 123,
      },
    }
    const content = nunjucks.render('test.njk', { approvedSummaryDatesCardModel })
    const $ = cheerio.load(content)
    expect($('[data-qa=change-approved-SLED-link]').first().attr('href')).toStrictEqual(
      '/calculation/NOM/123/change?dateType=SLED',
    )
    expect($('[data-qa=remove-approved-SLED-link]').first().attr('href')).toStrictEqual(
      '/calculation/NOM/123/remove?dateType=SLED',
    )
    expect($('[data-qa=change-approved-ABC-link]').first().attr('href')).toStrictEqual(
      '/calculation/NOM/123/change?dateType=ABC',
    )
    expect($('[data-qa=remove-approved-ABC-link]').first().attr('href')).toStrictEqual(
      '/calculation/NOM/123/remove?dateType=ABC',
    )
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
