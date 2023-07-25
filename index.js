//@ts-check
import { AppHttp,AppSocket } from './core/app.mjs'
import Translate from './core/lib/translate.mjs'
import Token from './core/lib/token.mjs'
import LocalStorage from './core/lib/storage.mjs'
import Session from './core/lib/session.mjs'
import Cookie from './core/lib/cookie.mjs'
import { Router,RouterSocket,RouterStatic } from './core/lib/router.mjs'
import { HttpClient, SocketClient, Middle } from './core/lib/middle.mjs'
import Model from './core/lib/model.mjs'
import Logger from './core/lib/logger.mjs'
import { InputHttp, Input } from './core/lib/input.mjs'
import Controller from './core/lib/controller.mjs'
import TaskManager from './core/lib/task-manager.mjs'
import PATHES from './core/settings/pathes.mjs'

import url from 'url'

if(!PATHES.CONFIG_PATH || PATHES.CONFIG_PATH == ''){
    throw new Error("App.start() pathes.mjs doesn't contain CONFIG_PATH")
}

let pathConfig = url.pathToFileURL(PATHES.CONFIG_PATH).href

let CONFIG = (await import(pathConfig)).default
Logger.isDebug = CONFIG.DEBUG

await AppHttp.setConfig(pathConfig)
await AppSocket.setConfig(pathConfig)
await Translate.setConfig(pathConfig)
await Token.setConfig(pathConfig)
await LocalStorage.setConfig(pathConfig)
await Session.setConfig(pathConfig)
await Cookie.setConfig(pathConfig)
await Input.setConfig(pathConfig)
await Router.setConfig(pathConfig)
await RouterSocket.setConfig(pathConfig)
await RouterStatic.setConfig(pathConfig)
await Middle.setConfig(pathConfig)
await Model.setConfig(pathConfig)
await Controller.setConfig(pathConfig)

export {
    AppHttp,
    AppSocket,
    Router, 
    RouterSocket, 
    RouterStatic,
    HttpClient,
    SocketClient,
    Controller,
    Model,
    Logger,
    LocalStorage,
    Session,
    Cookie,
    InputHttp,
    Input,
    Translate,
    Token,
    TaskManager
}







