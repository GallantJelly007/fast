//@ts-check

import * as crypto from 'crypto'
import Logger from './logger.mjs'

export default class Cookie {
    #request
    #response
    #cookieData = new Map()
    static #CONFIG

    static async setConfig(pathToConfig){
        try{
            Cookie.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('Cookie.setConfig()',error)
        }
    }

    /**
     * Инициализация механизма Cookie
     * @param {any} req 
     * Объект HTTP запроса
     * @param {any} res 
     * Объект HTTP ответа
     */
    constructor(req, res){
        this.#request = req
        this.#response = res
    }

    /**
     * Функция установки значения куки
     * @param {string} name 
     * @param {any} value 
     * @param {number|null} expires 
     * @param {string|null} domain 
     * @param {string|null} path 
     * @param {boolean} secure 
     * @param {boolean} httpOnly 
     * @param {string|null} sameSite 
     * @param {boolean} signed 
     * @returns 
     */
    set(name, value, expires = null, domain = null, path = null, secure = false, httpOnly = false, sameSite = null, signed = false) {
        try{
            if (signed) {
                let key = crypto.createHmac('sha256', Cookie.#CONFIG.COOKIE_PASS).update(name).digest('hex')
                name += '.' + key
            }
            if (value == null || value == undefined || value == '') 
                return false
            
            let data
            if (Array.isArray(value) || typeof value === 'object') 
                data = `"${encodeURIComponent(JSON.stringify(value))}"`
            else 
                data = `"${encodeURIComponent(value)}"`
            let cookie = `${name}=${data}`
            if (expires != null) cookie += `; Expires=${new Date(expires).toUTCString()}`
            if (domain != null) cookie += `; Domain=${domain}`
            if (path != null) cookie += `; Path=${path}`
            if (secure) cookie += '; Secure'
            if (httpOnly) cookie += '; HttpOnly'
            if (sameSite != null) cookie += `; SameSite = ${sameSite}`
            this.#cookieData.set(name, cookie)
            data = Array.from(this.#cookieData.values())
            this.#response.setHeader('Set-Cookie', data)
            return true
        }catch(err){
            Logger.error('Cookie.set()', err)
            return false
        }
    }

    /**
     * Функция для проверки существования значения в куки
     * @param {string} name 
     * Наименование поля
     * @returns 
     */
    isset(name) {
        try{
            let cookies = this.#request.headers['cookie']
            if (cookies != undefined) {
                let reg = new RegExp(`${name}="([\\w\\W]+)"`, 'g')
                return reg.test(cookies)
            }
            return false
        }catch(err){
            Logger.error('Cookie.isset()', err)
            return false
        }
    }

    /**
     * Функция получения значения из куки
     * @param {string} name 
     * @returns {object|string|undefined} Возвращает объект либо строку из cookie если они есть, если нет то null
     */
    get(name) {
        try{
            let cookies = this.#request.headers['cookie']
            if (cookies != undefined) {
                let reg = new RegExp(`${name}="([\\w\\%\\[\\]\\{\\}\\#\\.\\,\\?\\$\\-\\+\\_\\'\\@]+)"`, 'g')
                let res = cookies.match(reg)
                if (res != null) {
                    reg = new RegExp(/"([\w\s\W\S]+)"/)
                    let obj = res[0].match(reg)
                    obj = decodeURIComponent(obj[1])
                    if (/\[[\w\s\W\S]+\]/.test(obj) || /\{[\w\s\W\S]+\}/.test(obj)) {
                        return JSON.parse(obj)
                    } else {
                        return obj
                    }
                }
            }
        }catch(err){
            Logger.error('Cookie.get()', err)
        }
    }

    /**
     * Функция для удаления параметра из Cookie
     * @param {string} name
     * Наименование параметра
     * @returns {boolean}
     * Если параметр был удален возвращает true, иначе false
     */
    delete(name) {
        try{
            let time = new Date(0).toUTCString()
            let cookie = `${name}=delete; Expires=${time}`
            this.#cookieData.set(name, cookie)
            let data = Array.from(this.#cookieData.values())
            this.#response.setHeader('Set-Cookie', data)
            return true
        }catch(err){
            Logger.error('Cookie.delete()', err)
            return false
        }
    }
}