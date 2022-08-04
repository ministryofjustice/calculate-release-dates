import Page, { PageElement } from './page'

export default class AlternativeReleaseIntroPage extends Page {
  constructor() {
    super('alternative-release-intro')
  }

  public static goTo(prisonerId: string): AlternativeReleaseIntroPage {
    cy.visit(`/calculation/${prisonerId}/alternative-release-arrangements`)
    return new AlternativeReleaseIntroPage()
  }

  public listA(): PageElement {
    return cy.get(`[data-qa=list-a]`)
  }

  public listB(): PageElement {
    return cy.get(`[data-qa=list-b]`)
  }

  public listC(): PageElement {
    return cy.get(`[data-qa=list-c]`)
  }

  public listD(): PageElement {
    return cy.get(`[data-qa=list-d]`)
  }

  public continueButton(): PageElement {
    return cy.get(`[data-qa=continue]`)
  }
}
