import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { ServiceUser } from '../@types/express'

interface Component {
    html: string
    css: string[]
    javascript: string[]
}

export default class FrontendComponentApiClient extends RestClient {
    constructor() {
        super('Frontend Component API', config.apis.frontendComponents as ApiConfig)
    }

    getComponent(component: 'header' | 'footer', user: ServiceUser): Promise<Component> {
        return this.get({
            path: `/${component}`,
            headers: { 'x-user-token': user.token },
            authToken: user.token,
        })
    }
}
