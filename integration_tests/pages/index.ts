import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('index')
  }

  public static goTo(prisonerId?: string): IndexPage {
    cy.visit(prisonerId ? `?prisonId=${prisonerId}` : '/')
    return new IndexPage()
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  mainHeading = (): PageElement => cy.get('[data-qa=main-heading]')

  startNowButton = (): PageElement => cy.get('[data-qa=start-now-button]')
}
