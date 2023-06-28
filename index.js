//@ts-check
import { AppHttp,AppSocket } from './core/app.js'
import Translate from './core/lib/translate.mjs'
import Token from './core/lib/token.mjs'
import LocalStorage from './core/lib/storage.mjs'
import Session from './core/lib/session.mjs'
import Cookie from './core/lib/cookie.mjs'
import { Router,RouterSocket,RouterStatic } from './core/lib/router.mjs'
import { HttpClient, SocketClient } from './core/lib/middle.mjs'
import Model from './core/lib/model.mjs'
import Logger from './core/lib/logger.mjs'
import { InputHttp,Filter } from './core/lib/input.mjs'
import Controller from './core/lib/controller.mjs'

import url from 'url'
import path from 'path'
import * as fs from 'fs'



if (!fs.existsSync('./core/settings/pathes.json')) {
    throw new Error("App.start() don't load pathes.json for require config file")
}
let pathes = JSON.parse(fs.readFileSync('./core/settings/pathes.json', { encoding: 'utf8' }))
if(!pathes.CONFIG_PATH){
    throw new Error("App.start() pathes.json doesn't contain CONFIG_PATH")
}

let pathConfig = url.pathToFileURL(path.resolve(pathes.CONFIG_PATH)).href

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
HttpClient.setConfig(pathConfig)
SocketClient.setConfig(pathConfig)
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

/*const __dirname = (new url.URL('.', import.meta.url).pathname).replace(/^\/|\/$/g, '')
CONFIG.ROOT = __dirname
const routes=[];
routes[CONFIG.DOMAIN_NAME]= (await import('./core/settings/routes.js')).default
const app = new App(routes);*/


/*import Model from './core/lib/model_new.js'
import { UserData } from './models/extends/model.extends.js'

let query = UserData.request({
    select:{
        params:['user','user_id',{
            sum:{
                select:{
                    params:['comment','title','content'],
                    tb:UserData
                }
            }
        }   
    ]},
    where:{
        and:[
            {field:'user_id',condition:'=',prepare:10},
            {field:'user_age',condition:'=',prepare:18}
        ],
        or:{
            and:[{
                    field:'user_id',
                    condition:'=',
                    inner:{
                        select:{
                            params:['article','article_id','article_name'],
                            tb:'article'
                        }
                    }
                },
                {field:'user_age',condition:'<',prepare:18}
            ]
        }
    }
}).query()

//let query = UserData.select(['user_id','user_name',q=>{q.select('aaaaa',UserData)}]).where('age','=',10).and('name','=','asdasd').orBetween('@count',[1,10]).query()


*/






