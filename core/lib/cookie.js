//@ts-check

const crypto = require('crypto')

module.exports = class Cookie {
    static #request;
    static #response;
    static #cookieData = new Map();
    static #cookiePass;
    static isInit = false;

    static init(req, res, cookiePass) {
        this.#request = req;
        this.#response = res;
        this.#cookiePass = cookiePass;
        this.isInit = true;
    }
    static set(name, value, expires = null, domain = null, path = null, secure = false, httpOnly = false, sameSite = null, signed = false) {
        if (signed) {
            let key = crypto.createHmac('sha256', this.#cookiePass).update(name).digest('hex');
            name += '.' + key;
        }
        if (value == null || value == undefined || value == '') {
            return false;
        }
        let data;
        if (Array.isArray(value) || typeof value === 'object') {
            data = `"${encodeURIComponent(JSON.stringify(value))}"`;
        } else {
            data = `"${encodeURIComponent(value)}"`;
        }
        let cookie = `${name}=${data}`;
        if (expires != null) cookie += `; Expires=${new Date(expires).toUTCString()}`;
        if (domain != null) cookie += `; Domain=${domain}`;
        if (path != null) cookie += `; Path=${path}`;
        if (secure) cookie += '; Secure';
        if (httpOnly) cookie += '; HttpOnly';
        if (sameSite != null) cookie += `; SameSite = ${sameSite}`;
        this.#cookieData.set(name, cookie);
        data = Array.from(this.#cookieData.values());
        this.#response.setHeader('Set-Cookie', data);
        return true;
    }

    static isset(name) {
        let cookies = this.#request.headers['cookie'];
        if (cookies != undefined) {
            let reg = new RegExp(`${name}="([\\w\\%\\[\\]\\{\\}\\#\\.\\,\\?\\$]+)"`, 'g');
            return reg.test(cookies);
        }
    }

    /**
     * 
     * @param {string} name 
     * @returns {object|string|null} Возвращает объект либо строку из cookie если они есть, если нет то null
     */
    static get(name) {
        let cookies = this.#request.headers['cookie'];
        if (cookies != undefined) {
            let reg = new RegExp(`${name}="([\\w\\%\\[\\]\\{\\}\\#\\.\\,\\?\\$\\-\\+\\_\\'\\@]+)"`, 'g');
            let res = cookies.match(reg);
            if (res != null) {
                reg = new RegExp(/"([\w\s\W\S]+)"/);
                let obj = res[0].match(reg);
                obj = decodeURIComponent(obj[1]);
                if (/\[[\w\s\W\S]+\]/.test(obj) || /\{[\w\s\W\S]+\}/.test(obj)) {
                    return JSON.parse(obj);
                } else {
                    return obj;
                }
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    static delete(name) {
        let time = new Date(0).toUTCString();
        let cookie = `${name}=delete; Expires=${time}`;
        this.#cookieData.set(name, cookie);
        let data = Array.from(this.#cookieData.values());
        this.#response.setHeader('Set-Cookie', data);
        return true;
    }
}