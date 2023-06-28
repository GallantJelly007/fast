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
import { InputHttp,Filter } from './core/lib/input.mjs'
import Controller from './core/lib/controller.mjs'
import PATHES from './core/settings/pathes.mjs'

import url from 'url'

if(!PATHES.CONFIG_PATH){
    throw new Error("App.start() pathes.mjs doesn't contain CONFIG_PATH")
}

let pathConfig = url.pathToFileURL(PATHES.CONFIG_PATH).href

Logger.setConfig(pathConfig)
AppHttp.setConfig(pathConfig)
AppSocket.setConfig(pathConfig)
Translate.setConfig(pathConfig)
Token.setConfig(pathConfig)
LocalStorage.setConfig(pathConfig)
Session.setConfig(pathConfig)
Cookie.setConfig(pathConfig)
Router.setConfig(pathConfig)
RouterSocket.setConfig(pathConfig)
RouterStatic.setConfig(pathConfig)
Middle.setConfig(pathConfig)
Model.setConfig(pathConfig)
Controller.setConfig(pathConfig)

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
    Filter,
    Translate,
    Token
}







