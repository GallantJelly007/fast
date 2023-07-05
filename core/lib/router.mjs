//@ts-check

import Logger from './logger.mjs'
import { HttpClient } from './middle.mjs'

import { EventEmitter } from 'events'
import * as fs from 'fs'
import url from 'url'

export class RouterStatic{

    static #CONFIG

    static async setConfig(pathToConfig){
        try{
            RouterStatic.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('RouterStatic.setConfig()',error)
        }
    }

    async start(request,response){
        let isSuccess=false
        let path = request.url.toString()
        path = path.startsWith('/') ? path.substring(1, path.length) : path
        path = path.endsWith('/') ? path.substring(0, path.length - 1) : path
        path = decodeURI(path)
        for (let item of RouterStatic.#CONFIG.ALLOWED_STATIC_FORMATS.keys()) {
            for(let folder of RouterStatic.#CONFIG.STATIC_PATHS){
                if (path.startsWith(folder) && path.endsWith(item)) {
                    fs.readFile(RouterStatic.#CONFIG.ROOT + "/" + path, (err, data) => {
                        if (!err) {
                            response.setHeader('Content-Type', RouterStatic.#CONFIG.ALLOWED_STATIC_FORMATS.get(item))
                            response.end(data)
                        } else {
                            response.statusCode = 404
                            response.end()
                        }
                    })
                    isSuccess=true
                    break
                }
            }
            if(isSuccess){
                break
            }
        }
    }
}

export class Router {
    emmiter
    #routes = {}
    static #CONFIG

    static async setConfig(pathToConfig){
        try{
            Router.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('Router.setConfig()',error)
        }
    }

    constructor(routes) {
        this.#routes = routes
        this.emmiter = new EventEmitter()
    }

    /**
     * @param {object} request 
     * @param {object} response 
     * @returns 
     */
    async start(request, response) {
        let isCheck = false, isStatic = false
        try {
            let path = request.url.toString()
            let ref = request.headers['x-forwarded-host']
            ref = ref ?? request.headers['host']
            if(Router.#CONFIG.DEBUG)
                Logger.debug('ROUTER',`Input Request: ${ref}${path}`)
            path = path.startsWith('/') ? path.substring(1, path.length) : path
            path = path.endsWith('/') ? path.substring(0, path.length - 1) : path
            path = decodeURI(path)
            for (let item of Router.#CONFIG.ALLOWED_STATIC_FORMATS.keys()) {
                for (let folder of Router.#CONFIG.STATIC_PATHS) {
                    if (path.startsWith(folder) && path.endsWith(item)) {
                        fs.readFile(Router.#CONFIG.ROOT + "/" + path, (err, data) => {
                            if (!err) {
                                response.setHeader('Content-Type', Router.#CONFIG.ALLOWED_STATIC_FORMATS.get(item))
                                response.end(data)
                            } else {
                                response.statusCode = 404
                                response.end()
                            }
                        })
                        isStatic = true
                        break
                    }
                }
                if (isStatic) {
                    break
                }
            }
            if (!isStatic) {
                ref = ref.replace(/\:[0-9]*/,'')
                let routes = null
                for (let key in this.#routes) {
                    let reg = new RegExp(`^${key}$`)
                    if (reg.test(ref)) {
                        routes = this.#routes[key]
                        break
                    }
                }
                if (routes == null) {
                    Logger.debug('Router','Нет совпадений доменных имен в роутах и конфигурации')
                    response.statusCode = 404
                    response.end()
                    return
                }
                let checkEvent = false
                this.emmiter.on('checkRes', () => {
                    if (!isCheck) {
                        response.statusCode = 404
                        response.end()
                    }
                })
                for (let item of routes.keys()) {
                    let reg = new RegExp(item)
                    if (reg.test(path)) {
                        let route, app;
                        if (item != path) {
                            route = path.replace(item, routes.get(item)).split(':')
                        } else {
                            route = routes.get(item).split(':')
                        }
                        if (route.length != 2) {
                            response.statusCode = 404
                            response.end()
                            throw new Error('Неверный шаблон адреса')
                        }
                        let methods = route[0].split('/')
                        route = route[1].split('/')
                        let path1 = `${Router.#CONFIG.CONTROLLER_PATH}/${route[0]}.mjs`
                        let path2 = `${Router.#CONFIG.CONTROLLER_PATH}/${route[0]}.js`
                        let controllerPath = ''
                        if (fs.existsSync(path1)) {
                            controllerPath = path1
                        }else{
                            if(fs.existsSync(path2)){
                                controllerPath = path2
                            }else{
                                response.statusCode = 404
                                response.end()
                                throw new Error('Не найден контроллер для запроса, проверьте переменную CONTROLLER_PATH в файле конфигурации и файл с роутами')
                            }
                        }
                        route.shift()
                        let classController = (await import(url.pathToFileURL(controllerPath).href)).default
                        response.setHeader('Content-Type', 'text/html; charset=utf-8')

                        switch (classController.type) {
                            case 'base': app = new HttpClient(request, response, methods)
                                break
                            case 'rest': app = new HttpClient(request, response, methods, false)
                                break
                            default: throw new Error('Не указан тип контролеера')
                        }
                        await app.init()
                        let controller = new classController(app)
                        let method = route[0]
                        route.shift()

                        let r = this
                        if (route.length == 0) route = null
                        controller.on('error', (err)=>{
                            console.log("Error caught: ", err.message)
                        })
                        controller.on('ready', async (result) => {
                            if (!result) isCheck = false
                            else await controller[method](app, route)
                                .then(result => {
                                    isCheck = result
                                    r.emmiter.emit('checkRes')
                                })
                                .catch(err => {
                                    response.statusCode = 503
                                    response.end();
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
                    response.statusCode = 404
                    response.end()
                }
            }
        } catch (err) {
            Logger.error('Router',err, request.url.toString());
        }
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
                let path = client.input.query
                for (let item of this.#routes.keys()) {
                    let reg = new RegExp(item)
                    if (reg.test(path)) {
                        let route
                        if (item != path) {
                            route = path.replace(item, this.#routes.get(item)).split('/')
                        } else {
                            route = this.#routes.get(item).split('/')
                        }
                        let path1 = `${RouterSocket.#CONFIG.ROOT}/controllers/${route[0]}.mjs`
                        let path2 = `${RouterSocket.#CONFIG.ROOT}/controllers/${route[0]}.js`
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

