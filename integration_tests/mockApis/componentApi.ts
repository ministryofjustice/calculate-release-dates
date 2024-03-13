import { stubFor } from './wiremock'

const stubComponents = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/components/components\\?component=header',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        header: {
          html: '<header data-qa="common-header">Common Components Header</header>',
          javascript: ['/common-components/header.js'],
          css: ['/common-components/header.css'],
        },
      },
    },
  })

const stubComponentsFail = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/components/header',
    },
    response: {
      status: 500,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
    },
  })

export default {
  stubComponents,
  stubComponentsFail,
}
