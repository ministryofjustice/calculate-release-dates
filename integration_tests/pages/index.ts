import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('Calculate release dates')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  mainHeading = (): PageElement => cy.get('[data-qa=main-heading]')

  startNowButton = (): PageElement => cy.get('[data-qa=start-now-button]')
}
