//@ts-check
import Token from './token.mjs'
import Cookie from './cookie.mjs'
import Translate from './translate.mjs'
import Session from './session.mjs'
import { Input, InputHttp } from './input.mjs'
import Logger from './logger.mjs'
import { RouterSocket } from './router.mjs'

import * as fs from 'fs'
import * as nodemailer from 'nodemailer'
import { EventEmitter } from 'events'
import Nun from 'nunjucks'
import path from 'path'
import {Jax} from 'jaxfis'


export class Middle {

    static #CONFIG

    static async setConfig(pathToConfig){
        try{
            Middle.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('Middle.setConfig()',error)
        }
        await HttpClient.setConfig(pathToConfig)
        await SocketClient.setConfig(pathToConfig)
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
        try {
            let transporter = nodemailer.createTransport({
                host: Middle.#CONFIG.MAIL_HOST,
                port: Middle.#CONFIG.MAIL_PORT,
                secure: Middle.#CONFIG.MAIL_SECURE,
                auth: {
                    user: Middle.#CONFIG.MAIL_USER,
                    pass: Middle.#CONFIG.MAIL_PASS,
                },
            })
            let info = await transporter.sendMail({
                from: `"${Middle.#CONFIG.SITE_NAME}" <${Middle.#CONFIG.MAIL_USER}>`, // sender address
                to: to.toString(), // list of receivers
                subject: subject, // Subject line
                html: text, // html body
            })
            if (info.hasOwnProperty('accepted')) {
                if (info.accepted.length > 0) return true
                else return false
            } else return false
        } catch (err) {
            Logger.error('Middle.mail()',err)
            return false
        }
    }

    /**
     * 
     * @param {Number} port 
     * @returns {boolean} Возвращает true в случае успешного выполнения, иначе false
     * @desc Записывает порт, который уже используется, в файл на сервере и сохраняет
     */
    addClosePort(port = -1) {
        try{
            if (fs.existsSync(Middle.#CONFIG.ROOT + '/core/settings/close-ports.json')) {
                let ports = JSON.parse(fs.readFileSync(Middle.#CONFIG.ROOT + '/core/settings/close-ports.json', 'utf-8'))
                let check = false
                for (let item of ports.ports) {
                    if (Number(item) == port) {
                        check = true
                        break
                    }
                }
                port = port == -1 ? Middle.#CONFIG.PORT : port
                if (!check) {
                    ports.ports.push(Middle.#CONFIG.PORT)
                    JSON.stringify(ports)
                    fs.writeFileSync(Middle.#CONFIG.ROOT + '/core/settings/close-ports.json', JSON.stringify(ports))
                }
                return true
            }
            return false
        }catch(err){
            Logger.error('Middle',err)
            return false
        }
    }
}

export class HttpClient extends Middle {

    static #CONFIG
    request
    response
    /** @type {Token}*/
    token
    /** @type {Translate}*/
    translate
    input = {}
    uploadFiles = []
    os = 'Unknown'
    ip
    cookie
    session
    #methods
    #useCookie

    static #responseTypes = {
        JSON:'json',
        TEXT:'text',
        HTML:'html',
        BUFFER:'buffer'
    }

    static get RESPONSE_TYPES(){
        return HttpClient.#responseTypes
    }
    
    static async setConfig(pathToConfig){
        try{
            HttpClient.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('HttpClient.setConfig()',error)
        }
    }
 
    /**
     * 
     * @param {String} pathFile 
     * Путь до HTML-шаблона
     * @param {Object} params 
     * Объект с параметрами которые используется для подстановки в шаблон
     * @desc Рендерит HTML-шаблон .html
     */
    static #baseRender(request, pathFile, params = null) {
        return new Promise((resolve, reject) => {
            try {
                if(typeof pathFile != 'string')
                    reject(false)
                pathFile = path.isAbsolute(pathFile) ? pathFile : path.normalize(path.resolve(HttpClient.#CONFIG.ROOT,pathFile)).replace(/\\/g,'/')
                if (!fs.existsSync(pathFile)) 
                    reject(false)
                let host = request.headers['x-forwarded-host']
                host = host ?? request.headers['host']
                let domain = HttpClient.#CONFIG.DOMAIN
                let incomingDomainReg = new RegExp(`^${host.split(':').shift()}`)
                if (incomingDomainReg.test(HttpClient.#CONFIG.DOMAIN_NAME))
                    domain = `${HttpClient.#CONFIG.PROTOCOL}://${host}`
                params = params ? { domain: domain, params } : { domain: domain }
                Nun.render(pathFile, params, (err, html) => {
                    if (err) {
                        Logger.error('HttpClient.baseRender()', err)
                        reject(false)
                    }
                    resolve(html)
                })
            } catch (err) {
                Logger.error('HttpClient.baseRender()', err)
                reject(false)
            }
        })
    }

    /**
     * 
     * @param {Object} params 
     * Праметры ответа
     * @param {any} [params.data]
     * @param {string} [params.pathFile]
     * @param {string} [params.type]
     * @param {number} [params.code]
     * @param {BufferEncoding} [params.encoding]
     * Кодировка для преобразования в текстовый формат (по умолчанию: UTF-8)
     * @desc Отправляет клиенту данные в текстовом формате через HTTP
     */
    static async #baseResponse(request, response, params={data:undefined, pathFile:'', code:200 ,type:undefined, encoding:'utf-8'}) {
        try{
            let contentType, contentLength, data
            if(params?.type){
                let encoding = params?.encoding ? params.encoding : 'utf-8'
                switch(params.type){
                    case HttpClient.RESPONSE_TYPES.JSON:
                        contentType = `application/json; charset=${encoding}`
                        if(typeof params?.pathFile === 'string'){
                            let pathFile = path.isAbsolute(params.pathFile) 
                                        ? params.pathFile 
                                        : path.normalize(path.resolve(HttpClient.#CONFIG.ROOT, params.pathFile)).replace(/\\/g,'/')
                            if(fs.existsSync(pathFile)){
                                data = fs.readFileSync(pathFile,{encoding})
                                contentLength = Buffer.from(data,encoding).length
                            }
                        }else if(params?.data){
                            data = typeof params.data === 'string' ? params.data : JSON.stringify(params.data, Jax.jsonMapReplacer)
                            contentLength = Buffer.from(data,encoding).length
                        }
                        break
                    case HttpClient.RESPONSE_TYPES.BUFFER:
                        contentType = `application/octet-stream`
                        if(typeof params?.pathFile === 'string'){
                            let pathFile = path.isAbsolute(params.pathFile) 
                                        ? params.pathFile 
                                        : path.normalize(path.resolve(HttpClient.#CONFIG.ROOT, params.pathFile)).replace(/\\/g,'/')
                            if(fs.existsSync(pathFile)){
                                data = fs.readFileSync(pathFile)
                                contentLength = data.length
                            }
                        }else if(params?.data){
                            data = params?.data instanceof Buffer || params?.data instanceof Uint8Array ? params.data : Buffer.from(JSON.stringify(params.data, Jax.jsonMapReplacer), encoding)
                            contentLength = data.length
                        }
                        break
                    case HttpClient.RESPONSE_TYPES.HTML:
                        contentType = `text/html; charset=${encoding}`
                        if(typeof params?.pathFile === 'string'){
                            let pathFile = path.isAbsolute(params.pathFile) 
                                        ? params.pathFile 
                                        : path.normalize(path.resolve(HttpClient.#CONFIG.ROOT, params.pathFile)).replace(/\\/g,'/')
                            if(fs.existsSync(pathFile)){
                                let res = await HttpClient.#baseRender(request,pathFile,params?.data)
                                if(res)
                                    data = res
                            }
                        }else if(params?.data && typeof params?.data === 'string'){
                            data = params.data
                            contentLength = Buffer.from(data,encoding).length
                        }
                        break
                    case HttpClient.RESPONSE_TYPES.TEXT:
                        contentType = `text/plain; charset=${params.encoding}`
                        if(typeof params?.pathFile === 'string'){
                            let pathFile = path.isAbsolute(params.pathFile) 
                                        ? params.pathFile 
                                        : path.normalize(path.resolve(HttpClient.#CONFIG.ROOT, params.pathFile)).replace(/\\/g,'/')
                            if(fs.existsSync(pathFile)){
                                data = fs.readFileSync(pathFile,{encoding})
                                contentLength = Buffer.from(data,encoding).length
                            }
                        }else if(params?.data){
                            data = typeof params.data === 'string'? params.data :(typeof params.data.toString === 'function'? params.data.toString() : '')
                            contentLength = Buffer.from(data,encoding).length
                        }
                        break
                    default:
                        contentType = `*/*`
                        break
                }
            }
            if(contentType)
                response.setHeader('Content-Type', contentType)
            if (contentLength)
                response.setHeader('Content-Length', contentLength)
            if (params?.code && typeof params.code === 'number' && params.code>99)
                response.statusCode = params.code
            if (data)
                response.write(data)
            response.end()
            return true
        }catch(err){
            Logger.error('HttpClient.baseResponse()',err)
            return false
        }
    }

    /**
     * @param {*} response 
     * @param {String} addr 
     * @desc
     * Переадресует запрос по указанному адресу, устанавливает заголовок 301
     */
    static #baseRedirect(response, addr) {
        try{
            if(typeof addr === 'string'){
                response.writeHead(301, { 'Location': addr })
                response.end()
                Logger.debug('HttpClient.baseRedirect()','',addr)
            }else{
                throw new Error(`Addr param haven't correct format!`)
            }
        }catch(err){
            Logger.error('HttpClient.baseRedirect()',err)
        }
    }

    static view(request, response, pathFile, params = null){
        return HttpClient.#baseResponse(request,response, {
            data:params,
            pathFile:pathFile,
            type:HttpClient.RESPONSE_TYPES.HTML
        })
    }

    static render(request, pathFile, param = null){
        return HttpClient.#baseRender(request, pathFile ,param)
    }

    /**
     * 
     * @param {*} response 
     * @param {Object} [params]
     * @param {any|undefined} [params.data]
     * @param {string} [params.type]
     * @param {number} [params.code]
     * @param {BufferEncoding} [params.encoding]
     */
    static send(request, response, params){
        return HttpClient.#baseResponse(request, response, params)
    }

    /**
     * @param {*} response
     * @param {string} addr 
     */
    static redirect(response, addr){
        HttpClient.#baseRedirect(response, addr)
    }

    constructor(req, res, methods, useCookie = true) {
        super()
        this.request = req
        this.response = res
        this.#methods=methods
        this.#useCookie=useCookie
    }

    async init(){
        try{
            let input = await this.getInput(this.#methods)
            if(!input)
                throw new Error('Не удалось получить входные данные input')
            if (this.#useCookie) 
                this.cookie = new Cookie(this.request, this.response)
            let sesId = this.#useCookie&&this.cookie.isset('ses-id')?this.cookie.get('ses-id'):(input.hasOwnProperty('sesId')?input.sesId:null)
            if(HttpClient.#CONFIG.SESSION_ENABLED){
                this.session = new Session()
                await this.session.init(sesId, this.cookie)
            }
            this.token = new Token()
            this.translate = new Translate()
            return true
        }catch(err){
            Logger.error('HttpClient.init()', err)
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
        try{
            let input = new InputHttp(this.request)
            let methodName = this.request.method.toLowerCase()
            let isGetData = false
            if (Array.isArray(method)) {
                isGetData = method.includes(methodName)
            } else {
                isGetData = method == methodName
            }
            if (isGetData) {
                let inputData = await input.getData(methodName)
                if(inputData.fields){
                    inputData.fields = input.stripTags(inputData.fields)
                    this.input = inputData.fields
                }
                if (inputData.files && inputData.files.length) {
                    this.uploadFiles = inputData.files
                }
            }
            this.os = input.getOs()
            this.ip = input.getIp()
            Logger.debug('HttpClient', "HttpClient.getInput() | Fields", this.input)
            Logger.debug('HttpClient', "HttpClient.getInput() | Files", this.uploadFiles)
            return this.input
        }catch(err){
            Logger.error('HttpClient.getInput()',err)
        }
    }

    /**
    * @async
    * @param {String} pathFile 
    * Путь до HTML-шаблона
    * @param {Object} param 
    * Объект с параметрами которые используется для подстановки в шаблон
    * @returns {Promise<any|undefined>}
    * @desc Рендерит HTML-шаблон .html и возвращает его через Promise
    */
    render(pathFile, param = null){
        return HttpClient.#baseRender(this.request, pathFile, param)
    }

    /**
     * 
     * @param {String} pathFile 
     * Путь до HTML-шаблона
     * @param {Object} params
     * Объект с параметрами которые используется для подстановки в шаблон
     * @desc Рендерит HTML-шаблон .html и отправляет клиенту
     */
    view(pathFile, params = null) { 
        return HttpClient.#baseResponse(this.request,this.response, {
            data:params,
            pathFile:pathFile,
            type:HttpClient.RESPONSE_TYPES.HTML
        })
    }

    /**
     * @param {Object} params 
     * @param {any|undefined} params.data
     * @param {string} params.type
     * @param {number} params.code
     * @param {BufferEncoding} params.encoding
     */
    send(params){
        return HttpClient.#baseResponse(this.request, this.response, params)
    }

    /**
     * @param {string} addr 
     */
    redirect(addr){
        HttpClient.#baseRedirect(this.response,addr)
    }

}

export class SocketClient extends Middle {

    static #CONFIG

    /** @type {Token}*/
    token
    /** @type {Translate}*/
    translate
    input = {}
    client
    type
    emitter
    session
    #router
    #routes

    static async setConfig(pathToConfig){
        try{
            SocketClient.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('SocketClient.setConfig()',error)
        }
    }

    constructor(client, routes) {
        super()
        this.client = client
        this.#routes = routes
        this.emitter = new EventEmitter()
        this.token = new Token()
        this.translate = new Translate()
        client.on('message', async message => {
            try{
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
                if (SocketClient.#CONFIG.SESSION_ENABLED){
                    this.session = new Session()
                    await this.session.init(sesId)
                }
                this.input = data
                if (this.#router == null) {
                    this.#router = new RouterSocket(this.#routes)
                }
                this.#router.start(this)
                //client.send(new TextEncoder().encode(JSON.stringify({success:1,message:"success"})));
            }catch(err){
                Logger.error('SocketClient.onmessage',err)
            }
        })
        client.on('close', () => {
            this.emitter.emit('close')
        })
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