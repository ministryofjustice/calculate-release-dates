import Page, { PageElement } from './page'

export default class ErrorPage extends Page {
  constructor() {
    super('error')
  }

  public heading = (): PageElement => cy.get('[data-qa=error-heading]')
}
