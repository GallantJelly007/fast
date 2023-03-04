const url = require('url');

class Filter {
    /**
     * @param {String} type 
     * @param {any} variable 
     * @returns {boolean|null} true|false|null
     * @desc Валидирует данные с помощью регулярных выражений возвращает null если нет подходящего типа для проверки
     */
    validate(type, variable) {
        for (let [key, value] of regular) {
            let reg = new RegExp(`^.*${key}*$`)
            if (reg.test(type)) {
                if (value.test(variable)) {
                    return true;
                } else {
                    return false;
                }
            }
        }
        return null;
    }

    /**
     * 
     * @param {String} uri 
     * @param {boolean} hardCheck 
     * @returns {Object}
     * @desc Парсит данные из Ajax запроса если они передаются блоками и возвращает объект 
     */
    parseData(uri, hardCheck = false) {
        let reg = new RegExp(/content-disposition/, 'gi');
        if (reg.test(uri)) {
            let obj = {};
            let data = uri.split(/--[\w\-\_\@\#\~\(\)\[\]\\\/\*\.\,\?\^\&\+\:\;\'\"\`\$\<\>]+/);
            for (let i = 0; i < data.length; i++) {
                data[i] = data[i].replace(/[\n\r\t]+/g, ';');
                let arr = data[i].split(';');
                if (arr.length > 1) {
                    let name;
                    for (let item of arr) {
                        if (/name="([^"]+)"/.test(item)) {
                            name = item.match(/name="([^"]+)"/);
                            name = name[1];
                            arr.pop();
                            let value = arr.pop();
                            if (/^(false|true)$/i.test(value)) {
                                value = value.toLowerCase() === "true" ? true : false;
                            }
                            if (/^[0-9]*[\.]?[0-9]+$/g.test(value)) {
                                value = Number(value);
                            }
                            obj[name] = value;
                            break;
                        }
                    }
                }
            }
            return obj;
        } else {
            return this.parseURI(uri);
        }
    }

    /**
     * 
     * @param {String} uri 
     * @param {boolean} hardCheck 
     * @returns {Object} Возвращает объект с параметрами из URL(URI) строки
     */
    parseURI(uri, hardCheck = false) {
        let arr = uri.split('&');
        let result = {};
        for (let item of arr) {
            let spl = item.split('=');
            if (spl.length == 2) {
                result[spl[0]] = decodeURIComponent(spl[1]);
            } else {
                if (hardCheck) return false;
            }
        }
        for (let key in result) {
            if (/^(false|true)$/i.test(result[key])) {
                result[key] = result[key].toLowerCase() === "true" ? true : false;
            }
            if (/^[0-9]*[\.]?[0-9]+$/g.test(result[key])) {
                result[key] = Number(result[key]);
            }
        }
        return result;
    }

    /**
     * 
     * @param {Object} data 
     * @param {boolean} hardCheck 
     * @returns {boolean|Object} true|Object
     * @desc Передавая данные в объекте, валидирует их и возвращает либо те что прошли валидацию, либо false при условии hardCheck=true
     */
    getUserData(data, hardCheck = false) {
        let userData = {};
        for (let key in data) {
            if (data[key] != null && data[key] != undefined && data[key] != '') {
                let valid = this.validate(key, data[key]);
                if (valid || valid == null) {
                    userData[key] = data[key];
                } else {
                    if (hardCheck) return false;
                }
            }
        }
        return userData;
    }

    /**
     * 
     * @param {(Array|Object|String)} data 
     * @returns {(Array|Object|String)} 
     * @desc Очищает данные в объекте, массиве или строке от html тегов
     */
    stripTags(data) {
        let reg = /(<)([\/]{0,1})[^\<\>]+(>)/g;
        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                data[i] = data[i].toString().replace(reg, '');
            }
        } else if (typeof data === 'object') {
            for (let key in data) {
                data[key] = data[key].toString().replace(reg, '');
            }
        } else {
            data = data.toString().replace(reg, '');
        }
        return data;
    }
}

export default class InputHttp extends Filter {
    #request;
    constructor(req) {
        super();
        this.#request = req;
    }

    getData(method = 'POST') {
        switch (method) {
            case 'get':
                return new Promise((resolve, reject) => {
                    let params = url.parse(this.#request.url, true);
                    resolve(params.query);
                });

            case 'post':
                return new Promise((resolve, reject) => {
                    let body = '', data = '';
                    this.#request.on('data', chunk => body += chunk.toString());
                    this.#request.on('end', () => {
                        resolve(this.parseData(body));
                    });
                });
        }
    }

    getOs() {
        try {
            for (let [item, reg] of oses) {
                if (reg.test(this.#request.headers['user-agent'])) {
                    return item;
                }
            }
            return 'Unknown';
        } catch {
            return 'Unknown';
        }
    }

    getIp() {
        return this.#request.headers['x-forwarded-for'];
    }
}