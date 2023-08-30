import CONFIG from './project-config.mjs'
import { AppHttp } from 'fastflash'

const routes={}
const staticRoutes={}
const routeFile = await import('./src/routes/routes.mjs')

routes[CONFIG.DOMAIN_NAME]=routeFile.dynamicRoutes
staticRoutes[CONFIG.DOMAIN_NAME]=routeFile.staticRoutes

const app = new AppHttp({
    routes,
    staticRoutes
})

app.start()
