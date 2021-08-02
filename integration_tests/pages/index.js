const page = require('./page')

const indexPage = () =>
  page('Calculate release dates', {
    headerUserName: () => cy.get('[data-qa=header-user-name]'),
  })

module.exports = { verifyOnPage: indexPage }
