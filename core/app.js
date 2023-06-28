//@ts-check

/**
 * @typedef {Object} Result
 * @property {number} success 
 * @property {string} message 
 */

/**
 * @typedef {Object} TokenBody
 * @property {object} header 
 * @property {object} body 
 * @property {string} sign 
 */




import http from 'http'
import https from 'https'
import * as WebSocket from 'ws'


import LocalStorage from './lib/storage.mjs'
import Session from './lib/session.mjs'
import { Router } from './lib/router.mjs'
import { SocketClient } from './lib/middle.mjs'
import Logger, { UrlError } from './lib/logger.mjs'
import Model from './lib/model.mjs'


/**
 * Класс для создания HTTP сервера
 */

export class AppHttp {

    #routes
    static #CONFIG
    
    static async setConfig(pathToConfig) {
      try {
        AppHttp.#CONFIG = (await import(pathToConfig)).default
      } catch (error) {
        Logger.error('AppHttp.setConfig()', error)
      }
    }

    /**
     * @param {Array<Map>} routes 
     * Массив коллекций разрешенных url адресов приложения
     */
    async start(routes){
    
      this.#routes = routes
      process.on("SIGINT", () => {
          Logger.debug('App',"Закрытие App process.exit(1)")
          Session.clean()
          LocalStorage.clean()
          process.exit(1)
      })
      process.on("SIGQUIT", () => {
        Logger.debug('App',"Закрытие App process.exit(3)")
        process.exit(3)
      })
      process.on("SIGTERM", () => {
        Logger.debug('App',"Закрытие App process.exit(15)")
        process.exit(15)
      })
      try{
        if(AppHttp.#CONFIG.PROTOCOL!='http' && AppHttp.#CONFIG.PROTOCOL!='https'){
          throw new Error('Указан неверный протокол для приложения')
        }
        const server = AppHttp.#CONFIG.PROTOCOL == 'http' ? http : https
        LocalStorage.init()
        Model.init()
            // @ts-ignore
        server.createServer((request, response) => {
          try{
            let router = new Router(this.#routes)
            router.start(request, response)
          }catch(err){
            if(err instanceof UrlError)
              Logger.error('App',err,err.url)
            else
              Logger.error('App',err)
          }
        }).listen(AppHttp.#CONFIG.PORT)
      }catch(err){
        Logger.error('App',err)
      }
    }
}

/**
 * Класс для создания WebSocket сервера
 */
export class AppSocket {
  clients = [];
  #routes;
  static #CONFIG;

  static async setConfig(pathToConfig) {
    try {
      AppSocket.#CONFIG = (await import(pathToConfig)).default
    } catch (error) {
      Logger.error('AppSocket.setConfig()', error)
    }
  }
  /**
   * @param {number} port 
   * Номер порта для прослушивания
   * @param {Array<Map>} routes 
   * Массив коллекций разрешенных url адресов приложения
   */
  async start(port, routes) {
    const ws = new WebSocket.WebSocketServer({ port: port })
    this.#routes = routes;
    process.on('SIGINT', () => {
      Logger.debug('process.exit(1)', 'Закрытие AppSocket')
      Session.clean()
      LocalStorage.clean()
      process.exit(1)
    });
    process.on('SIGQUIT', () => {
      Logger.debug('process.exit(3)', 'Закрытие AppSocket')
      process.exit(3)
    });
    process.on('SIGTERM', () => {
      Logger.debug('process.exit(15)', 'Закрытие AppSocket')
      process.exit(15)
    });

    try {
      LocalStorage.init()
      Model.init(true, AppSocket.#CONFIG.ROOT + "/models/extends")
      ws.on("connection", (client) => {
        let newClient = new SocketClient(
          client,
          this.#routes
        );
        newClient.send({ success: 1, message: "success" })
        this.clients.push(newClient);
        newClient.emitter.on("close", () => {
          for (let i = 0; i < this.clients.length; i++) {
            if (this.clients[i] == newClient) {
              this.clients.splice(i);
              break;
            }
          }
        });
        newClient.emitter.on("broadcast", (data) => {
          for (let i = 0; i < this.clients.length; i++) {
            if (this.clients[i] == newClient) {
              continue;
            }
            if (data.hasOwnProperty("type")) {
              if (
                this.clients[i].type == data.type &&
                data.type != null
              ) {
                this.clients[i].send(data.data)
              }
            } else {
              this.clients[i].send(data.data)
            }
          }
        });
      });
    } catch (err) {
      if (err instanceof UrlError)
        Logger.error('AppSocket', err, err.url)
      else
        Logger.error('AppSocket', err)
    }
  }

  /**
   * Функция для установки действия при закрытии приложения
   * @param {Function} func 
   * Колбэк функция которая вызывается при закрытии приложения, в функцию будет передан массив со всеми подключенными клиентами SocketClient
   */
  setOnExit(func) {
    process.on('exit', () => { func(this.clients) });
  }
}
