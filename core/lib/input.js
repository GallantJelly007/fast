//@ts-check
import * as url from 'url'

const regular = new Map([
    ["login", /^[a-zA-Z][a-zA-Z0-9-_\.]{3,20}$/],
    ["name", /[A-zА-яЁ-ё]{2,30}$/u],
    ["email", /^[\w.]+@([A-z0-9][-A-z0-9]+\.)+[A-z]{2,4}$/],
    ["pass", /^[^А-Яа-яЁё]{8,20}$/],
    ["telephone", /^(\+)([- _():=+]?\d[- _():=+]?){11,14}(\s*)?$/]
]);

const oses = new Map([
    ['Windows 3.11', /(Win16)/],
    ['Windows 95', /(Windows 95)|(Win95)|(Windows_95)/],
    ['Windows 98', /(Windows 98)|(Win98)/],
    ['Windows 2000', /(Windows NT 5.0)|(Windows 2000)/],
    ['Windows 2000 Service Pack 1', /(Windows NT 5.01)/],
    ['Windows XP', /(Windows NT 5.1)|(Windows XP)/],
    ['Windows Server 2003', /(Windows NT 5.2)/],
    ['Windows Vista', /(Windows NT 6.0)|(Windows Vista)/],
    ['Windows 7', /(Windows NT 6.1)|(Windows 7)/],
    ['Windows 8', /(Windows NT 6.2)|(Windows 8)/],
    ['Windows 8.1', /(Windows NT 6.3)|(Windows 8.1)/],
    ['Windows 10', /(Windows NT 10.0)|(Windows 10)/],
    ['Windows 11', /(Windows NT 11.0)|(Windows 11)/],
    ['Windows NT 4.0', /(Windows NT 4.0)|(WinNT4.0)|(WinNT)|(Windows NT)/],
    ['Windows ME', /(Windows ME)|(Windows 98; Win 9x 4.90 )/],
    ['Windows CE', /(Windows CE)/],
    ['Mac OS X Kodiak (beta)', /(Mac OS X beta)/],
    ['Mac OS X Cheetah', /(Mac OS X 10.0)/],
    ['Mac OS X Puma', /(Mac OS X 10.1)/],
    ['Mac OS X Jaguar', /(Mac OS X 10.2)/],
    ['Mac OS X Panther', /(Mac OS X 10.3)/],
    ['Mac OS X Tiger', /(Mac OS X 10.4)/],
    ['Mac OS X Leopard', /(Mac OS X 10.5)/],
    ['Mac OS X Snow Leopard', /(Mac OS X 10.6)/],
    ['Mac OS X Lion', /(Mac OS X 10.7)/],
    ['Mac OS X', /(Mac OS X)/],
    ['Mac OS', /(Mac_PowerPC)|(PowerPC)|(Macintosh)/],
    ['Open BSD', /(OpenBSD)/],
    ['SunOS', /(SunOS)/],
    ['Solaris 11', /(Solaris\/11)|(Solaris11)/],
    ['Solaris 10', /((Solaris\/10)|(Solaris10))/],
    ['Solaris 9', /((Solaris\/9)|(Solaris9))/],
    ['CentOS', /(CentOS)/],
    ['QNX', /(QNX)/],
    ['UNIX', /(UNIX)/],
    ['Ubuntu 21.04', /(Ubuntu\/21.04)|(Ubuntu 21.04)/],
    ['Ubuntu 20.04', /(Ubuntu\/20.04)|(Ubuntu 20.04)/],
    ['Ubuntu 19.04', /(Ubuntu\/19.04)|(Ubuntu 19.04)/],
    ['Ubuntu 18.04', /(Ubuntu\/18.04)|(Ubuntu 18.04)/],
    ['Ubuntu 17.04', /(Ubuntu\/17.04)|(Ubuntu 17.04)/],
    ['Ubuntu 16.04', /(Ubuntu\/16.04)|(Ubuntu 16.04)/],
    ['Ubuntu 15.04', /(Ubuntu\/15.04)|(Ubuntu 15.04)/],
    ['Ubuntu 14.04', /(Ubuntu\/14.04)|(Ubuntu 14.04)/],
    ['Ubuntu 13.10', /(Ubuntu\/13.10)|(Ubuntu 13.10)/],
    ['Ubuntu 13.04', /(Ubuntu\/13.04)|(Ubuntu 12.04)/],
    ['Ubuntu 12.10', /(Ubuntu\/12.10)|(Ubuntu 12.10)/],
    ['Ubuntu 12.04 LTS', /(Ubuntu\/12.04)|(Ubuntu 12.04)/],
    ['Ubuntu 11.10', /(Ubuntu\/11.10)|(Ubuntu 11.10)/],
    ['Ubuntu 11.04', /(Ubuntu\/11.04)|(Ubuntu 11.04)/],
    ['Ubuntu 10.10', /(Ubuntu\/10.10)|(Ubuntu 10.10)/],
    ['Ubuntu 10.04 LTS', /(Ubuntu\/10.04)|(Ubuntu 10.04)/],
    ['Ubuntu 9.10', /(Ubuntu\/9.10)|(Ubuntu 9.10)/],
    ['Ubuntu 9.04', /(Ubuntu\/9.04)|(Ubuntu 9.04)/],
    ['Ubuntu 8.10', /(Ubuntu\/8.10)|(Ubuntu 8.10)/],
    ['Ubuntu 8.04 LTS', /(Ubuntu\/8.04)|(Ubuntu 8.04)/],
    ['Ubuntu 6.06 LTS', /(Ubuntu\/6.06)|(Ubuntu 6.06)/],
    ['Red Hat Linux', /(Red Hat)/],
    ['Red Hat Enterprise Linux', /(Red Hat Enterprise)/],
    ['Fedora 17', /(Fedora\/17)|(Fedora 17)/],
    ['Fedora 16', /(Fedora\/16)|(Fedora 16)/],
    ['Fedora 15', /(Fedora\/15)|(Fedora 15)/],
    ['Fedora 14', /(Fedora\/14)|(Fedora 14)/],
    ['Chromium OS', /(ChromiumOS)/],
    ['Google Chrome OS', /(ChromeOS)/],
    ['OpenBSD', /(OpenBSD)/],
    ['FreeBSD', /(FreeBSD)/],
    ['NetBSD', /(NetBSD)/],
    ['Android 12.0', /(Android\/12)|(Android 12)/],
    ['Android 11.0', /(Android\/11)|(Android 11)/],
    ['Android 10.0', /(Android\/10)|(Android 10)/],
    ['Android 9.0 Pie', /(Android\/9)|(Android 9)/],
    ['Android 8.1 Oreo', /(Android\/8.1)|(Android 8.1)/],
    ['Android 8.0 Oreo', /(Android\/8)|(Android 8)/],
    ['Android 7.1 Nougat', /(Android\/7.1)|(Android 7.1)/],
    ['Android 7.0 Nougat', /(Android\/7)|(Android 7)/],
    ['Android 6.0 Marshmallow', /(Android\/6)|(Android 6)/],
    ['Android 5.1 Lollipop', /(Android\/5.1)|(Android 5.1)/],
    ['Android 5.0 Lollipop', /(Android\/5)|(Android 5)/],
    ['Android 4.4 KitKat', /(Android\/4.4)|(Android 4.4)/],
    ['Android 4.3 Jelly Bean', /(Android\/4.3)|(Android 4.3)/],
    ['Android 4.2 Jelly Bean', /(Android\/4.2)|(Android 4.2)/],
    ['Android 4.1 Jelly Bean', /(Android\/4.1)|(Android 4.1)/],
    ['Android 4.0 Ice Cream Sandwich', /(Android\/4.0)|(Android 4.0)/],
    ['Linux', /(Linux)|(X11)/],
    ['iPod', /(iPod)/],
    ['iPhone', /(iPhone)/],
    ['iPad', /(iPad)/],
    ['OS/8', /(OS\/8)|(OS8)/],
    ['Older DEC OS', /(DEC)|(RSTS)|(RSTS\/E)/],
    ['WPS-8', /(WPS-8)|(WPS8)/],
    ['BeOS', /(BeOS)|(BeOS r5)/],
    ['BeIA', /(BeIA)/],
    ['OS/2 2.0', /(OS\/220)|(OS\/2 2.0)/],
    ['OS/2', /(OS\/2)|(OS2)/],
    ['Search engine or robot', /(nuhk)|(Googlebot)|(Yammybot)|(Openbot)|(Slurp)|(msnbot)|(Ask Jeeves\/Teoma)|(ia_archiver)/]
]);

export class Filter {
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
                            if (name != null) {
                                name = name[1];
                                arr.pop();
                                let value = arr.pop();
                                if (value != undefined && /^(false|true)$/i.test(value)) {
                                    // @ts-ignore
                                    value = value.toLowerCase() === "true" ? true : false;
                                }
                                if (value != undefined && /^[0-9]*[\.]?[0-9]+$/g.test(value)) {
                                    // @ts-ignore
                                    value = Number(value);
                                }
                                obj[name] = value;
                                break;
                            }
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

export class InputHttp extends Filter {
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