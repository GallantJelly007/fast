//@ts-check

import * as fs from 'fs'
import Time from './time.js';
import CONFIG from '../settings/config.js';

export default class LocalStorage {
    static #storage;

    /**
     * Метод-псевдоним для restore
     */
    static init() {
        LocalStorage.restore()
    }

    /**
     * Функция записи значения в локальное хранилище
     * @param {string} name 
     * @param {any} value 
     * @returns 
     */
    static set(name, value) {
        this.#storage.set(name, value)
        this.save()
        return true
    }

    static unset(name) {
        if (this.#storage.has(name)) {
            this.#storage.delete(name)
            this.save()
            return true
        }
        return false
    }

    static isset(name) {
        return this.#storage.has(name)
    }

    static clean() {
        if (fs.existsSync(CONFIG.ROOT + '/storage/localStorage.json')) {
            fs.unlinkSync(CONFIG.ROOT + '/storage/localStorage.json')
            this.#storage = new Map()
        }
    }

    static get(name = null) {
        if (name == null) return this.#storage
        else return this.#storage.get(name)
    }

    static save() {
        return new Promise((resolve,reject)=>{
            try{
                let data = Object.fromEntries(this.#storage)
                let obj
                if (fs.existsSync(CONFIG.ROOT + '/storage/localStorage.json')) {
                    obj = JSON.parse(fs.readFileSync(CONFIG.ROOT + '/storage/localStorage.json', 'utf-8'));
                    obj.data = data
                    obj.update = new Time()
                } else {
                    let createTime = new Time()
                    obj = { data: data, create: createTime, update: createTime }
                }
                fs.writeFile(CONFIG.ROOT + '/storage/localStorage.json', JSON.stringify(obj),(err)=>{
                    if(err!=null) reject(err)
                    else resolve(true)
                })
            }catch(err){
                reject(err)
            }
        })
        
    }
    static restore() {
        if (fs.existsSync(CONFIG.ROOT + '/storage/localStorage.json')) {
            let obj = JSON.parse(fs.readFileSync(CONFIG.ROOT + '/storage/localStorage.json', 'utf-8'));
            this.#storage = new Map(Object.entries(obj.data))
        } else {
            this.#storage = new Map()
        }
    }
}