import CONFIG from 'project-config.mjs'
import * as url from 'url'
import { AppHttp } from 'fastflash'

const __dirname = (new url.URL('.', import.meta.url).pathname).replace(/^\/|\/$/g, '')
CONFIG.ROOT = __dirname
const routes=[]
routes[CONFIG.DOMAIN_NAME]= (await import('./src/routes/routes.mjs')).default
const app = new AppHttp()
app.start(routes)