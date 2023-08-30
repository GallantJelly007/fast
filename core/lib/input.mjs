//@ts-check
import * as url from 'url'
import Logger from './logger.mjs'
import * as fs from 'fs'
import * as crypto from 'crypto'
import { Jax, Url } from 'jaxfis'

const UD_REGULAR = new Map([
    ["login", /^[a-zA-Z][a-zA-Z0-9-_\.]{3,20}$/],
    ["name", /[A-zА-яЁ-ё]{2,30}$/u],
    ["email", /^[\w.]+@([A-z0-9][-A-z0-9]+\.)+[A-z]{2,4}$/],
    ["pass", /^[^А-Яа-яЁё]{8,20}$/],
    ["telephone", /^(\+)([- _():=+]?\d[- _():=+]?){11,14}(\s*)?$/]
])

const OSES = new Map([
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
])

export class Input {

    static #CONFIG

    static async setConfig(pathToConfig){
        try{
            Input.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('Input.setConfig()',error)
        }
        InputHttp.setConfig(pathToConfig)
    }
    /**
     * Валидирует данные с помощью регулярных выражений возвращает null если нет подходящего типа для проверки
     * @param {String} type 
     * @param {any} variable 
     * @returns {boolean} true|false|null
     */
    validate(type, variable) {
        try{
            for (let [key, value] of UD_REGULAR) {
                let reg = new RegExp(`^.*${key}*$`)
                if (reg.test(type)) {
                    if (value.test(variable)) {
                        return true
                    } else {
                        return false
                    }
                }
            }
            return true
        }catch(err){
            Logger.error('Input.validate()',err)
            return false
        }
    }

    /**
     * Функция для очистки данных в объекте, массиве или строке от html тегов
     * @param {Array|Object|String} data 
     * @returns {Array|Object|String} 
     */
    stripTags(data) {
        try{
            let reg = /(<)([\/]{0,1})[^\<\>]+(>)/g
            if (Array.isArray(data) && data.constructor == Array) {
                for (let i = 0; i < data.length; i++) {
                    if (data[i] && typeof data[i]?.toString === 'function')
                        data[i] = data[i].toString().replace(reg, '')
                }
            } else if (typeof data === 'object') {
                for (let key in data) {
                    if (Array.isArray(data[key]) || typeof data[key] === 'object')
                        data[key] = this.stripTags(data[key])
                    else if (typeof data[key]?.toString === 'function')
                        data[key] = data[key].toString().replace(reg, '')
                }
            } else {
                if (data)
                    data = data.toString().replace(reg, '')
            }
            return data
        }catch(err){
            Logger.error('Input.stripTags()',err)
        }
    }

    uploadFile(contentType,body,ext=''){
        return new Promise((resolve,reject)=>{
            try{
                let format = Input.#CONFIG.ALLOWED_UPLOAD_FORMATS.find(([key,value])=>key==contentType)?.[1]
                if(!format)
                    resolve(false)
                if(format == ext && ext != ''){
                    ext = format
                }
                let newName = crypto.randomUUID().split('-').join('') + ext
                let content = Buffer.from(body.replace(/^[\n\r\t]+/, '').replace(/[\n\r\t]+$/, ''), 'binary')
                if (!fs.existsSync(`${Input.#CONFIG.ROOT}/temp`)) {
                    fs.mkdirSync(`${Input.#CONFIG.ROOT}/temp`, { recursive: true })
                }
                fs.writeFile(`${Input.#CONFIG.ROOT}/temp/${newName}`, content, (err) => {
                    if (err) Logger.error('Input.uploadFile()', err)
                    resolve({ filename: newName, path: `${Input.#CONFIG.ROOT}/temp/${newName}` })
                })
            }catch(err){
                Logger.error('Input.uploadFile()',err)
                resolve(false)
            }
        })
    }

    static async clearTemp(){
        try{
            if(fs.existsSync(Input.#CONFIG.TMP_PATH) && fs.lstatSync(Input.#CONFIG.TMP_PATH).isDirectory()){
                fs.readdir(Input.#CONFIG.TMP_PATH, { withFileTypes: true },(err,files)=>{
                    if(err!=null){
                        Logger.error('Input.clearTemp()',err)
                        return false
                    }
                    for (let file of files) {
                        let path = `${Input.#CONFIG.TMP_PATH}/${file.name}`
                        fs.unlink(path,()=>null)
                    }
                    return true
                })
            }else{
                return false
            }
        }catch(err){
            Logger.error('Input.clearTemp()',err)
            return false
        }
    }
}

export class InputHttp extends Input {

    static #CONFIG
    #request

    static async setConfig(pathToConfig){
        try{
            InputHttp.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('InputHttp.setConfig()',error)
        }
    }

    constructor(req) {
        super()
        this.#request = req
    }

    /**
     * Функция получения данных от клиента по HTTP
     * @param {string} method 
     * Метод HTTP из которого ожидается получение данных (GET,POST,PUT)
     * @returns 
     */
    getData(method = 'post') {
        return new Promise((resolve, reject) => {
            try{
                switch (method) {
                    case 'get':
						let parts = this.#request.url.split('?')
						if(parts.length>1){
							parts.shift()
							let params = parts.join('?')
							let fields = Url.decode(params)                 
							resolve({fields})
						}
						resolve({})
                        break
					case 'delete':
                    case 'put':
                    case 'post':
                        let body = []
                        if (this.#request.headers['content-length']) {
                            if (this.#request.headers['content-length'] / 1024 / 1024 > InputHttp.#CONFIG.MAX_POST_SIZE){
								let err = new Error(`Пользователь ${this.getIp()} превысил максимально допустимый размер передаваемых данных`)
                                reject(err) 
                            } 
                        }
                        this.#request.on('data', chunk => body.push(chunk))
                        let contentType = this.#request.headers['content-type'].split(';').shift()
                        this.#request.on('end', async () => resolve(await this.#parseData(body,contentType)))
                        break
                }
            }catch(err){
                Logger.error('InputHttp.getData()',err)
            }
        })
    }

     /**
     * Функция для парсинга входящих данных HTTP-запроса
     * @param {Array<any>} data 
     * @param {boolean} hardCheck 
     * @returns {Promise<object>} 
     */
    async #parseData(data, contentType='', hardCheck = false) {

        let fields={}
        let files=[]
		try {
			let buffer = Buffer.concat(data).toString('binary')
			switch (contentType) {
				case 'multipart/form-data': {
					let reg = new RegExp(/content-disposition/, 'gi')
					if (reg.test(buffer)) {
						let boundaries = buffer.match(/--[\w\-\_\@\#\~\(\)\[\]\\\/\*\.\,\?\^\&\+\:\;\'\"\`\$\<\>]+[\r\n]+content-disposition/gi)
						if (boundaries) {
							let boundary = boundaries[0].replace(/[\r\n]+content-disposition/gi, '')
							let boundaryReg = new RegExp(`${boundary}[\-]*[\r\n]*`, 'g')
							let arrData = buffer.split(boundaryReg).filter(el => !/^\s*$/.test(el))
							let count = 1
							for (let segment of arrData) {
								if (/filename="([^"]+)"/.test(segment)) {
									let arr = segment.split(/[\r\n]{4}/).filter(el => el != '')
									if (arr.length > 1) {
										let headers = arr.shift()
										if (headers) {
											let body = segment.replace(headers, '')
											let contentType = ''
											let match = headers.match(/content-type:\s*([\w\/-]+)/i)
											if (match) contentType = match[1]
											let mimeKey = InputHttp.#CONFIG.ALLOWED_UPLOAD_FORMATS.find(([key, value]) => key == contentType)
											if (!mimeKey)
												continue
											match = headers.match(/filename="([^"]+)"/)
											let filename = ''
											if (match) filename = match[1]
											if (!filename || filename == '') {
												continue
											}
											let ext = `.${filename.split('.')[1]}`
											let file = await this.uploadFile(contentType, body, ext)
											if (file) files.push(file)
										}
									}
								} else {
									let arr = segment.split(/[\r\n]{4}/).filter(el => el != '')
									if (arr.length) {
										let headers = arr.shift()
										if (headers) {
											let body = segment.replace(headers, '').trim()
											let name = ''
											let match = headers.match(/name="([^"]+)"/)
											if (match) name = match[1]
											if (name == '') {
												name = `param${count}`
												count++
											}
											let value
											body = body.replace(/[\r\n]{2}$/, '')
											if (body != undefined && /^(false|true)$/i.test(body))
												value = body.toLowerCase() === "true" ? true : false
											else if (body != undefined && /^[0-9]*[\.]?[0-9]+$/.test(body))
												value = Number(body)
											else if (body != undefined && /^null$/i.test(body))
												value = null
											else
												value = body
											fields[name] = value
										}
									}
								}
							}
						}
					}
					return { fields, files }
				}
				case 'application/x-www-form-urlencoded': {
					fields = Url.decode(buffer)
					return { fields }
				}
				case 'application/json': {
					return { fields: JSON.parse(buffer, Jax.jsonMapReviewer) }
				}
				default: {
					let mime = Jax.MIME_FILES.find(([key, value]) => key == contentType)
					if (mime) {
						if (InputHttp.#CONFIG.ALLOWED_UPLOAD_FORMATS.find(([key, value]) => key == contentType)) {
							let newName = `${crypto.randomUUID()}${mime[1]}`
							fs.writeFile(`${InputHttp.#CONFIG.TMP_PATH}/${newName}`, Buffer.concat(data), "binary", function (err) {
								if (err) Logger.error('InputHttp.parseData file loaded error', err)
							})
						}
					}
					return { files }
				}
			}
		} catch (err) {
			Logger.error('InputHttp.parseData()',err)
			return {}
		}
    }

    /**
     * Получение данных с валидацией в соответствии с регулярными выражениями
     * @param {Object} data 
     * @param {boolean} hardCheck 
     * @returns {boolean|Object} true|Object
     * @desc Передавая данные в объекте, валидирует их и возвращает либо те что прошли валидацию, либо false при условии hardCheck=true
     */
    getUserData(data, hardCheck = false) {
        let userData = {}
        try{
            for (let key in data) {
                if (data[key] != null && data[key] != undefined && data[key] != '') {
                    let valid = this.validate(key, data[key])
                    if (valid) {
                        userData[key] = data[key]
                    } else {
                        if (hardCheck) return false
                    }
                }
            }
        }catch(err){
            Logger.error('Input.getUserData()',err)
        }
        return userData
    }

    /**
     * Функция получения OC клиента
     * @returns {string}
     */
    getOs(){
        try {
            for (let [item, reg] of OSES) {
                if (reg.test(this.#request.headers['user-agent'])) {
                    return item
                }
            }
            return 'Unknown'
        } catch {
            return 'Unknown'
        }
    }

    /**
     * Функция получения IP-адреса клиента
     * @returns {string|undefined}
     */
    getIp() {
        try{
            return this.#request.headers['x-forwarded-for']?.split(',').shift()
            || this.#request.socket?.remoteAddress
        }catch(err){
            Logger.error('Input.getIp()',err)
        }
    }
}