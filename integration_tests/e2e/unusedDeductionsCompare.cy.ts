import AuthorisedRoles from '../../server/enumerations/authorisedRoles'
import {
  UnusedDeductionsComparisonOverview,
  UnusedDeductionsComparisonPersonDetail,
  UnusedDeductionsComparisonPersonSummary,
  UnusedDeductionsComparisonSummary,
} from '../../server/@types/calculateReleaseDates/unusedDeductionsComparisonTypes'
import Page from '../pages/page'
import UnusedDeductionsPage from '../pages/unusedDeductionsPage'

const summary: UnusedDeductionsComparisonSummary = {
  comparisonShortReference: 'abc12345',
  prison: 'MDI',
  comparisonType: 'PRISON',
  comparisonStatus: 'COMPLETED',
  calculatedAt: '2026-11-02T10:00:00',
  calculatedByUsername: 'USER1',
  numberOfMismatches: 1,
  numberOfValidationErrors: 0,
  numberOfPeopleExpected: 2,
  numberOfPeopleCompared: 2,
  numberOfPeopleComparisonFailedFor: 0,
  comparisonProgress: { percentageComplete: 100 },
}

const mismatch: UnusedDeductionsComparisonPersonSummary = {
  personShortReference: 'def67890',
  person: 'A1234BC',
  lastName: 'Smith',
  establishment: 'MDI',
  outcome: 'MISMATCH',
  existingUnusedDeductions: 10,
  calculatedUnusedDeductions: 61,
  custodialDays: 122,
  totalDeductions: 183,
}

const match: UnusedDeductionsComparisonPersonSummary = {
  personShortReference: 'ghi11111',
  person: 'B1234CD',
  lastName: 'Jones',
  establishment: 'MDI',
  outcome: 'MATCH',
  existingUnusedDeductions: 0,
  calculatedUnusedDeductions: 0,
  custodialDays: 400,
  totalDeductions: 100,
}

const overview = (people: UnusedDeductionsComparisonPersonSummary[]): UnusedDeductionsComparisonOverview => ({
  comparison: summary,
  criteria: { prison: 'MDI' },
  people,
  page: { number: 0, size: 10, totalElements: people.length, totalPages: 1 },
})

const personDetail: UnusedDeductionsComparisonPersonDetail = {
  comparison: summary,
  person: mismatch,
  calculatedAt: '2026-11-02T10:05:00',
  fatalException: null,
  validationMessages: [],
  adjustments: [
    {
      id: 'a1',
      adjustmentType: 'REMAND',
      source: 'DPS',
      fromDate: '2026-01-01',
      toDate: '2026-07-02',
      days: 183,
      effectiveDays: 99,
    },
  ],
}

context('Bulk unused deductions comparison', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', [AuthorisedRoles.ROLE_RELEASE_DATE_COMPARER])
    cy.task('stubManageUser')
    cy.task('stubGetUserCaseloads')
    cy.task('stubComponents')
  })

  it('shows the run form with manual, prison and all prisons options', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/unused-deductions' })

    const page = Page.verifyOnPage(UnusedDeductionsPage)
    page.heading().should('contain.text', 'Bulk unused deductions calculation')
    page.runTypeLabels().should('have.length', 3)
    page.runTypeLabels().eq(0).should('contain.text', 'A list of prisoners')
    page.runTypeLabels().eq(1).should('contain.text', 'A single prison')
    page
      .runTypeLabels()
      .eq(2)
      .invoke('text')
      .should('match', /^\s*All prisons\s*$/)
  })

  it('shows an error when nothing is selected', () => {
    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/unused-deductions' })

    const page = Page.verifyOnPage(UnusedDeductionsPage)
    page.runButton().click()

    page.errorSummary().should('contain.text', 'Select how you want to run the comparison')
  })

  it('runs a comparison for a single prison and shows the result', () => {
    cy.task('stubCreateUnusedDeductionsComparison', { body: { prison: 'MDI' }, response: summary })
    cy.task('stubGetUnusedDeductionsComparison', { reference: 'abc12345', response: overview([mismatch, match]) })
    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/unused-deductions' })

    const page = Page.verifyOnPage(UnusedDeductionsPage)
    page.runTypeRadio('prison').check()
    page.prisonSelect().select('MDI')
    page.runButton().click()

    cy.url().should('include', '/compare/unused-deductions/result/abc12345')
    Page.verifyOnPage(UnusedDeductionsPage)
    page.heading().should('contain.text', 'Unused deductions comparison results')
    page.resultRows().should('have.length', 2)
    page.resultRows().eq(0).should('contain.text', 'A1234BC').and('contain.text', 'Mismatch')
    page.resultRows().eq(1).should('contain.text', 'B1234CD').and('contain.text', 'Match')
  })

  it('runs a comparison for all prisons', () => {
    cy.task('stubCreateUnusedDeductionsComparison', {
      body: { prison: 'all' },
      response: { ...summary, comparisonType: 'ALL_PRISONS', prison: undefined },
    })
    cy.task('stubGetUnusedDeductionsComparison', { reference: 'abc12345', response: overview([mismatch]) })
    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/unused-deductions' })

    const page = Page.verifyOnPage(UnusedDeductionsPage)
    page.runTypeRadio('all').check()
    page.runButton().click()

    cy.url().should('include', '/compare/unused-deductions/result/abc12345')
    page.resultRows().should('have.length', 1)
  })

  it('runs a comparison for a manual list of prisoners, ignoring blank lines', () => {
    cy.task('stubCreateUnusedDeductionsComparison', {
      body: { prisonerIds: ['A1234BC', 'B1234CD'] },
      response: { ...summary, comparisonType: 'MANUAL', prison: undefined },
    })
    cy.task('stubGetUnusedDeductionsComparison', { reference: 'abc12345', response: overview([mismatch, match]) })
    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/unused-deductions' })

    const page = Page.verifyOnPage(UnusedDeductionsPage)
    page.runTypeRadio('manual').check()
    page.prisonerIds().type(' A1234BC \n\nB1234CD\n', { delay: 0 })
    page.runButton().click()

    cy.url().should('include', '/compare/unused-deductions/result/abc12345')
    page.resultRows().should('have.length', 2)
  })

  it('lists previous runs with pagination', () => {
    cy.task('stubGetUnusedDeductionsComparisons', {
      page: 1,
      size: 10,
      response: {
        content: [summary],
        page: { number: 1, size: 10, totalElements: 11, totalPages: 2 },
      },
    })
    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/unused-deductions/list?page=2' })

    const page = Page.verifyOnPage(UnusedDeductionsPage)
    page.listItems().should('have.length', 1)
    page.listItems().first().should('contain.text', 'MDI').and('contain.text', '1 mismatches')
    page.currentPaginationItem().should('contain.text', '2')
    page.resultsText().should('contain.text', 'Showing 11 to 11 of 11 total runs')
  })

  it('says when there are no previous runs', () => {
    cy.task('stubGetUnusedDeductionsComparisons', {
      response: { content: [], page: { number: 0, size: 10, totalElements: 0, totalPages: 0 } },
    })
    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/unused-deductions/list' })

    Page.verifyOnPage(UnusedDeductionsPage)
    cy.contains('No previous runs').should('exist')
  })

  it('filters results by outcome', () => {
    cy.task('stubGetUnusedDeductionsComparison', { reference: 'abc12345', response: overview([mismatch, match]) })
    cy.task('stubGetUnusedDeductionsComparison', {
      reference: 'abc12345',
      outcome: 'MISMATCH',
      response: overview([mismatch]),
    })
    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/unused-deductions/result/abc12345' })

    const page = Page.verifyOnPage(UnusedDeductionsPage)
    page.resultRows().should('have.length', 2)
    page.outcomeSelect().select('MISMATCH')
    page.filterButton().click()

    cy.url().should('include', 'outcome=MISMATCH')
    page.resultRows().should('have.length', 1)
    page.resultRows().first().should('contain.text', 'A1234BC')
  })

  it('shows the adjustments used for a person', () => {
    cy.task('stubGetUnusedDeductionsComparison', { reference: 'abc12345', response: overview([mismatch, match]) })
    cy.task('stubGetUnusedDeductionsComparisonPerson', {
      reference: 'abc12345',
      personReference: 'def67890',
      response: personDetail,
    })
    cy.signIn({ failOnStatusCode: false, returnUrl: '/compare/unused-deductions/result/abc12345' })

    const page = Page.verifyOnPage(UnusedDeductionsPage)
    cy.contains('a', 'A1234BC').click()

    cy.url().should('include', '/detail/def67890')
    page.heading().should('contain.text', 'Unused deductions detail')
    cy.get('.govuk-summary-list').should('contain.text', '61').and('contain.text', '122')
    page.resultRows().should('have.length', 1)
    page.resultRows().first().should('contain.text', 'Remand').and('contain.text', '183').and('contain.text', '99')
  })
})
