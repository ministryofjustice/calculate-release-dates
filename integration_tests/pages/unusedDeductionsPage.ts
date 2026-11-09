import Page, { PageElement } from './page'

export default class UnusedDeductionsPage extends Page {
  constructor() {
    super('compare')
  }

  heading = (): PageElement => cy.get('h1.govuk-heading-xl')

  runTypeRadio = (value: 'manual' | 'prison' | 'all'): PageElement => cy.get(`input[name=runType][value=${value}]`)

  runTypeLabels = (): PageElement => cy.get('.govuk-radios__label')

  prisonerIds = (): PageElement => cy.get('#prisonerIds')

  prisonSelect = (): PageElement => cy.get('#prison')

  runButton = (): PageElement => cy.get('form.form .govuk-button')

  resultRows = (): PageElement => cy.get('table.govuk-table tbody tr')

  outcomeSelect = (): PageElement => cy.get('#outcome')

  prisonerIdFilter = (): PageElement => cy.get('#prisonerId')

  filterButton = (): PageElement => cy.get('#outcome').closest('form').find('.govuk-button')

  listItems = (): PageElement => cy.get('.gem-c-document-list__item')

  resultsText = (): PageElement => cy.get('.moj-pagination__results')

  nextLink = (): PageElement => cy.get('.govuk-pagination__next')

  currentPaginationItem = (): PageElement => cy.get('.govuk-pagination__item--current')
}
