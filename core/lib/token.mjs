//@ts-check
/**
 * @typedef {Object} TokenBody
 * @property {object} header 
 * @property {object} body 
 * @property {string} sign 
 */

/**
 * @typedef {Object} Result
 * @property {number} success 
 * @property {string} message 
 */

import * as crypto from 'crypto'
import LocalStorage from './storage.mjs'
import Logger from './logger.mjs'
import Time from 'timelex'

/**Класс для работы с JWT и CSRF токенами */
export default class Token {

    static #CONFIG

    static async setConfig(pathToConfig){
        try{
            Token.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('Token.setConfig()',error)
        }
    }

    #btoa(text) {
        return Buffer.from(text, 'binary').toString('base64');
    };

    #atob(text) {
        return Buffer.from(text, 'base64').toString('binary');
    };

    /**
     * Функция для создания токена на основе данных
     * @param {any} data 
     * Объект или массив данных
     * @param {string} key 
     * Ключ для подписи токена
     * @returns 
     */
    encode(data, key) {
        try{
            if (key != null && key != undefined && key != '') {
                let header = { alg: 'SHA256' }
                let segments = []
                segments[0] = this.#btoa(JSON.stringify(header))
                segments[1] = this.#btoa(JSON.stringify(data))
                let dataSign = segments[0] + "." + segments[1]
                let sign = crypto.createHmac('sha256', String(key)).update(dataSign).digest('base64')
                segments[2] = sign
                let res = segments.join('.')
                return encodeURIComponent(res)
            } else {
                return false
            }
        }catch(err){
            Logger.error('Token',err)
            return false
        } 
    }


    /**
     * Функция для деккодирования токена в данные
     * @param {string} token
     * JWT-токен
     * @returns {false|TokenBody}  
     */
    decode(token) {
        try {
            if (token == null || token == '') return false
            let segments = decodeURIComponent(token).split('.')
            if (segments.length < 3) {
                return false
            }
            let data = {}
            data.header = JSON.parse(this.#atob(segments[0]))
            data.body = JSON.parse(this.#atob(segments[1]))
            data.sign = segments[2]
            return data
        } catch (err) {
            Logger.error('Token',err)
            return false
        }
    }

    /**
     * Функция валидации JWT-токена
     * @param {string} token
     * JWT-токен
     * @param {string} key
     * Ключ который использовался для подписи токена
     * @returns {Result}  
     * Возвращает объект с результатом в виде {success:значение,message:значение}
     */
    validate(token, key) {
        try{
            let data = this.decode(token);
            if (!data) {
              return { success: 0, message: "Токен поврежден" }
            }
            let time = new Time()
            if (data.body.exp < time.timestamp) {
              return { success: 1, message: "Время действия токена истекло" }
            }
            let segments = decodeURIComponent(token).split(".")
            let dataSign = segments[0] + "." + segments[1]
            let sign = crypto
              .createHmac("sha256", String(key))
              .update(dataSign)
              .digest("base64")
            if (data.sign != sign) {
              return { success: 0, message: "Недействительный токен" };
            }
            return { success: 1, message: "Действительный токен" };
        }catch(err){
            Logger.error('Token',err)
            return { success: 0, message: "Ошибка проверки токена" };
        }  
    }


    /**
     * Функция проверки токена на соответствие объекту user + валидация 
     * @param {object} user 
     * Объект с данными пользователя
     * @param {string} accessKey 
     * Ключ использовавшийся для создания access_token
     * @param {string} accessToken 
     * @param {string|null} refreshKey 
     * Ключ использовавшийся для создания refresh_token
     * @param {string|null} refreshToken 
     * @returns 
     */
    verify(user, accessKey, accessToken,refreshKey=null,refreshToken = null) {
        try {
            let infoAccess = this.decode(accessToken)
            if (!infoAccess) 
                return false
            if (!user.hasOwnProperty('userId') || !user.hasOwnProperty('userKey') || !user.hasOwnProperty('userRkey')) 
                return false
            for(let key in infoAccess.body.data){
                if (infoAccess.body.data[key] != user[key])
                    return false
            }
            let result = this.validate(accessToken, accessKey)
            if (result.success == 0) {
                if (refreshKey != null && refreshToken != null) {
                    let infoRefresh = this.decode(refreshToken)
                    if(infoRefresh === false) return false;
                    for(let key in infoAccess.body.data){
                        if (infoAccess.body.data[key] != infoRefresh.body.data[key])
                            return false
                    }
                    result = this.validate(refreshToken, refreshKey)
                    if (result.success == 1) {
                        return true
                    } else {
                        return false
                    }
                } else {
                    return false
                }
            } else {
                return true
            }
        } catch (err) {
            Logger.error('Token',err)
            return false
        }
    }

    /**
     * Функция создания JWT-токенов
     * @param {object} user 
     * Объект параметров пользователя
     * @param {string} accessKey
     * Ключ для создания access_token
     * @param {string} refreshKey 
     * Ключ для создания refresh_token
     * @returns {object} 
     * {
     *  
     * success,
     * 
     *  accessToken,
     * 
     *  dateAccess,
     * 
     *  refreshToken?,
     * 
     *  dateRefresh?,
     * 
     * }
     * 
     */
    generate(user, accessKey='', refreshKey='') {
        try{
            let token, refreshToken
            let data = {
                iss: Token.#CONFIG.DOMAIN,
                gen: Date.now(),
                exp: Date.now() + ((3600 * 1000) * 24 * Token.#CONFIG.LTT),
                data: user
            }
            token = this.encode(data, accessKey)
            if (token == false) throw new Error('В объекте user отсутствует ключ для генерации access_token')
            if (refreshKey!='') {
                let dateAccess = data.exp
                data.exp = Date.now() + ((3600 * 1000) * 24 * Token.#CONFIG.LTRT)
                let dateRefresh = data.exp
                refreshToken = this.encode(data, refreshKey)
                if (refreshToken == false) throw new Error('В объекте user отсутствует ключ для генерации refresh_token')
                return { success: 1, accessToken: token, refreshToken: refreshToken, dateAccess: dateAccess, dateRefresh: dateRefresh }
            } else {
                return { success: 1, accessToken: token, dateAccess: data.exp }
            }
        }catch(err){
            Logger.error('Token',err)
            return false
        }
    }


    generateCsrf(data){
        let csrfKey = crypto.randomUUID()
        let csrfToken = crypto.createHmac('sha256', String(csrfKey)).update(data.toString()).digest('hex')
        LocalStorage.set(csrfToken,{csrfKey:csrfKey,data:data.toString()})
        return csrfToken;
    }


    verifyCsrf(token,data){
        if(LocalStorage.isset(token)){
            let obj = LocalStorage.get(token)
            LocalStorage.unset(token)
            if(data.toString()==obj.data)
                return true
            else
                return false
        }else{
            return false
        }
    }
}