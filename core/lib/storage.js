//@ts-check

const fs = require('fs')

module.exports = class LocalStorage {
    static #ROOT='';
    static #storage;

    static init(root) {
        this.#ROOT = root
        LocalStorage.restore()
    }

    static isSetRoot(){
        return this.#ROOT==''?false:true
    }

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
        if (fs.existsSync(this.#ROOT + '/storage/localStorage.json')) {
            fs.unlinkSync(this.#ROOT + '/storage/localStorage.json')
            this.#storage = new Map()
        }
    }

    static get(name = null) {
        if (name == null) return this.#storage
        else return this.#storage.get(name)
    }

    static save() {
        let data = Object.fromEntries(this.#storage)
        let obj
        if (fs.existsSync(this.#ROOT + '/storage/localStorage.json')) {
            obj = JSON.parse(fs.readFileSync(this.#ROOT + '/storage/localStorage.json', 'utf-8'));
            obj.data = data
            obj.update = Date.now()
        } else {
            obj = { data: data, create: Date.now(), update: Date.now() }
        }
        fs.writeFileSync(this.#ROOT + '/storage/localStorage.json', JSON.stringify(obj))
    }
    static restore() {
        if (fs.existsSync(this.#ROOT + '/storage/localStorage.json')) {
            let obj = JSON.parse(fs.readFileSync(this.#ROOT + '/storage/localStorage.json', 'utf-8'));
            this.#storage = new Map(Object.entries(obj.data))
        } else {
            this.#storage = new Map()
        }
    }
}