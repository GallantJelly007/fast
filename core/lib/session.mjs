//@ts-check

import * as crypto from 'crypto'
import Cookie from './cookie.mjs'
import Logger from './logger.mjs'
import * as fs from 'fs'
import Time from 'timelex'


export default class Session {
    static #sessionStorage = new Map();
    static #sesId;
    static isStart = false;
    static #CONFIG;
    static #csrfToken
    static #csrfCreate

    static get csrfToken(){
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
     * Функция инициализации сессии
     * @param {*} sesId 
     * Идентификатор сессии если он известен
     * @param {*} setCookie 
     * Параметр вкл/откл отправку идентификатора сессии в Cookie
     * @returns {Promise<boolean>}
     * 
     */
    static init(sesId = null, setCookie = false) {
        return new Promise(async (resolve,reject)=>{
            try{
                if (!fs.existsSync(Session.#CONFIG.SESSION_PATH)) {
                    fs.mkdir(Session.#CONFIG.SESSION_PATH,{recursive: true}, (err) => {
                        if (err) reject(err)
                    });
                }
                if (sesId != null) {
                    this.#sesId = sesId;
                    await this.#restore();
                } else {
                    this.#sesId = this.genId();
                }
                if (setCookie) 
                    Cookie.set('ses-id', this.#sesId)
                if (!this.isset('csrf_key')) {
                    let csrfKey = Session.hash(20, 'all')
                    this.set('csrf_key', csrfKey)
                    this.#csrfToken = this.genCsrf(csrfKey)
                }
                this.isStart = true
                resolve(true)
            }catch(err){
                reject(err)
            }
        })
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
     * Функция для генерации нового CSRF-токена
     * @param {string} csrfKey 
     * Ключ для подписи токена
     * @returns {string|undefined}
     * Возвращает новый CSRF-токен
     */
    static genCsrf(csrfKey) {
        try{
            let time = new Time()
            this.#csrfCreate = time.timestamp
            let data = {
                id: this.#sesId,
                create: time.timestamp
            }
            return crypto.createHmac('sha512', csrfKey).update(JSON.stringify(data)).digest('hex')
        }catch(err){
            Logger.error('Session.genCsrf()',err)
        }
    }

    /**
     * Функция для проверки CSRF-токена
     * @param {string} token 
     * Проверяемый CSRF-токен
     * @returns {boolean|undefined}
     * Возвращает логический результат, true - если токен действителен
     */
    static verifyCsrf(token) {
        try{
            if (this.isStart) {
                if(this.isset('csrf_key')){
                    let key = this.get('csrf_key')
                    let data = {
                        id:this.#sesId,
                        create:this.#csrfCreate
                    }
                    if(key!=null){
                        let sign = crypto.createHmac('sha512', key).update(JSON.stringify(data)).digest('hex')
                        if (token != sign) return false
                        else return true
                    }
                    return false
                }
                return false
            } else {
                return false
            }
        }catch(err){
            Logger.error('Session.verifyCsrf()',err)
        }
    }

    /**
     * Функция для установки и сохранения значения в сессии
     * @param {string} name 
     * Наименование параметра
     * @param {any} value 
     * Значение параметра
     * @returns {Promise<boolean|undefined>}
     */
    static async set(name, value) {
        try{
            this.#sessionStorage.set(name, value);
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
    static async unset(name) {
        try{
            if (this.#sessionStorage.has(name)) {
                this.#sessionStorage.delete(name);
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
    static isset(name) {
        return this.#sessionStorage.has(name);
    }

    /**
     * Функция получения значения(-й) из сессии
     * @param {string} name 
     * Наименование параметра в сессии
     * @returns {string|null}
     */
    static get(name = '') {
        if(this.#sessionStorage.has(name))
            return this.#sessionStorage.get(name)
        else 
            return null
    }

    static getAll(){
        return this.#sessionStorage
    }

    /**
     * Функция для сохранения временных значения в файле сессии
     * @returns {Promise<boolean>}
     */
    static #save() {
        return new Promise((resolve,reject)=>{
            try {
                let obj
                let data = Object.fromEntries(this.#sessionStorage)
                let time = new Time()
                if (fs.existsSync(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`)) {
                    fs.readFile(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`, 'utf-8',(err,data)=>{
                        if(err!=null) reject(err)
                        obj = JSON.parse(data);
                        obj.data = data
                        obj.update = time.timestamp
                        fs.writeFile(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`, JSON.stringify(obj),(err)=>{
                            if(err!=null) reject(err)
                            else resolve(true)
                        });
                    })
                } else {
                    obj = { data: data, create: time, update: time.timestamp };
                    fs.writeFile(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`, JSON.stringify(obj),(err)=>{
                        if(err!=null) reject(err)
                        else resolve(true)
                    });
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
    static close() {
        return new Promise((resolve,reject)=>{
            try{
                if (fs.existsSync(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`)) {
                    fs.unlink(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`,()=>{
                        this.#sessionStorage = new Map();
                        this.#sesId = this.genId();
                        resolve(true)
                    });
                }
            }catch(err){
                reject(err)
            }
        })
    }

    /**
     * Функция для очистки данных текущей сессии
     * @returns {Promise<boolean>}
     */
    static clean() {
        return new Promise((resolve,reject)=>{
            try{
                if (fs.existsSync(Session.#CONFIG.SESSION_PATH)) {
                    fs.readdir(Session.#CONFIG.SESSION_PATH, { withFileTypes: true },(err,files)=>{
                        if(err!=null) reject(err)
                        for (let file of files) {
                            let path = `${Session.#CONFIG.SESSION_PATH}/${file.name}`
                            let obj = JSON.parse(fs.readFileSync(path, 'utf-8'))
                            if (new Time(obj.update).minutesBetween(new Time()) > Session.#CONFIG.SESSION_STALE_TIME) {
                                fs.unlinkSync(path)
                            }
                        }
                    })
                }
                resolve(true)
            }catch(err){
                reject(err)
            }
        })
    }
    
    /**
     * Функция восстанавлиающая сессию (id) должен быть зараннее задан
     * @returns {Promise<boolean>}
     */
    static #restore() {
        return new Promise((resolve,reject)=>{
            try{
                if (fs.existsSync(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`)) {
                    fs.readFile(`${Session.#CONFIG.SESSION_PATH}/${this.#sesId}.json`, 'utf-8',(err,data)=>{
                        if(err) reject(err)
                        let obj = JSON.parse(data)
                        this.#sessionStorage = new Map(Object.entries(obj.data));
                        resolve(true)
                    })
                } else {
                    this.#sessionStorage = new Map();
                    resolve(true)
                }
            }catch(err){
                reject(err)
            }
        })
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
    * @static
    */
    static hash(length, type = 'all') {
        let chars, result = '';
        switch (type) {
            case 'chars': chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                break;
            case 'caps-chars': chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                break;
            case 'numbers': chars = '0123456789';
                break;
            case 'chars-numbers': chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                break;
            case 'code': chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                break;
            case 'all': chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@_';
                break;
            default: chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@_';
                break;
        }
        for (let i = 0; i < length; i++) {
            result += chars[Math.round(Math.random() * length)];
        }
        return result;
    }
}