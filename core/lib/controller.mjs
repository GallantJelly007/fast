//@ts-check
import {EventEmitter} from 'events'
import Session from './session.mjs';
import Cookie from './cookie.mjs';
import Logger from './logger.mjs';
import {HttpClient,SocketClient} from './middle.mjs';

export default class Controller extends EventEmitter {
    #app;
    #callbackAuthToken
    static #CONFIG
    static type = 'base'
    auth = false

    static async setConfig(pathToConfig){
        try{
            Controller.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('Controller.setConfig()',error)
        }
    }

    /**@param {HttpClient|SocketClient} app */
    constructor(app, callbackAuthToken = null) {
        super()
        this.#app = app
        this.#callbackAuthToken = callbackAuthToken
    }

    /**
     * Функция которая вызывается перед любыми другими функциями контроллера и проверяется авторизацию пользователя по токенам
     */
    async start() {
        try{
            if (Session.isset(Controller.#CONFIG.SES_USER_FIELD)) {
                let accessToken = null, refreshToken = null
                if (this.#app instanceof HttpClient && Cookie.isInit) {
                    if (Cookie.isset(Controller.#CONFIG.A_TOKEN_FIELD) && Cookie.isset(Controller.#CONFIG.R_TOKEN_FIELD)) {
                        accessToken = Cookie.get(Controller.#CONFIG.A_TOKEN_FIELD)
                        refreshToken = Cookie.get(Controller.#CONFIG.R_TOKEN_FIELD)
                    }
                } else {
                    if (this.#app.input.hasOwnProperty(Controller.#CONFIG.A_TOKEN_FIELD)) {
                        accessToken = this.#app.input.access_token
                        if (this.#app.input.hasOwnProperty(Controller.#CONFIG.R_TOKEN_FIELD)) refreshToken = this.#app.input.refresh_token
                    }
                }
                if (accessToken != null) {
                    if(Session.isStart){
                        let keyToken = Session.get(Controller.#CONFIG.SES_KEY_A_TOKEN_FIELD)?.toString()??''
                        let keyRtoken = Session.get(Controller.#CONFIG.SES_KEY_R_TOKEN_FIELD)?.toString()??''
                        let result = this.#app.token.verify(Session.get(Controller.#CONFIG.SES_USER_FIELD), keyToken, accessToken, keyRtoken, refreshToken)
                        if (!result) Session.close()
                        else this.auth = true
                    }
                } else {
                    Session.close()
                }
                this.emit('ready', true);
            } else {
                try {
                    if (this.#callbackAuthToken != null && typeof this.#callbackAuthToken == 'function') {
                        this.#callbackAuthToken(this.#app).then((result) => {
                            this.auth = result
                            this.emit('ready', true)
                        });
                    } else {
                        this.emit('ready', true)
                    }
                } catch {
                    this.emit('ready', false)
                }
            }
        }catch(err){
            throw err
        }
    }
}