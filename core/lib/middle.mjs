//@ts-check
import Token from './token.mjs'
import Cookie from './cookie.mjs'
import Translate from './translate.mjs'
import Session from './session.mjs'
import { InputHttp } from './input.mjs'
import Logger from './logger.mjs'
import { RouterSocket } from './router.mjs'

import * as fs from 'fs'
import * as nodemailer from 'nodemailer'
import { EventEmitter } from 'events'
import Nun from 'nunjucks'
import path from 'path'


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
            host: Middle.#CONFIG.MAIL_HOST,
            port: Middle.#CONFIG.MAIL_PORT,
            secure: Middle.#CONFIG.MAIL_SECURE,
            auth: {
                user: Middle.#CONFIG.MAIL_USER,
                pass: Middle.#CONFIG.MAIL_PASS,
            },
        })
        try {
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
            Logger.error('Middle',err)
            return false
        }

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
    #methods
    #useCookie
    
    static async setConfig(pathToConfig){
        try{
            HttpClient.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('HttpClient.setConfig()',error)
        }
    }

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
            if(HttpClient.#CONFIG.SESSION_ENABLED)
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
        }catch(err){
            Logger.error('HttpClient.getInput()',err)
        }
        return this.input
    }

    /**
    * @async
    * @param {String} pathFile 
    * Путь до HTML-шаблона
    * @param {Object} param 
    * Объект с параметрами которые используется для подстановки в шаблон
    * @returns {Promise}
    * @desc Рендерит HTML-шаблон .html и возвращает его через Promise
    */
    render(pathFile, param = null) {
        if (!(path.normalize(pathFile + '/') === path.normalize(path.resolve(pathFile) + '/'))) {
            pathFile = path.resolve(HttpClient.#CONFIG.ROOT, pathFile)
        }
        let host = this.request.headers['x-forwarded-host']
        host = host ?? this.request.headers['host']
        let domain = HttpClient.#CONFIG.DOMAIN
        let incomingDomainReg = new RegExp(`^${host.split(':').shift()}`)
        console.log(incomingDomainReg)
        if(incomingDomainReg.test(HttpClient.#CONFIG.DOMAIN_NAME))
            domain = `${HttpClient.#CONFIG.PROTOCOL}://${host}`
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(pathFile)) reject(false)
            param = param != null ? { domain: domain, root: param } : { domain: domain }
            Nun.render(pathFile, param, (err, html) => {
                if (err) reject(err)
                resolve(html)
            })
        })
    }

    /**
     * 
     * @param {String} pathFile 
     * Путь до HTML-шаблона
     * @param {Object} param 
     * Объект с параметрами которые используется для подстановки в шаблон
     * @desc Рендерит HTML-шаблон .html и отправляет клиенту
     */
    view(pathFile, param = null) { //Неполадки с путями
        if(!(path.normalize(pathFile + '/') === path.normalize(path.resolve(pathFile) + '/'))){
            pathFile = path.resolve(HttpClient.#CONFIG.ROOT,pathFile)
        }
        let host = this.request.headers['x-forwarded-host']
        host = host ?? this.request.headers['host']
        let domain = HttpClient.#CONFIG.DOMAIN
        let incomingDomainReg = new RegExp(`^${host.split(':').shift()}`)
        console.log(incomingDomainReg)
        if(incomingDomainReg.test(HttpClient.#CONFIG.DOMAIN_NAME))
            domain = `${HttpClient.#CONFIG.PROTOCOL}://${host}`
        param = param != null ? { domain: domain, p: param } : { domain: domain}
        Nun.render(pathFile, param, (err, html) => {
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

    static #CONFIG

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
            if(SocketClient.#CONFIG.SESSION_ENABLED)
                await Session.init(SocketClient.#CONFIG.ROOT, sesId)
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