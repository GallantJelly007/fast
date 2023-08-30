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
import { EventEmitter } from 'events'


import LocalStorage from './storage.mjs'
import Session from './session.mjs'
import { Router, RouterSocket } from './router.mjs'
import { SocketClient } from './middle.mjs'
import Logger, { UrlError } from './logger.mjs'
import Model from './model.mjs'
import TaskManager from './task-manager.mjs'
import { Input } from './input.mjs'
import RequestLimiter from './request-limiter.mjs'


/**
 * Класс для создания HTTP сервера
 */

export class AppHttp extends EventEmitter {

	#callbackRouting
	#router
	#port
	#domain
	#protocol
	static #CONFIG

	get port(){
		return this.#port
	}

	get domain(){
		return this.#domain
	}

	get protocol(){
		return this.#protocol
	}

	get router(){
		return this.#router
	}

	/**
	 * @param {object} params 
	 * Параметры запуска приложения
	 * @param {string} [params.protocol]
	 * @param {Number} [params.port]
	 * Доменное имя без протокола
	 * @param {string} [params.domain]
	 * @param {RequestLimiter} [params.limiter]
	 * @param {Object} [params.routes]
	 * @param {Object} [params.staticRoutes]
	 * @param {Function} [params.callbackRouting]
	 */
	constructor(params) {
		super()
		this.#protocol = typeof params?.protocol === 'string' ? params.protocol.toLowerCase() : AppHttp.#CONFIG.PROTOCOL
		this.#port = typeof params?.port === 'number' ? params.port : AppHttp.#CONFIG.PORT
		this.#domain = typeof params?.domain === 'string' ? params.domain : AppHttp.#CONFIG.DOMAIN_NAME
		this.#router = new Router({
			routes:params?.routes,
			staticRoutes: params?.staticRoutes,
			limiter: params?.limiter
		})
		if (params.callbackRouting && params.callbackRouting instanceof Function) {
			this.#callbackRouting = params.callbackRouting
		} else {
			this.#callbackRouting = (request, response) => {
				try {
					this.router.route(request, response)
				} catch (err) {
					if (err instanceof UrlError)
						Logger.error('APP', err, err.url)
					else
						Logger.error('APP', err)
				}
			}
		}
		process.on("SIGINT", async () => {
			Logger.debug('APP', "Закрытие App process.exit(1)")
			if (AppHttp.#CONFIG.SESSION_ENABLED)
				await Session.clean()
			if (AppHttp.#CONFIG.STORAGE_ENABLED)
				await LocalStorage.clean()
			if (AppHttp.#CONFIG.LIMITER_ENABLED && this.#router.limiter instanceof RequestLimiter)
				await this.#router.limiter.save()
			this.emit('close')
			process.exit(1)
		})
		process.on("SIGQUIT", () => {
			Logger.debug('APP', "Закрытие App process.exit(3)")
			process.exit(3)
		})
		process.on("SIGTERM", () => {
			Logger.debug('APP', "Закрытие App process.exit(15)")
			process.exit(15)
		})
	}

	static async setConfig(pathToConfig) {
		try {
			AppHttp.#CONFIG = (await import(pathToConfig)).default
		} catch (error) {
			Logger.error('AppHttp.setConfig()', error)
		}
	}


	async start() {
		try {
			if (!this.#callbackRouting) 
				throw new Error("Приложение не может быть запущено так как не был передан callbackRouting или массив routes")
			if (this.protocol != 'http' && this.protocol != 'https') 
				throw new Error('Указан неверный протокол для приложения')
			if (AppHttp.#CONFIG.SESSION_ENABLED)
				TaskManager.addTask(AppHttp.#CONFIG.SESSION_CLEAN_INTERVAL * 60 * 1000, Session.clean)
			if(!this.router.limiter && AppHttp.#CONFIG.LIMITER_ENABLED)
				this.#router.limit({domain:this.domain})
			if (this.router.limiter instanceof RequestLimiter)
				TaskManager.addTask(AppHttp.#CONFIG.LIMITER_CLEAN_INTERVAL * 60 * 1000, RequestLimiter.clean)
			if (AppHttp.#CONFIG.STORAGE_ENABLED)
				LocalStorage.init()
			if (AppHttp.#CONFIG.MODEL_ENABLED)
				Model.init()
			if (AppHttp.#CONFIG.TMP_CLEAN_INTERVAL > 0)
				TaskManager.addTask(AppHttp.#CONFIG.TMP_CLEAN_INTERVAL * 60 * 1000, Input.clearTemp)
			const server = this.protocol == 'http' ? http : https
			this.emit('beforeStart')
			// @ts-ignore
			server.createServer((request,response)=>this.#callbackRouting(request, response)).listen(this.port)

			this.emit('afterStart')
			Logger.debug('APP', `Приложение запущенно перейдите на ${this.protocol}://${this.domain}:${this.port}`)
		} catch (err) {
			Logger.error('APP', err)
		}
	}

	/**
	 * @param {Object} params
	 * @param {string} params.domain
	 * Устанавливает доменное имя для ограничения запросов
     * @param {Map} [params.routes]
	 * Коллекция роутов для ограничения, имеет высший приоритет чем доменное имя (игнорирует все запросы не входящие в коллекцию роутов)
     * @param {number} [params.interval]
	 * Интервал для проверки кол-ва запросов, в минутах
     * @param {number} [params.allowCount]
	 * Кол-во разрешаемых запросов в течении одного интервала
     * @param {number} [params.blockCount]
	 * Кол-во запросов после которых IP будет добавлен в черный список
     * @param {number} [params.blockTime]
	 * Время блокировки 
	 */
	limit(params){
		this.#router.limit(params)
		return this
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
