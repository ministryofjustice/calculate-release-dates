import Page, { PageElement } from './page'

export default class AlternativeReleaseIntroPage extends Page {
  constructor() {
    super('alternative-release-intro')
  }

  public static goTo(prisonerId: string): AlternativeReleaseIntroPage {
    cy.visit(`/calculation/${prisonerId}/alternative-release-arrangements`)
    return new AlternativeReleaseIntroPage()
  }

  public continueButton(): PageElement {
    return cy.get(`[data-qa=continue]`)
  }
}
