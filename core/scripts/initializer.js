//@ts-check
import * as fs from 'fs'
import url from 'url'
import path from 'path'

import Model from '../lib/model.mjs'

export function init(){
    try{
        if(process.env.INIT_CWD){
            let rootProject = path.normalize(process.env.INIT_CWD.toString().split(/[\/\\]*node_modules/)[0]).replace(/\\/g,'/')
            let rootModule = path.normalize(process.env.INIT_CWD).replace(/\\/g,'/')
            if (fs.existsSync(rootProject)) {
                if(!fs.existsSync(`${rootProject}/src`)){
                    fs.mkdir(`${rootProject}/src`,{recursive: true}, (err) => {
                        if (err) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                        if(!fs.existsSync(`${rootProject}/project-config.mjs`)){
                            let pathes = getConfigPathes(rootProject)
                            fs.writeFile(`${rootProject}/project-config.mjs`,createConfig({
                                root: pathes.ROOT,
                                controllerPath:pathes.CONTROLLER_PATH,
                                storagePath:pathes.STORAGE_PATH,
                                sessionPath:pathes.SESSION_PATH,
                                localePath:pathes.LOCALE_PATH,
                                tmpPath:pathes.TMP_PATH,
                                modelPath:pathes.MODEL_PATH,
                                limiterPath:pathes.LIMITER_PATH,
                                statusPath:pathes.STATUS_PAGES_PATH
                            }),(err)=>{
                                if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                            })
                        }
                        fs.writeFile(`${rootModule}/core/settings/pathes.mjs`,createPathesFile(rootModule,`${rootProject}/project-config.mjs`,`${rootProject}/log`),err=>{
                            if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                        })
                        let folderPathes = getCreateFolderPathes(rootProject)
                        for(let createPath of folderPathes){
                            if(!fs.existsSync(createPath)){
                                fs.mkdirSync(createPath,{recursive: true})
                            }
                        }
                        let filePathes = getCreateFilePathes(rootProject,rootModule)
                        for(let createPath of filePathes.keys()){
                            let basePath = filePathes.get(createPath)
                            if(!fs.existsSync(createPath) && basePath){
                                let stat = fs.lstatSync(basePath)
                                if(stat.isDirectory()){
                                    fs.mkdirSync(createPath,{recursive: true})
                                    let files = fs.readdirSync(basePath)
                                    for(let file of files){
                                        let fromPath = path.join(basePath,`/${file}`).replace(/\\/g,'/')
                                        let toPath = path.join(createPath,`/${file}`).replace(/\\/g,'/')
                                        fs.copyFile(fromPath,toPath,(err)=>{
                                            if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                                        })
                                    }
                                }else{
                                    fs.copyFile(basePath,createPath,(err)=>{
                                        if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                                    })
                                }
                            }
                        }
                    })
                }
            }
        }else{
            throw new Error('Command cannot be executed! The process.env.INIT_CWD property is missing')
        }
    }catch(err){
        console.error(`INIT COMMAND ERR:\n${err.stack}`)
    }
}

export function repath(){
    try{
        if(process.env.INIT_CWD){
            let rootProject = path.normalize(process.env.INIT_CWD.toString().split(/[\/\\]*node_modules/)[0]).replace(/\\/g,'/')
            let rootModule = path.normalize(process.env.INIT_CWD).replace(/\\/g,'/')
            if (fs.existsSync(`${rootProject}/project-config.mjs`) && fs.existsSync(`${rootModule}/core/settings/pathes.mjs`)) {
                let newPaths = getConfigPathes(rootProject)
                let config = fs.readFileSync(`${rootProject}/project-config.mjs`,{encoding:'utf-8'})
                for(let key in newPaths){
                    if(new RegExp(`${key}`).test(config)){
                        let reg = new RegExp(`(${key}\\s*=\\s*)([^\r\n]*)`)
                        config = config.replace(reg,`$1'${newPaths[key]}'`)
                    }else{
                        config = config.replace(/({)([\W\w\s\S]*)(})/,`$1$2\n\t\t/* Auto-added repath property */\n\t\tstatic ${key} = '${newPaths[key]}'\n$3`)
                    }
                    if(!fs.existsSync(newPaths[key])){
                        fs.mkdirSync(newPaths[key],{recursive: true})
                    }
                }
                fs.writeFileSync(`${rootProject}/project-config.mjs`,config)
                fs.writeFileSync(`${rootModule}/core/settings/pathes.mjs`,createPathesFile(rootModule,`${rootProject}/project-config.mjs`,`${rootProject}/log`))
                console.log('Repath success finished!')
            }
        }else{
            throw new Error('Command cannot be executed! The process.env.INIT_CWD property is missing')
        }
    }catch(err){
        console.error(`REPATH COMMAND ERR:\n${err.stack}`)
    }
}

export async function modelInit(){
    try{
        if(fs.existsSync('./core/settings/pathes.mjs')){
            let PATHES = (await import('../settings/pathes.mjs')).default
            if(!PATHES.CONFIG_PATH || PATHES.CONFIG_PATH == ''){
                throw new Error("File pathes.mjs doesn't contain CONFIG_PATH")
            }
            let pathConfig = url.pathToFileURL(PATHES.CONFIG_PATH).href
            await Model.setConfig(pathConfig)
            if(await Model.init(true)){
                console.log('Model init success!')
            }
        }else{
            throw new Error('Command cannot be executed! The file pathes.mjs is missing')
        }
    }catch(err){
        console.error(`MODEL INIT COMMAND ERR:\n${err.stack}`)
    }
}

function getConfigPathes(rootProject){
    return {
        ROOT: path.join(rootProject,'/src').replace(/\\/g,'/'),
        CONTROLLER_PATH: path.join(rootProject,'/src/controllers').replace(/\\/g,'/'),
        TMP_PATH: path.join(rootProject,'/src/temp').replace(/\\/g,'/'),
        LOCALE_PATH: path.join(rootProject, '/src/storage/resources/locales').replace(/\\/g,'/'),
        STORAGE_PATH: path.join(rootProject, '/src/storage').replace(/\\/g,'/'),
        SESSION_PATH: path.join(rootProject, '/src/storage/sessions').replace(/\\/g,'/'),
        MODEL_PATH: path.join(rootProject, '/src/models').replace(/\\/g,'/'),
        LIMITER_PATH: path.join(rootProject, '/src/storage/limiter').replace(/\\/g,'/'),
        STATUS_PAGES_PATH: path.join(rootProject, '/src/views/status_pages').replace(/\\/g,'/')
    }
}

function getCreateFolderPathes(rootProject){
    return [
        `${rootProject}/src/views`,
        `${rootProject}/src/public/css`,
        `${rootProject}/src/controllers`,
        `${rootProject}/src/behaviours`,
        `${rootProject}/src/routes`,
        `${rootProject}/src/temp`,
        `${rootProject}/src/storage/resources/locales`,
        `${rootProject}/src/storage/sessions`,
        `${rootProject}/src/models`,
        `${rootProject}/src/storage/limiter`
    ]
}

function getCreateFilePathes(rootProject,rootModule){
    return new Map([
        [`${rootProject}/src/controllers/ExampleController.mjs`, `${rootModule}/core/base/ExampleController.mjs`],
        [`${rootProject}/src/behaviours/ExampleBehaviour.mjs`,`${rootModule}/core/base/ExampleBehaviour.mjs`],
        [`${rootProject}/src/routes/routes.mjs`,`${rootModule}/core/base/routes.mjs`],
        [`${rootProject}/index.js`,`${rootModule}/core/base/index.js`],
        [`${rootProject}/src/views/example.html`,`${rootModule}/core/base/example.html`],
        [`${rootProject}/src/public/css/style.css`,`${rootModule}/core/base/style.css`],
        [`${rootProject}/src/views/status_pages`,`${rootModule}/core/base/status_pages`]
    ])
}

function createConfig(params){
    return `export default class CONFIG{
        /* Путь к корневой папке проекта */
        static ROOT='${params.root}'
        /* Переменная для логера */
        static DEBUG=true
        /* Наименование приложения-сайта */
        static SITE_NAME='NAME SITE'
        /* Указывает наименование отправителя для почты */
        static MAIL_NAME='MAIL NAME'
        /* Пароль пользователя почтового сервера */
        static MAIL_PASS='pass'
        /* Логин пользователя почтового сервера */
        static MAIL_USER='user'
        /* Адрес почтового сервера */
        static MAIL_HOST='smtp.example.com'
        /* Логический параметр. Указывает передавать ли сообщение по защищенному соединению, в зависмости от значения нужно установить MAIL_PORT */
        static MAIL_SECURE=true
        /* Порт почтового сервера */
        static MAIL_PORT=465
        /* Включить использование моделей для подключения к БД */
        static MODEL_ENABLED = true
        /* Путь к папке для сохранения моделей */
        static MODEL_PATH = '${params.modelPath}'
        /* Имя БД */
        static DB_NAME='up'
        /* Пользователь БД */
        static DB_USER='user'
        /* Хост БД */
        static DB_PASS='*********'
        /* Порт для БД */
        static DB_HOST='localhost'
        /* Пароль БД */
        static DB_PORT=5432
        /* Порт для HTTP сервера */
        static PORT=3003
        /* Порт для WEBSOCKET сервера */
        static PORT_SOCKET=3004
        /* Доменное имя без протокол */
        static DOMAIN_NAME='localhost'
        /* Используемый протокол http|https */
        static PROTOCOL = 'http'
        /* Протокол для websocket */
        static PROTOCOL_SOCKET='ws'
        /* Полное доменное имя с протоколом */
        static DOMAIN = this.PROTOCOL+'://'+this.DOMAIN_NAME
        /* Путь к папке со стандартными страницами статусов*/
        static STATUS_PAGES_PATH = '${params.statusPath}'
        /* Включить мехнизм Cookie */
        static COOKIE_ENABLED = true
        /* Ключ для подписи Cookie */
        static COOKIE_PASS='*********'
        /* Переменная для использования Secure куки(только для https) */
        static COOKIE_SECURE=false
        /* Переменная для включения подписей куки */
        static COOKIE_SIGN=false
        /* Кол-во дней жизни access токена */
        static LTT=3
        /* Кол-во дней жизни refresh токена */
        static LTRT=30
        /* Путь для хранения временных файлов */
        static TMP_PATH = '${params.tmpPath}'
        /* Интервал очистки временных файлов в минутах */
        static TMP_CLEAN_INTERVAL = 1440
        /* Переменная для включения статического перевода, для правильной работы нужны файлы локализации и установленныне переменные LOCALE_PATH и LOCALE */
        static IS_ON_STATIC_TRANSLATE = true
        /* Путь к папке с файлами локализации */
        static LOCALE_PATH = '${params.localePath}'
        /* Путь к папке с контроллерами */
        static CONTROLLER_PATH='${params.controllerPath}'
        /* Включить локальное хранилище */
        static STORAGE_ENABLED = true
        /* Путь к локальному хранилищу */
        static STORAGE_PATH='${params.storagePath}'
        /* Стандартный язык локализации */
        static LOCALE='ru'
        /* Включить механизм сессий */
        static SESSION_ENABLED = true
        /* Путь к хранилищу сессий */
        static SESSION_PATH='${params.sessionPath}'
        /* Время в минутах после которых сессия становится не действительной */
        static SESSION_STALE_TIME = 1440
        /* Интервал в минутах для проверки и очистки сессий */
        static SESSION_CLEAN_INTERVAL = 120 
        /* Разрешенные форматы для статических файлов отправляемых клиенту в формате Map, где ключ это формат а значение MIME-тип */
        static ALLOWED_STATIC_FORMATS=[
            ['image/png', '.png'],
            ['image/svg+xml', '.svg'],
            ['image/jpeg', '.jpeg'],
            ['image/x-icon', '.ico'],
            ['text/css', '.css'],
            ['application/javascript', '.js'],
            ['application/javascript', '.mjs'],
            ['font/otf', '.otf'],
            ['font/ttf', '.ttf'],
        ]
        /* Разрешенные форматы для загрузки файлов на сервер в формате Map, где ключ это формат а значение MIME-тип */
        static ALLOWED_UPLOAD_FORMATS=[
            ['image/png', '.png'],
            ['image/svg+xml', '.svg'],
            ['image/jpeg', '.jpeg'],
        ]
        /* Ограничение максимального размера входящих данных в MB*/
        static MAX_POST_SIZE=10 //MB
        /* Наименование полей сохраняемых в сессии для ключей токенов */
        static SES_KEY_A_TOKEN_FIELD = 'keyToken'
        static SES_KEY_R_TOKEN_FIELD = 'keyRtoken'
        /* Наименование для поля-объекта сохраняемого в сессии с данными пользователя */
        static SES_USER_FIELD = 'user'
        /* Наименование полей сохраняемых в куки, и принимаемых из запросов для JWT-токенов */
        static A_TOKEN_FIELD = 'access_token'
        static R_TOKEN_FIELD = 'refresh_token'
        /* Настройки ограничителя запросов */
        static LIMITER_ENABLED = true
        /* Интервал отслеживания кол-ва запросов (мин.) */
        static LIMITER_TRACK_INTERVAL = 5
        /* Максимально допустимый лимит запросов за указанный временной интервал */
        static LIMITER_MAX_ALLOW_REQUEST = 250
        /* Количество запросов в течении интервала после которого IP будет заблокирован */
        static LIMITER_BLOCK_LIMIT = 350
        /* Время блокировки IP в минутах */
        static LIMITER_BLOCK_TIME = 1440
        /* Путь к папке для сохранения данных ограничителя */
        static LIMITER_PATH = '${params.limiterPath}'
        /* Интервал для очистки хранилища IP в минутах */
        static LIMITER_CLEAN_INTERVAL = 30 
        /* Время в минутах прошедшее с последнего запроса, после которого можно удалить IP из списка */
        static LIMITER_STALE_IP = 60
    }`
}

function createPathesFile(rootModule,configPath,logPath){
    return `export default class PATHES{
    static ROOT_MODULE = '${rootModule}'
    static CONFIG_PATH = '${configPath}'
    static LOG_FOLDER = '${logPath}'
}`
}