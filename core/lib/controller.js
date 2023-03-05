//@ts-check

const EventEmitter = require('events');
const Session = require('./session');
const Cookie =require ('./cookie');
const Logger = require('./logger');
const {HttpClient,SocketClient} = require('./router')

module.exports = class Controller extends EventEmitter {
    #app;
    static type = 'base';
    #callbackAuthToken;
    auth = false;
    #logger;
    /**@param {HttpClient|SocketClient} app */
    constructor(app, callbackAuthToken = null) {
        super();
        this.#app = app;
        this.#callbackAuthToken = callbackAuthToken;
        this.#logger=new Logger(app.config.ROOT,"Controller");
    }

    async start() {
        if (Session.isset('user')) {
            let accessToken = null, refreshToken = null;
            if (this.#app instanceof HttpClient && Cookie.isInit) {
                if (Cookie.isset('access_token') && Cookie.isset('refresh_token')) {
                    accessToken = Cookie.get('access_token');
                    refreshToken = Cookie.get('refresh_token');
                }
            } else {
                if (this.#app.input.hasOwnProperty('access_token')) {
                    accessToken = this.#app.input.access_token;
                    if (this.#app.input.hasOwnProperty('refresh_token')) refreshToken = this.#app.input.refresh_token;
                }
            }
            if (accessToken != null) {
                let result = this.#app.token.verifyUserToken(Session.get('user'), accessToken, refreshToken);
                if (!result) { if (this.#app.hasOwnProperty('session')) Session.close(); }
                else this.auth = true;
            } else {
                if (this.#app.hasOwnProperty('session')) Session.close();
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
    }
}