//@ts-check
//подключение App
import { App } from './core/app.js'
import CONFIG from './core/settings/config.js'
import url from 'url'


const __dirname = (new url.URL('.', import.meta.url).pathname).replace(/^\/|\/$/g, '')
CONFIG.ROOT = __dirname
const routes=[];
routes[CONFIG.DOMAIN_NAME]= (await import('./core/settings/routes.js')).default
const app = new App(routes);





