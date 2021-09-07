const page = require('./page')

const indexPage = () =>
  page('Calculate release dates', {
    headerUserName: () => cy.get('[data-qa=header-user-name]'),
    mainHeading: () => cy.get('[data-qa=main-heading]'),
    startNowButton: () => cy.get('[data-qa=start-now-button]'),
  })

module.exports = { verifyOnPage: indexPage }
