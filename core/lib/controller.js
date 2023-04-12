//@ts-check
import {EventEmitter} from 'events'
import Session from './session.js';
import Cookie from './cookie.js';
import Logger from './logger.js';
import {HttpClient,SocketClient} from './router.js';
import CONFIG from '../settings/config.js';

export default class Controller extends EventEmitter {
    #app;
    static type = 'base';
    #callbackAuthToken;
    auth = false;

    /**@param {HttpClient|SocketClient} app */
    constructor(app, callbackAuthToken = null) {
        super();
        this.#app = app;
        this.#callbackAuthToken = callbackAuthToken;
    }

    async start() {
        try{
            if (Session.isset(CONFIG.SES_USER_FIELD)) {
                let accessToken = null, refreshToken = null;
                if (this.#app instanceof HttpClient && Cookie.isInit) {
                    if (Cookie.isset(CONFIG.A_TOKEN_FIELD) && Cookie.isset(CONFIG.R_TOKEN_FIELD)) {
                        accessToken = Cookie.get(CONFIG.A_TOKEN_FIELD);
                        refreshToken = Cookie.get(CONFIG.R_TOKEN_FIELD);
                    }
                } else {
                    if (this.#app.input.hasOwnProperty(CONFIG.A_TOKEN_FIELD)) {
                        accessToken = this.#app.input.access_token;
                        if (this.#app.input.hasOwnProperty(CONFIG.R_TOKEN_FIELD)) refreshToken = this.#app.input.refresh_token;
                    }
                }
                if (accessToken != null) {
                    if(Session.isStart){
                        let keyToken = Session.get(CONFIG.SES_KEY_A_TOKEN_FIELD)?.toString()??''
                        let keyRtoken = Session.get(CONFIG.SES_KEY_R_TOKEN_FIELD)?.toString()??''
                        let result = this.#app.token.verify(Session.get(CONFIG.SES_USER_FIELD), keyToken, accessToken, keyRtoken, refreshToken);
                        if (!result) Session.close()
                        else this.auth = true;
                    }
                } else {
                    Session.close();
                }
                this.emit('ready', true);
            } else {
                try {
                    if (this.#callbackAuthToken != null && typeof this.#callbackAuthToken == 'function') {
                        this.#callbackAuthToken(this.#app).then((result) => {
                            this.auth = result;
                            this.emit('ready', true);
                        });
                    } else {
                        this.emit('ready', true);
                    }
                } catch {
                    this.emit('ready', false);
                }
            }
        }catch(err){
            throw err
        }
    }
}