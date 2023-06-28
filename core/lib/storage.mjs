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
        this.#storage.set(name, value)
        this.#save()
        return true
    }

    /**
     * Функция для удаления параметра из локального хранилища
     * @param {string} name 
     * Наименование параметра в локальном хранилище
     * @returns {Promise<boolean>}
     */
    static async unset(name) {
        if (this.#storage.has(name)) {
            this.#storage.delete(name)
            if(await this.#save()) return true
            else return false
        }
        return false
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
     * Асинхронная функция для очистки и удаления локального хранилища
     * @returns {Promise<boolean>}
     */
    static clean() {
        return new Promise((resolve,reject)=>{
            try{
                if (fs.existsSync(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`)) {
                    fs.unlink(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`,()=>{
                        this.#storage = new Map()
                        resolve(true)
                    })
                }else{
                    resolve(false)
                }
            }catch(err){
                reject(err)
            }
        })
    }

    /**
     * 
     * @param {string|null} name 
     * Наименование параметра в локальном хранилище
     * @returns {any}
     * Возвращает значение параметра по его имени если оно передано, либо все хранилище 
     */
    static get(name = null) {
        if (name == null) return this.#storage
        else return this.#storage.get(name)
    }

    static #save() {
        return new Promise((resolve,reject)=>{
            try{
                let data = Object.fromEntries(this.#storage)
                let obj
                if (fs.existsSync(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`)) {
                    obj = JSON.parse(fs.readFileSync(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`, 'utf-8'));
                    obj.data = data
                    obj.update = new Time()
                } else {
                    let createTime = new Time()
                    obj = { data: data, create: createTime, update: createTime }
                }
                fs.writeFile(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`, JSON.stringify(obj),(err)=>{
                    if(err!=null) reject(err)
                    else resolve(true)
                })
            }catch(err){
                reject(err)
            }
        })    
    }
    
    static #restore() {
        try{
            if (fs.existsSync(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`)) {
                let obj = JSON.parse(fs.readFileSync(`${LocalStorage.#CONFIG.STORAGE_PATH}/localStorage.json`, 'utf-8'));
                this.#storage = new Map(Object.entries(obj.data))
            } else {
                this.#storage = new Map()
            }
        }catch(err){
            throw err
        }
    }
}