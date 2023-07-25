//@ts-check
import * as fs from 'fs'
import url from 'url'

import Model from '../lib/model.mjs'

export function init(){
    try{
        if(process.env.INIT_CWD){
            let rootProject = process.env.INIT_CWD.toString().split(/[\/\\]*node_modules/)[0].replace(/[\\]+/g,'/')
            let rootModule = process.env.INIT_CWD.replace(/[\\]+/g,'/')
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
                                modelPath:pathes.MODEL_PATH
                            }),(err)=>{
                                if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                            })
                        }
                        fs.writeFile(`${rootModule}/core/settings/pathes.mjs`,createPathes(rootModule,`${rootProject}/project-config.mjs`,`${rootProject}/log`),err=>{
                            if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                        })
                        if(!fs.existsSync(`${rootProject}/src/routes`)){
                            fs.mkdirSync(`${rootProject}/src/routes`,{recursive: true})
                        }
                        if(!fs.existsSync(`${rootProject}/src/public/css`)){
                            fs.mkdirSync(`${rootProject}/src/public/css`,{recursive: true})
                        }
                        if(!fs.existsSync(`${rootProject}/src/views`)){
                            fs.mkdirSync(`${rootProject}/src/views`,{recursive: true})
                        }
                        if(!fs.existsSync(`${rootProject}/src/storage/resources`)){
                            fs.mkdirSync(`${rootProject}/src/storage/resources`,{recursive: true})
                        }
                        if(!fs.existsSync(`${rootProject}/src/controllers`)){
                            fs.mkdirSync(`${rootProject}/src/controllers`,{recursive: true})
                        }
                        if(!fs.existsSync(`${rootProject}/src/controllers/ExampleController.mjs`)){
                            fs.copyFile(`${rootModule}/core/base/ExampleController.mjs`,`${rootProject}/src/controllers/ExampleController.mjs`,(err)=>{
                                if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                            })
                        }
                        if(!fs.existsSync(`${rootProject}/src/behaviours`)){
                            fs.mkdirSync(`${rootProject}/src/behaviours`,{recursive: true})
                        }
                        if(!fs.existsSync(`${rootProject}/src/behaviours/ExampleBehaviour.mjs`)){
                            fs.copyFile(`${rootModule}/core/base/ExampleBehaviour.mjs`,`${rootProject}/src/behaviours/ExampleBehaviour.mjs`,(err)=>{
                                if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                            })
                        }
                        if(!fs.existsSync(`${rootProject}/src/storage/sessions`)){
                            fs.mkdirSync(`${rootProject}/src/storage/sessions`,{recursive: true})
                        }
                        if(!fs.existsSync(`${rootProject}/src/routes.mjs`)){
                            fs.copyFile(`${rootModule}/core/base/routes.mjs`,`${rootProject}/src/routes/routes.mjs`,(err)=>{
                                if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                            })
                        }
                        if(!fs.existsSync(`${rootProject}/index.js`)){
                            fs.copyFile(`${rootModule}/core/base/index.js`,`${rootProject}/index.js`,(err)=>{
                                if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                            })
                        }
                        if(!fs.existsSync(`${rootProject}/src/views/example.html`)){
                            fs.copyFile(`${rootModule}/core/base/example.html`,`${rootProject}/src/views/example.html`,(err)=>{
                                if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                            })
                        }
                        if(!fs.existsSync(`${rootProject}/src/public/css/style.css`)){
                            fs.copyFile(`${rootModule}/core/base/style.css`,`${rootProject}/src/public/css/style.css`,(err)=>{
                                if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                            })
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
            let rootProject = process.env.INIT_CWD.toString().split(/[\/\\]*node_modules/)[0].replace(/[\\]+/g,'/')
            let rootModule = process.env.INIT_CWD.replace(/[\\]+/g,'/')
            if (fs.existsSync(`${rootProject}/project-config.mjs`) && fs.existsSync(`${rootModule}/core/settings/pathes.mjs`)) {
                let newPaths = getConfigPathes(rootProject)
                let config = fs.readFileSync(`${rootProject}/project-config.mjs`,{encoding:'utf-8'})
                for(let key in newPaths){
                    if(new RegExp(`${key}`).test(config)){
                        let reg = new RegExp(`(${key}\\s*=\\s*)([^\r\n]*)`)
                        config = config.replace(reg,`$1'${newPaths[key]}'`)
                    }else{
                        config = config.replace(/({)([\W\w\s\S]*)(})/,`$1$2\n\t\t/**Auto-added repath property*/\n\t\tstatic ${key} = '${newPaths[key]}'\n$3`)
                    }
                    if(!fs.existsSync(newPaths[key])){
                        fs.mkdirSync(newPaths[key],{recursive: true})
                    }
                }
                fs.writeFileSync(`${rootProject}/project-config.mjs`,config)
                fs.writeFileSync(`${rootModule}/core/settings/pathes.mjs`,createPathes(rootModule,`${rootProject}/project-config.mjs`,`${rootProject}/log`))
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
        ROOT:`${rootProject}/src`,
        CONTROLLER_PATH:`${rootProject}/src/controllers`,
        TMP_PATH: `${rootProject}/src/temp`,
        LOCALE_PATH: `${rootProject}/src/storage/resources/locales`,
        STORAGE_PATH: `${rootProject}/src/storage`,
        SESSION_PATH: `${rootProject}/src/storage/sessions`,
        MODEL_PATH: `${rootProject}/src/models`
    }
}

function createConfig(params){
    return `export default class CONFIG{
        /**Путь к корневой папке проекта*/
        static ROOT='${params.root}'
        /**Переменная для логера*/
        static DEBUG=true
        /**Наименование приложения-сайта*/
        static SITE_NAME='NAME SITE'
        /**Указывает наименование отправителя для почты*/
        static MAIL_NAME='MAIL NAME'
        /**Пароль пользователя почтового сервера*/
        static MAIL_PASS='pass'
        /**Логин пользователя почтового сервера*/
        static MAIL_USER='user'
        /**Адрес почтового сервера*/
        static MAIL_HOST='smtp.example.com'
        /**Логический параметр. Указывает передавать ли сообщение по защищенному соединению, в зависмости от значения нужно установить MAIL_PORT */
        static MAIL_SECURE=true
        /**Порт почтового сервера*/
        static MAIL_PORT=465
        /**Включить использование моделей для подключения к БД
        static MODEL_ENABLED = true
        /**Путь к папке для сохранения моделей*/
        static MODEL_PATH = '${params.modelPath}'
        /**Имя БД*/
        static DB_NAME='up'
        /**Пользователь БД*/
        static DB_USER='user'
        /**Хост БД*/
        static DB_PASS='*********'
        /**Порт для БД*/
        static DB_HOST='localhost'
        /**Пароль БД*/
        static DB_PORT=5432
        /**Порт для HTTP сервера*/
        static PORT=3003
        /**Порт для WEBSOCKET сервера*/
        static PORT_SOCKET=3004
        /**Доменное имя без протокола*/
        static DOMAIN_NAME='localhost'
        /**Используемый протокол http|https*/
        static PROTOCOL = 'http'
        /**Протокол для websocket*/
        static PROTOCOL_SOCKET='ws'
        /**Полное доменное имя с протоколом*/
        static DOMAIN = this.PROTOCOL+'://'+this.DOMAIN_NAME
        /**Включить мехнизм Cookie*/
        static COOKIE_ENABLED = true
        /**Ключ для подписи Cookie*/
        static COOKIE_PASS='*********'
        /**Переменная для использования Secure куки(только для https)*/
        static COOKIE_SECURE=false
        /**Переменная для включения подписей куки*/
        static COOKIE_SIGN=false
        /**Кол-во дней жизни access токена*/
        static LTT=3
        /**Кол-во дней жизни refresh токена*/
        static LTRT=30
        /**Путь для хранения временных файлов*/
        static TMP_PATH = '${params.tmpPath}'
        /**Интервал очистки временных файлов в минутах*/
        static TMP_CLEAN_INTERVAL = 1440
        /**Переменная для включения статического перевода, для правильной работы нужны файлы локализации и установленныне переменные LOCALE_PATH и LOCALE*/
        static IS_ON_STATIC_TRANSLATE=true;
        /**Путь к папке с файлами локализации*/
        static LOCALE_PATH = '${params.localePath}'
        /**Путь к папке с контроллерами*/
        static CONTROLLER_PATH='${params.controllerPath}'
        /**Включить локальное хранилище*/
        static STORAGE_ENABLED = true
        /**Путь к локальному хранилищу*/
        static STORAGE_PATH='${params.storagePath}'
        /**Стандартный язык локализации*/
        static LOCALE='ru'
        /**Включить механизм сессий*/
        static SESSION_ENABLED = true
        /**Путь к хранилищу сессий*/
        static SESSION_PATH='${params.sessionPath}'
        /**Время в минутах после которых сессия становится не действительной*/
        static SESSION_STALE_TIME = 1440
        /**Интервал в минутах для проверки и очистки сессий*/
        static SESSION_CLEAN_INTERVAL = 120 
        /**Массив путей для статических файлов*/
        static STATIC_PATHS = ['public/']
        /**Разрешенные форматы для статических файлов отправляемых клиенту в формате Map, где ключ это формат а значение MIME-тип*/
        static ALLOWED_STATIC_FORMATS=new Map([
            ['image/png', '.png'],
            ['image/svg+xml', '.svg'],
            ['image/jpeg', '.jpeg'],
            ['image/x-icon', '.ico'],
            ['text/css', '.css'],
            ['application/javascript', '.js'],
            ['font/otf', '.otf'],
            ['font/ttf', '.ttf'],
        ])
        /**Разрешенные форматы для загрузки файлов на сервер в формате Map, где ключ это формат а значение MIME-тип*/
        static ALLOWED_UPLOAD_FORMATS=new Map([
            ['image/png', '.png'],
            ['image/svg+xml', '.svg'],
            ['image/jpeg', '.jpeg'],
        ])
        /**Ограничение максимального размера входящих данных в MB*/
        static MAX_POST_SIZE=10 //MB
        /** Наименование полей сохраняемых в сессии для ключей токенов */
        static SES_KEY_A_TOKEN_FIELD = 'keyToken'
        static SES_KEY_R_TOKEN_FIELD = 'keyRtoken'
        /** Наименование для поля-объекта сохраняемого в сессии с данными пользователя */
        static SES_USER_FIELD = 'user'
        /** Наименование полей сохраняемых в куки, и принимаемых из запросов для JWT-токенов */
        static A_TOKEN_FIELD = 'access_token'
        static R_TOKEN_FIELD = 'refresh_token'
    }`
}

function createPathes(rootModule,configPath,logPath){
    return `export default class PATHES{
    static ROOT_MODULE = '${rootModule}'
    static CONFIG_PATH = '${configPath}'
    static LOG_FOLDER = '${logPath}'
}`
}