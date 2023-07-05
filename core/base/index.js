import CONFIG from './project-config.mjs'
import { AppHttp } from 'fastflash'

const routes=[]
routes[CONFIG.DOMAIN_NAME]= (await import('./src/routes/routes.mjs')).default
const app = new AppHttp({
    routes:routes
})
app.start()
