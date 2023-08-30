//@ts-check

import * as crypto from 'crypto'
import Cookie from './cookie.mjs'
import Logger from './logger.mjs'
import Token from './token.mjs'
import * as fs from 'fs'
import Time from 'timelex'


export default class Session {
    static #CONFIG
    #sessionStorage = new Map()
    #sesId
    #csrfToken
    isStart = false

    get csrfToken(){
        return this.#csrfToken
    }

    static async setConfig(pathToConfig){
        try{
            Session.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('Session.setConfig()',error)
        }
    }

    /**
     * Функция для генерации валидного идентификатора сессии
     * @returns {string|undefined}
     */
    static genId() {
        try{
            let id
            do 
                id = crypto.randomUUID()
            while (fs.existsSync(`${Session.#CONFIG.SESSION_PATH}/${id}.json`))
            return id
        }catch(err){
            Logger.error('Session.genId()',err)
        }
    }

    /**
    * 
    * @param {Number} length 
    * @param {String} type 
    * @returns {String} Возвращает строку из разного набора символов указанной длинны
    * 
    * @desc ТИПЫ:
    * 
    * all - цифры,буквы и некоторые спец. символы
    * 
    * chars - буквы
    * 
    * caps-chars - буквы в верхнемрегистре
    * 
    * numbers - числа
    * 
    * code - буквы в верхнем регистре и числа
    */
    static hash(length, type = 'all') {
        let chars, result = ''
        switch (type) {
            case 'chars': chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
                break
            case 'caps-chars': chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                break
            case 'numbers': chars = '0123456789'
                break
            case 'chars-numbers': chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
                break
            case 'code': chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                break
            case 'all': chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@_'
                break
            default: chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@_'
                break
        }
        for (let i = 0; i < length; i++) {
            result += chars[Math.round(Math.random() * length)]
        }
        return result
    }

    /**
     * Функция инициализации сессии
     * @param {*} sesId 
     * Идентификатор сессии если он известен
     * @param {Cookie|null} cookie 
     * Параметр вкл/откл отправку идентификатора сессии в Cookie
     * @returns {Promise<boolean>}
     * 
     */
    init(sesId = null, cookie = null) {
        return new Promise(async (resolve,reject)=>{
            try{
                if (!fs.existsSync(Session.#CONFIG.SESSION_PATH)) {
                    fs.mkdirSync(Session.#CONFIG.SESSION_PATH,{recursive: true})
                }
                if (sesId != null) {
                    this.#sesId = sesId
                    if(!await this.#restore()){
                        throw new Error('Не удалось восстановить сессию!')
                    }
                } else {
                    this.#sesId = Session.genId()
                }
                if (cookie instanceof Cookie) 
                    cookie.set('ses-id', this.#sesId)
                if (!this.isset('csrf_key')) {
                    let csrfKey = Session.hash(20, 'all')
                    this.set('csrf_key', csrfKey)
                    let token = Token.generateCsrf(this.#sesId,csrfKey)
                    if(token){
                        this.#csrfToken = token.csrfToken
                        this.set('csrf_create', token.timeCreate)
                    }
                }
                this.isStart = true
                resolve(true)
            }catch(err){
                Logger.error('Session.init()',err)
                reject(err)
            }
        })
    }

    /**
     * Функция для установки и сохранения значения в сессии
     * @param {string} name 
     * Наименование параметра
     * @param {any} value 
     * Значение параметра
     * @returns {Promise<boolean|undefined>}
     */
    async set(name, value) {
        try{
            this.#sessionStorage.set(name, value)
            return this.#save()
        }catch(err){
            Logger.error('Session.set()',err)
        }
    }

    /**
     * Функция для удаления значения из сессии по ключу-имени
     * @param {string} name 
     * Наименование параметра
     * @returns {Promise<boolean|undefined>}
     */
    async unset(name) {
        try{
            if (this.#sessionStorage.has(name)) {
                this.#sessionStorage.delete(name)
                await this.#save()
                return true
            }
            return false
        }catch(err){
            Logger.error('Session.unset()',err)
        }
    }
    /**
     * Функция проверки существования параметра в сессии
     * @param {string} name
     * Наименование параметра в сессии 
     * @returns 
     */
    isset(name) {
        return this.#sessionStorage.has(name)
    }

    /**
     * Функция получения значения(-й) из сессии
     * @param {string} name 
     * Наименование параметра в сессии
     * @returns {string|undefined}
     */
    get(name = '') {
        return this.#sessionStorage.get(name)
    }

    getAll(){
        return new Map(this.#sessionStorage)
    }

    /**
     * Функция для сохранения временных значения в файле сессии
     * @returns {Promise<boolean>}
     */
    #save() {
        return new Promise((resolve,reject)=>{
            try {
                let obj
                let data = Object.fromEntries(this.#sessionStorage)
                let time = new Time()
                if (fs.existsSync(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`)) {
                    fs.readFile(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`, {encoding:'utf-8'},(err,data)=>{
                        if(err!=null) reject(err)
                        obj = JSON.parse(data)
                        obj.data = data
                        obj.update = time.timestamp
                        fs.writeFile(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`, JSON.stringify(obj),(err)=>{
                            if(err!=null) reject(err)
                            else resolve(true)
                        })
                    })
                } else {
                    obj = { data: data, create: time, update: time.timestamp }
                    fs.writeFile(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`, JSON.stringify(obj),(err)=>{
                        if(err!=null) reject(err)
                        else resolve(true)
                    })
                }
            } catch (err) {
                reject(err)
            }
        })
       
    }

    /**
     * Функция закрытия, удаления текущей сессии
     * @returns {Promise<boolean>}
     */
    close() {
        return new Promise((resolve,reject)=>{
            try{
                if (fs.existsSync(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`)) {
                    fs.unlink(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`,()=>{
                        this.#sessionStorage = new Map()
                        this.#sesId = Session.genId()
                        resolve(true)
                    })
                }
            }catch(err){
                Logger.error('Session.close()',err)
                resolve(false)
            }
        })
    }

    /**
     * Функция для очистки хранилища сессий
     * @returns {Promise<boolean>}
     */
    static clean() {
        return new Promise((resolve,reject)=>{
            try{
                if (fs.existsSync(Session.#CONFIG.SESSION_PATH)) {
                    fs.readdir(Session.#CONFIG.SESSION_PATH, { withFileTypes: true },(err,files)=>{
                        if(err) {
                            Logger.error('Session.clean()',err)
                            resolve(false)
                        }
                        for (let file of files) {
                            let path = `${Session.#CONFIG.SESSION_PATH}/${file.name}`
                            let obj = JSON.parse(fs.readFileSync(path, 'utf-8'))
                            if (new Time(obj.update).minutesBetween(new Time()) > Session.#CONFIG.SESSION_STALE_TIME) {
                                fs.unlinkSync(path)
                            }
                        }
                        resolve(true)
                    })
                }else{
                    resolve(false)
                }
            }catch(err){
                Logger.error('Session.clean()',err)
                resolve(false)
            }
        })
    }
    
    /**
     * Функция восстанавлиающая сессию (id) должен быть зараннее задан
     * @returns {Promise<boolean>}
     */
    #restore() {
        return new Promise((resolve,reject)=>{
            try{
                if (fs.existsSync(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`)) {
                    fs.readFile(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`, {encoding:'utf-8'},(err,data)=>{
                        if(err){
                            Logger.error('Session.restore()', err)
                            resolve(false)
                        }
                        let obj = JSON.parse(data)
                        this.#sessionStorage = new Map(Object.entries(obj.data))
                        resolve(true)
                    })
                } else {
                    this.#sessionStorage = new Map()
                    resolve(true)
                }
            }catch(err){
                Logger.error('Session.restore()', err)
                resolve(false)
            }
        })
    }
}