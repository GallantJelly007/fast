//@ts-check

const crypto = require('crypto')
const Cookie = require('./cookie')
const config = require('../settings/config')
const fs = require('fs')

module.exports = class Session {
    static #sessionStorage = new Map();
    static #sesId;
    static root;
    static isStart = false;
    static idLength;

    static cleanTime = config.SESSION_CLEAN_TIME;

    static start(root, sesId = null, setCookie = false) {
        this.idLength = config.ID_LENGTH;
        if (!fs.existsSync(root + "/storage/sessions")) {
            fs.mkdir(root + "/storage/sessions", (err) => {
                if (err) {
                    return false;
                }
            });
        }
        this.root = root;
        if (sesId != null) {
            this.#sesId = sesId;
            this.restore();
        } else {
            this.#sesId = this.genId();
        }
        if (setCookie) {
            Cookie.set('ses-id', this.#sesId)
        }
        if (!this.isset('csrf_key')) {
            this.set('csrf_key', Session.hash(20, 'all') + this.#sesId);
        }
        this.isStart = true;
    }

    static genId() {
        let random;
        do {
            random = [];
            for (let i = 0; i < this.idLength / 4; i++) {
                random.push(Session.hash(4, 'chars-numbers'));
            }
            random = random.join('-');
        } while (fs.existsSync(this.root + "/storage/sessions/" + random + '.json'));
        return random;
    }

    static genCsrf() {
        let sign = crypto.createHash('sha256').update(this.get('csrf_key')).digest('hex');
        return sign;
    }

    static verifyCsrf(key) {
        if (this.isStart) {
            let sign = crypto.createHash('sha256').update(this.get('csrf_key')).digest('hex');
            if (sign != key) return false;
            else return true;
        } else {
            return false;
        }
    }

    static set(name, value) {
        this.#sessionStorage.set(name, value);
        this.save();
        return true;
    }

    static unset(name) {
        if (this.#sessionStorage.has(name)) {
            this.#sessionStorage.delete(name);
            this.save();
            return true;
        }
        return false;
    }

    static isset(name) {
        return this.#sessionStorage.has(name);
    }

    static get(name = '') {
        if (name == '') return this.#sessionStorage;
        else return this.#sessionStorage.get(name);
    }

    static save() {
        let data = Object.fromEntries(this.#sessionStorage);
        let obj;
        if (fs.existsSync(this.root + '/storage/sessions/' + this.#sesId + '.json')) {
            obj = JSON.parse(fs.readFileSync(this.root + '/storage/sessions/' + this.#sesId + '.json', 'utf-8'));
            obj.data = data;
            obj.update = Date.now();
        } else {
            obj = { data: data, create: Date.now(), update: Date.now() };
        }
        fs.writeFileSync(this.root + '/storage/sessions/' + this.#sesId + '.json', JSON.stringify(obj));
    }

    static close() {
        if (fs.existsSync(this.root + '/storage/sessions/' + this.#sesId + '.json')) {
            fs.unlinkSync(this.root + '/storage/sessions/' + this.#sesId + '.json');
            this.#sessionStorage = new Map();
            this.#sesId = this.genId();
        }
    }

    static clean(root) {
        if (fs.existsSync(root + '/storage/sessions')) {
            let files = fs.readdirSync(root + '/storage/sessions', { withFileTypes: true });
            for (let file of files) {
                let path = root + '/storage/sessions/' + file.name;
                let obj = JSON.parse(fs.readFileSync(path, 'utf-8'));
                if (new Date(Date.now() - obj.update).getHours() > this.cleanTime) {
                    fs.unlinkSync(path);
                }
            }
        }
    }

    static restore() {
        if (fs.existsSync(this.root + '/storage/sessions/' + this.#sesId + '.json')) {
            let obj = JSON.parse(fs.readFileSync(this.root + '/storage/sessions/' + this.#sesId + '.json', 'utf-8'));
            this.#sessionStorage = new Map(Object.entries(obj.data));
        } else {
            this.#sessionStorage = new Map();
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