//@ts-check

import Logger from './logger.mjs'
import { HttpClient } from './middle.mjs'

import { EventEmitter } from 'events'
import * as fs from 'fs'
import * as crypto from 'crypto'
import url from 'url'
import path from 'path'
import RequestLimiter from './request-limiter.mjs'

export class Router {
    #emmiter
    #dynamicRoutes
    #staticRoutes
    #limiter
    static #CONFIG

    get limiter(){
        return this.#limiter
    }

    static async setConfig(pathToConfig){
        try{
            Router.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('Router.setConfig()',error)
        }
    }

    /**
     * 
     * @param {Object} params 
     * Объект содержащий маршруты для контроллеров и файлового доступа
     * @param {Object|Map} params.routes
     * Маршруты для выполнения логики и передачи данных в контроллеры
     * @param {Object|Map} params.staticRoutes
     * @param {RequestLimiter} [params.limiter]
     * Статические файловые маршруты
     */
    constructor(params) {
        if(params?.routes)
            this.#dynamicRoutes = params.routes
        if(params?.staticRoutes)
            this.#staticRoutes = params?.staticRoutes
        if(params?.limiter instanceof RequestLimiter)
            this.#limiter = params.limiter
        this.#emmiter = new EventEmitter()
    }

    /**
     * @param {object} request 
     * Объект входящего запроса
     * @param {object} response 
     * Объект ответа на входящий запрос
     * @returns 
     */
    async route(request, response) {
        const sendFail = (message='',code=404)=>{
            try{
                let isPage = request.method.toLowerCase() == 'get' && /text\/html/.test(request.headers['accept'])
                let params = isPage
                    ? {
                        code,
                        pathFile: path.join(Router.#CONFIG.STATUS_PAGES_PATH, `/page${code}.html`).replace(/\\/g,'/'),
                        type: HttpClient.RESPONSE_TYPES.HTML
                    }
                    : { code }
                HttpClient.send(request, response, params)
                if (message && message != '')
                    Logger.debug('Router', message)
            } catch (err) {
                Logger.error('Router.route.sendFail()', err)
            }
        }
        try {
            if(this.limiter instanceof RequestLimiter){
                let result = this.limiter.checkIp(request)
                if (!result.success) {
                    sendFail(result.message, result.code)
                    return
                }
            }
            let isCheck = false
            let addr = decodeURI(request.url.toString())
            let host = request.headers['x-forwarded-host'] ?? request.headers['host']
            Logger.debug('ROUTER',`Input Request: ${host}${addr}`)
            host = host.replace(/\:[0-9]*/,'')
            if(!this.#staticRoutes && !this.#dynamicRoutes){
                sendFail('Ни одной коллекции маршрутов не было передано в роутер!',503)
                return
            }
            if(this.#staticRoutes){
                let routesDomain = Object.keys(this.#staticRoutes).find(key=>new RegExp(`^${key}$`).test(host))
                if (routesDomain) {
                    let routes = this.#staticRoutes[routesDomain]
                    for(let addresReg of routes.keys()){
                        let reg = new RegExp(addresReg)
                        if(reg.test(addr)){
                            let filePath = path.join(Router.#CONFIG.ROOT,routes.get(addresReg)).replace(/\\/g,'/')
                            if(fs.existsSync(filePath)){
                                let fileInfo = fs.lstatSync(filePath)
                                if(fileInfo.isDirectory())
                                    filePath = path.join(Router.#CONFIG.ROOT,addr.replace(addresReg,routes.get(addresReg))).replace(/\\/g,'/')
                                let ext = `.${filePath.split('.').pop()}`
                                let contentType = Router.#CONFIG.ALLOWED_STATIC_FORMATS.find(([key,value])=>value==ext)?.[0]
                                if(fs.existsSync(filePath) && contentType){
                                    fs.readFile(filePath, (err, data) => {
                                        if (!err) {
                                            response.setHeader('Content-Type', contentType)
                                            response.end(data)
                                        } else {
                                            sendFail(`Не удалось прочитать файл - {${filePath}}, запрос отклонен!`,503)
                                        }
                                    })
                                    return
                                }else{
                                    sendFail(`Расширение файла - {${ext}} не является допустимым, либо указанный путь: \n{\n   URL:${host+'/'+addr}, \n   PATH:${filePath}\n}\n, не существует, запрос отклонен!`)
                                    return
                                }
                            }else{
                                sendFail(`Указанный путь: \n{\n   URL:${host+addr}, \n   PATH:${filePath}\n}\n, не существует, запрос отклонен!`)
                                return
                            }
                        }
                    }
                }
            } 
            if (this.#dynamicRoutes) {
                let routesDomain = Object.keys(this.#dynamicRoutes).find(key=>new RegExp(`^${key}$`).test(host))
                if (!routesDomain) {
                    sendFail('Нет совпадений доменных имен в роутах и конфигурации')
                    return
                }
                let routes = this.#dynamicRoutes[routesDomain]
                let checkEvent = false
                for (let addresReg of routes.keys()) {
                    let reg = new RegExp(addresReg)
                    if (reg.test(addr)) {
                        let route, app
                        if (addresReg != addr) {
                            route = addr.replace(addresReg, routes.get(addresReg)).split(':')
                        } else {
                            route = routes.get(addresReg).split(':')
                        }
                        if (route.length != 2) {
                            sendFail()
                            throw new Error('Неверный шаблон адреса')
                        }
                        let methods = route[0].split('/')
                        route = route[1].split('/')
                        let path1 = path.normalize(`${Router.#CONFIG.CONTROLLER_PATH}/${route[0]}.mjs`).replace(/\\/g,'/')
                        let path2 = path.normalize(`${Router.#CONFIG.CONTROLLER_PATH}/${route[0]}.js`).replace(/\\/g,'/')
                        let controllerPath = ''
                        if (fs.existsSync(path1)) {
                            controllerPath = path1
                        }else{
                            if(fs.existsSync(path2)){
                                controllerPath = path2
                            }else{
                                sendFail()
                                throw new Error('Не найден контроллер для запроса, проверьте переменную CONTROLLER_PATH в файле конфигурации и файл с роутами')
                            }
                        }
                        route.shift()
                        let classController = (await import(url.pathToFileURL(controllerPath).href)).default
                        switch (classController.type) {
                            case 'base': app = new HttpClient(request, response, methods, Router.#CONFIG.COOKIE_ENABLED)
                                break
                            case 'rest': app = new HttpClient(request, response, methods, false)
                                break
                            default: throw new Error('Не указан тип контролеера')
                        }
                        if(!await app.init())
                            sendFail(`Не удалось инициализировать HttpClient`, 503)
                        let controller = new classController(app)
                        let method = route[0]
                        if(!controller?.[method]){
                            sendFail(`По URL: {${host+addr}} в контроллере - ${controllerPath} не найдена функция - {${method}}, либо неверно составлен маршрут, запрос отклонен!`)
                            return
                        }
                        route.shift()
                        let router = this
                        if (route.length == 0) route = null
                        controller.on('error', (err)=>{
                            Logger.error('Controller', err)
                        })
                        let eventName = crypto.randomUUID()
                        this.#emmiter.on(eventName, () => {
                            if (!isCheck) sendFail('',403)
                        })
                        controller.on('ready', async (result) => {
                            if (!result) isCheck = false
                            else await controller[method](app, route)
                                .then(result => {
                                    isCheck = result
                                    router.#emmiter.emit(eventName)
                                })
                                .catch(err => {
                                    sendFail('',503)
                                    Logger.error('Router',err, request.url.toString())
                                })
                        })
                        checkEvent = true
                        await controller.start()
                        break
                    } else {
                        isCheck = false
                    }
                }
                if (!checkEvent) {
                    sendFail('Не найден подходящий контроллер, запрос отклонен со статусом 404')
                }
            }
        } catch (err) {
            Logger.error('Router',err, request.url.toString());
            sendFail('',503)
        }
    }

    /** 
	 * @param {Object} params
     * @param {string} params.domain
     * @param {Map} [params.routes]
     * @param {number} [params.interval]
     * @param {number} [params.allowCount]
     * @param {number} [params.blockCount]
     * @param {number} [params.blockTime]
	 */
	limit(params){
		this.#limiter = new RequestLimiter(params)
		return this
	}
}

export class RouterSocket {
    #routes
    static #CONFIG

    static async setConfig(pathToConfig){
        try{
            RouterSocket.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('RouterSocket.setConfig()',error)
        }
    }

    constructor(routes) {
        this.#routes = routes
    }

    async start(client) {
        try {
            let emmiter = new EventEmitter()
            let isCheck = false
            if (client.input.hasOwnProperty('query')) {
                if (client.input.hasOwnProperty('type') && client.type == null) {
                    if (client.input.type != null && client.input.type != '') client.type = client.input.type
                }
                let request = client.input.query
                for (let item of this.#routes.keys()) {
                    let reg = new RegExp(item)
                    if (reg.test(request)) {
                        let route
                        if (item != request) {
                            route = request.replace(item, this.#routes.get(item)).split('/')
                        } else {
                            route = this.#routes.get(item).split('/')
                        }
                        let path1 = path.normalize(`${RouterSocket.#CONFIG.ROOT}/controllers/${route[0]}.mjs`).replace(/\\/g,'/')
                        let path2 = path.normalize(`${RouterSocket.#CONFIG.ROOT}/controllers/${route[0]}.js`).replace(/\\/g,'/')
                        let controllerPath = ''
                        if (fs.existsSync(path1)) {
                            controllerPath = path1
                        }else{
                            if(fs.existsSync(path2)){
                                controllerPath = path2
                            }else{
                                client.send({ success: 0, message: "Нет доступа по данному запросу" })
                                return
                            }
                        }
                        route.shift()
                        let classController = (await import(url.pathToFileURL(controllerPath).href)).default
                        let controller = new classController(client)
                        let method = 'action' + route[0][0].toUpperCase() + route[0].slice(1)
                        route.shift()
                        if (route.length > 0) controller.on('ready', async () => { isCheck = await controller[method](client, route); emmiter.emit('checkRes') })
                        else controller.on('ready', async () => { isCheck = await controller[method](client); emmiter.emit('checkRes') })
                        controller.start()
                        break
                    } else {
                        isCheck = false
                    }
                }
                emmiter.on('checkRes', () => {
                    if (!isCheck) {
                        client.send({ success: 0, message: "Неверные данные запроса" })
                    }
                })
            } else {
                client.send({ success: 0, message: "Неверные данные запроса" })
            }
        } catch (err) {
            Logger.error('RouterSocket',err, client.input.query)
        }
    }
}

