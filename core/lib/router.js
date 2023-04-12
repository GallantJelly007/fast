//@ts-check

import { EventEmitter } from 'events'
import * as fs from 'fs'
import * as nodemailer from 'nodemailer'
import Nun from 'nunjucks'
import Logger, { UrlError } from './logger.js'
import Token from './token.js'
import Cookie from './cookie.js'
import Translate from './translate.js'
import Session from './session.js'
import { InputHttp } from './input.js'
import CONFIG from '../settings/config.js'
import url from 'url'



export class RouterStatic{

    async start(request,response){
        let isSuccess=false
        let path = request.url.toString()
        path = path.startsWith('/') ? path.substring(1, path.length) : path
        path = path.endsWith('/') ? path.substring(0, path.length - 1) : path
        path = decodeURI(path)
        for (let item of CONFIG.ALLOWED_STATIC_FORMATS.keys()) {
            for(let folder of CONFIG.STATIC_PATHS){
                if (path.startsWith(folder) && path.endsWith(item)) {
                    fs.readFile(CONFIG.ROOT + "/" + path, (err, data) => {
                        if (!err) {
                            response.setHeader('Content-Type', CONFIG.ALLOWED_STATIC_FORMATS.get(item))
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
            path = path.startsWith('/') ? path.substring(1, path.length) : path
            path = path.endsWith('/') ? path.substring(0, path.length - 1) : path
            path = decodeURI(path)
            for (let item of CONFIG.ALLOWED_STATIC_FORMATS.keys()) {
                for (let folder of CONFIG.STATIC_PATHS) {
                    if (path.startsWith(folder) && path.endsWith(item)) {
                        fs.readFile(CONFIG.ROOT + "/" + path, (err, data) => {
                            if (!err) {
                                response.setHeader('Content-Type', CONFIG.ALLOWED_STATIC_FORMATS.get(item))
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
                let ref = request.headers['x-forwarded-host']
                ref = ref ?? request.headers['host']
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
                        if (!fs.existsSync(CONFIG.ROOT + '/controllers/' + route[0] + 'Controller.js')) {
                            response.statusCode = 404
                            response.end()
                            throw new Error('Не найден контроллер для запроса')
                        }

                        let classController = (await import(url.pathToFileURL(CONFIG.ROOT).href + '/controllers/' + route.shift() + 'Controller.js')).default
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

    constructor(routes) {
        this.#routes = routes
    }

    /**@param {SocketClient} client */
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
                        if (!fs.existsSync(CONFIG.ROOT + '/controllers/' + route[0] + 'Controller.js')) {
                            client.send({ success: 0, message: "Неверные данные запроса" })
                            return
                        }
                        let classController = (await import(url.pathToFileURL(CONFIG.ROOT).href + '/controllers/' + route.shift() + 'Controller')).default
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

class Middle {

    /**
     * 
     * @param {Number} port 
     * @returns {boolean} Возвращает true в случае успешного выполнения, иначе false
     * @desc Записывает порт, который уже используется, в файл на сервере и сохраняет
     */
    addClosePort(port = -1) {
        try{
            if (fs.existsSync(CONFIG.ROOT + '/core/settings/close-ports.json')) {
                let ports = JSON.parse(fs.readFileSync(CONFIG.ROOT + '/core/settings/close-ports.json', 'utf-8'))
                let check = false
                for (let item of ports.ports) {
                    if (Number(item) == port) {
                        check = true
                        break
                    }
                }
                port = port == -1 ? CONFIG.PORT : port
                if (!check) {
                    ports.ports.push(CONFIG.PORT)
                    JSON.stringify(ports)
                    fs.writeFileSync(CONFIG.ROOT + '/core/settings/close-ports.json', JSON.stringify(ports))
                }
                return true
            }
            return false
        }catch(err){
            Logger.error('Middle',err)
            return false
        }
        
    }


    /**
     * @async
     * @param {String} to 
     * Адрес куда отправить письмо
     * @param {String} subject 
     * От кого письмо
     * @param {String} text 
     * Текст письма
     * @returns {Promise<boolean>} Возвращает true в случае успешной отправки либо false
     * @desc Отправляет письмо по указанному адресу через nodemailer
     */
    async mail(to, subject, text) {
        let transporter = nodemailer.createTransport({
            host: CONFIG.MAIL_HOST,
            port: CONFIG.MAIL_PORT,
            secure: CONFIG.MAIL_SECURE,
            auth: {
                user: CONFIG.MAIL_USER,
                pass: CONFIG.MAIL_PASS,
            },
        })
        try {
            let info = await transporter.sendMail({
                from: `"${CONFIG.SITE_NAME}" <${CONFIG.MAIL_USER}>`, // sender address
                to: to.toString(), // list of receivers
                subject: subject, // Subject line
                html: text, // html body
            })
            if (info.hasOwnProperty('accepted')) {
                if (info.accepted.length > 0) return true
                else return false
            } else return false
        } catch (err) {
            Logger.error('Middle',err)
            return false
        }

    }

    /**
     * @async
     * @param {String} path 
     * Путь до HTML-шаблона
     * @param {Object} param 
     * Объект с параметрами которые используется для подстановки в шаблон
     * @returns {Promise}
     * @desc Рендерит HTML-шаблон .html и возвращает его через Promise
     */

    render(path, param = null) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(path)) reject(false)
            param = param != null ? { domain: CONFIG.DOMAIN, root: param } : { domain: CONFIG.DOMAIN }
            Nun.render(path, param, (err, html) => {
                if (err) reject(err)
                resolve(html)
            })
        })
    }

    jsonMapReplacer(key, value){
        if (value instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries()), 
            };
        } else {
            return value
        }
    }

    jsonMapReviewer(key, value) {
        if(typeof value === 'object' && value !== null) {
            if (value.dataType === 'Map') {
                return new Map(value.value)
            }
        }
        return value
    }
}

export class HttpClient extends Middle {
    request
    response
    /** @type {Token}*/
    token
    /** @type {Translate}*/
    translate
    input = {}
    os = 'Unknown'
    ip = null
    #methods
    #useCookie

    constructor(req, res, methods ,useCookie = true) {
        super()
        this.request = req
        this.response = res
        this.#methods=methods
        this.#useCookie=useCookie
    }

    async init(){
        try{
            let input = await this.getInput(this.#methods)
            if (this.#useCookie) 
                Cookie.init(this.request, this.response)
            let sesId = this.#useCookie&&Cookie.isset('ses-id')?Cookie.get('ses-id'):(input.hasOwnProperty('sesId')?input.sesId:null)
            await Session.init(sesId, true)
            this.token = new Token()
            this.translate = new Translate()
        }catch(err){
            throw err
        }
    }
    /**
     * 
     * @param {String} method 
     * Метод отправки данных http (POST,GET и т.д.)
     * @desc Получает входящие данные указанным методом (по умолчанию POST)  и устанавливает их в свойство input объекта, так же получает и устанавливает свойства ip и os
     */
    async getInput(method) {
        let input = new InputHttp(this.request)
        if (Array.isArray(method)) {
            for (let item of method) {
                let inputData = await input.getData(item)
                inputData = input.stripTags(inputData)
                this.input = Object.assign(this.input, inputData)
            }
        } else {
            this.input = await input.getData(method)
        }
        this.input = input.getUserData(this.input)
        this.os = input.getOs()
        this.ip = input.getIp()
        Logger.debug('HttpClient',"HttpClient.getInput()",this.input)
        return this.input
    }

    /**
     * 
     * @param {String} path 
     * Путь до HTML-шаблона
     * @param {Object} param 
     * Объект с параметрами которые используется для подстановки в шаблон
     * @desc Рендерит HTML-шаблон .html и отправляет клиенту
     */
    view(path, param = null) {
        param = param != null ? { domain: CONFIG.DOMAIN, p: param } : { domain: CONFIG.DOMAIN}
        Nun.render(path, param, (err, html) => {
            if (err == null) {
                this.response.write(html)
                this.response.end()
            } else {
                Logger.error("HttpClient.view()",err)
            }
        })
    }

    /**
     * 
     * @param {Object} data 
     * @desc Отправляет клиенту данные в JSON формате через HTTP
     */
    sendResponse(data) {
        this.response.write(JSON.stringify(data,this.jsonMapReplacer))
        this.response.end()
    }


    /**
     * 
     * @param {String} addr 
     * @desc
     * Переадресует запрос по указанному адресу, устанавливает заголовок 301
     */
    redirect(addr) {
        this.response.writeHead(301, { 'Location': addr })
        this.response.end()
        Logger.debug('HttpClient','',addr)
    }
}

export class SocketClient extends Middle {
    /** @type {Token}*/
    token
    /** @type {Translate}*/
    translate
    input = {}
    client
    type
    emitter
    #router
    #routes


    constructor(client, routes) {
        super()
        this.client = client
        this.#routes = routes
        this.emitter = new EventEmitter()
        this.token = new Token()
        this.translate = new Translate()
        client.on('message', async message => {
            let data
            if (typeof message == 'string') {
                data = JSON.parse(message)
            } else {
                data = JSON.parse(new TextDecoder().decode(message))
            }
            let sesId = null
            if (data.hasOwnProperty('sesId')) {
                sesId = data.sesId
            }
            await Session.init(CONFIG.ROOT, sesId)
            this.input = data;
            if (this.#router == null) {
                this.#router = new RouterSocket(this.#routes)
            }
            this.#router.start(this)

            //client.send(new TextEncoder().encode(JSON.stringify({success:1,message:"success"})));
        });
        client.on('close', () => {
            this.emitter.emit('close')
        });
    }

    /**
     * 
     * @param {Object} data 
     * @desc Делает рассылку в JSON формате всем подключенным клиентам из списка
     */
    broadcast(data) {
        this.emitter.emit('broadcast', data)
    }

    /**
     * 
     * @param {Object} data 
     * @desc Отправляет клиенту данные в JSON формате через WebSocket
     */
    send(data) {
        this.client.send(new TextEncoder().encode(JSON.stringify(data)))
    }
}