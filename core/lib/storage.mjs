//@ts-check

import * as fs from 'fs'
import Time from 'timelex'
import Logger from './logger.mjs'

export default class LocalStorage {
    static #CONFIG
    static #storage

    static async setConfig(pathToConfig){
        try{
            LocalStorage.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('LocalStorage.setConfig()',error)
        }
    }

    /**
     * Метод для инициализации хранилища
     */
    static init() {
        try{
            if (!fs.existsSync(LocalStorage.#CONFIG.STORAGE_PATH)) {
                fs.mkdirSync(LocalStorage.#CONFIG.STORAGE_PATH,{recursive: true})
            }
            LocalStorage.#restore()
        }catch(err){
            Logger.error('Storage.init()',err)
        }
    }

    /**
     * Функция записи значения в локальное хранилище
     * @param {string} name 
     * @param {any} value 
     * @returns 
     */
    static set(name, value) {
        try{
            this.#storage.set(name, value)
            return this.#save()
        }catch(err){
            Logger.error('LocalStorage.set()', err)
            return false
        }
    }

    /**
     * Функция для удаления параметра из локального хранилища
     * @param {string} name 
     * Наименование параметра в локальном хранилище
     * @returns {Promise<boolean>}
     */
    static async unset(name) {
        try{
            if (this.#storage.has(name)) {
                this.#storage.delete(name)
                if(this.#save()) return true
                else return false
            }
            return false
        }catch(err){
            Logger.error('LocalStorage.unset()', err)
            return false
        }
    }

    /**
     * Функция для проверки существования параметра в локальном хранилище
     * @param {string} name 
     * @returns {boolean}
     */
    static isset(name) {
        return this.#storage.has(name)
    }

    /**
     * Функция для очистки и удаления локального хранилища
     * @returns {boolean}
     */
    static clean() {
        try {
            if (fs.existsSync(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`)) {
                fs.unlinkSync(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`)
                this.#storage = new Map()
                return true
            } else {
                return false
            }
        } catch (err) {
            Logger.error('LocalStorage.clean()', err)
            return false
        }
    }

    /**
     * 
     * @param {string|null} name 
     * Наименование параметра в локальном хранилище
     * @returns {any}
     * Возвращает значение параметра по его имени если оно передано, либо все хранилище 
     */
    static get(name = '') {
        return this.#storage.get(name)
    }

    static getAll(){
        return new Map(this.#storage)
    }

    static #save() {
        try {
            let data = Object.fromEntries(this.#storage)
            let obj
            if (fs.existsSync(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`)) {
                obj = JSON.parse(fs.readFileSync(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`, { encoding: 'utf-8' }))
                obj.data = data
                obj.update = new Time()
            } else {
                let createTime = new Time()
                obj = { data: data, create: createTime, update: createTime }
            }
            fs.writeFileSync(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`, JSON.stringify(obj))
            return true
        } catch (err) {
            Logger.error('LocalStorage.save()', err)
            return false
        }
    }
    
    static #restore() {
        try{
            if (fs.existsSync(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`)) {
                let obj = JSON.parse(fs.readFileSync(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`, {encoding:'utf-8'}))
                this.#storage = new Map(Object.entries(obj.data))
            } else {
                this.#storage = new Map()
            }
        }catch(err){
            Logger.error('LocalStorage.restore()', err)
            this.#storage = new Map()
        }
    }
}