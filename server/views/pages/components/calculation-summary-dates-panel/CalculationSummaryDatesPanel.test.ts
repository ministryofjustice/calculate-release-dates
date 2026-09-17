import nunjucks from 'nunjucks'
import * as cheerio from 'cheerio'
import { hmppsFormatDate } from '@ministryofjustice/hmpps-court-cases-release-dates-design/hmpps/utils/utils'
import { CalculationSummaryDatesPanelModel } from '../calculation-summary-dates-card/CalculationSummaryDatesCardModel'

const njkEnv = nunjucks.configure([__dirname])
njkEnv.addFilter('hmppsFormatDate', hmppsFormatDate)

describe('Tests for calculation summary dates panel component', () => {
  it('Should show cards in order', () => {
    const calculationSummaryDatesPanelModel: CalculationSummaryDatesPanelModel = {
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
    }
    const content = nunjucks.render('test.njk', { model: calculationSummaryDatesPanelModel })

    const $ = cheerio.load(content)
    const cards = $('.app-stat-card')
    expect(cards).toHaveLength(2)
    expect(cards.eq(0).find('[data-qa=SLED-short-name]').text().trim()).toStrictEqual('SLED')
    expect(cards.eq(0).find('[data-qa=SLED-full-name]').text().trim()).toStrictEqual('Sentence and licence expiry date')
    expect(cards.eq(0).find('[data-qa=SLED-date]').text().trim()).toStrictEqual('Wednesday, 01 September 2010')
    expect(cards.eq(1).find('[data-qa=ABC-short-name]').text().trim()).toStrictEqual('ABC')
    expect(cards.eq(1).find('[data-qa=ABC-full-name]').text().trim()).toStrictEqual(
      'First in the alphabet but last in the list',
    )
    expect(cards.eq(1).find('[data-qa=ABC-date]').text().trim()).toStrictEqual('Monday, 01 September 1975')
  })

  it('should show all hints for a date', () => {
    const calculationSummaryDatesPanelModel: CalculationSummaryDatesPanelModel = {
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
    }
    const content = nunjucks.render('test.njk', { model: calculationSummaryDatesPanelModel })
    const $ = cheerio.load(content)
    const cards = $('.app-stat-card')
    expect(cards).toHaveLength(1)
    expect(cards.eq(0).find('[data-qa=foo-hint]').text().trim()).toContain('Some hint')
    expect(cards.eq(0).find('[data-qa=bar-hint]').text().trim()).toContain('Some other hint')
  })

  it('hints with links should work', () => {
    const calculationSummaryDatesPanelModel: CalculationSummaryDatesPanelModel = {
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
    }
    const content = nunjucks.render('test.njk', { model: calculationSummaryDatesPanelModel })
    const $ = cheerio.load(content)
    const hint = $('[data-qa=my-link]').eq(0)
    expect(hint.text().trim()).toStrictEqual('Some hint')
    expect(hint.attr('href')).toStrictEqual('/my-link')
  })
})
