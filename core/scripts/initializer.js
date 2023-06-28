//@ts-check
import * as fs from 'fs'

try{
    if(process.env.INIT_CWD){
        let rootProject = process.env.INIT_CWD.toString().split(/[\/\\]*node_modules/)[0].replace(/[\\]+/g,'/')
        let rootModule = process.env.INIT_CWD.replace(/[\\]+/g,'/')
        console.log(rootProject)
        console.log(rootModule)
        if (fs.existsSync(rootProject)) {
            console.log(rootProject)
            if(!fs.existsSync(`${rootProject}/src`)){
                fs.mkdir(`${rootProject}/src`,{recursive: true}, (err) => {
                    if (err) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                    if(!fs.existsSync(`${rootProject}/project-config.mjs`)){
                        fs.writeFile(`${rootProject}/project-config.mjs`,createConfig({
                            root:`${rootProject}/src`,
                            controllersPath:`${rootProject}/src/controllers`,
                            storagePath:`${rootProject}/src/storage`,
                            sessionsPath:`${rootProject}/src/storage/sessions`
                        }),(err)=>{
                            if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                        })
                    }
                    fs.writeFile(`${rootModule}/core/settings/pathes.mjs`,createPathes(rootModule,`${rootProject}/project-config.mjs`),err=>{
                        if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                    })
                    if(!fs.existsSync(`${rootProject}/src/routes`)){
                        fs.mkdirSync(`${rootProject}/src/routes`,{recursive: true})
                    }
                    if(!fs.existsSync(`${rootProject}/src/public`)){
                        fs.mkdirSync(`${rootProject}/src/public`,{recursive: true})
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
                })
            }
        }
    }else{
        throw new Error('The command cannot be executed! The process.env.INIT_CWD property is missing')
    }
}catch(err){
    console.error(`INIT COMMAND ERR:\n${err.stack}`)
}

function createConfig(params){
    return `export default class CONFIG{
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
        /**Имя БД*/
        static DB_NAME='up'
        /**Пользователь БД*/
        static DB_USER='user'
        /**Хост БД*/
        static DB_HOST='localhost'
        /**Пароль БД*/
        static DB_PASS='*********'
        /**Порт для БД*/
        static DB_PORT=5432
        /**Порт для HTTP сервера*/
        static PORT=3003
        /**Порт для WEBSOCKET сервера*/
        static PORT_SOCKET=3004
        /**Ключ для подписи Cookie*/
        static COOKIE_PASS='*********'
        /**Переменная для использования Secure куки(только для https)*/
        static COOKIE_SECURE=false
        /**Переменная для включения подписей куки*/
        static COOKIE_SIGN=false
        /**Доменное имя без протокола*/
        static DOMAIN_NAME='localhost'
        /**Протокол для websocket*/
        static PROTOCOL_SOCKET='ws'
        /**Путь к корневой папке проекта*/
        static ROOT='${params.root}'
        /**Используемый протокол http|https*/
        static PROTOCOL = 'http'
        /**Полное доменное имя с протоколом*/
        static DOMAIN = this.PROTOCOL+'://'+this.DOMAIN_NAME
        /**Кол-во дней жизни access токена*/
        static LTT=3
        /**Кол-во дней жизни refresh токена*/
        static LTRT=30
        /**Переменная для включения статического перевода, для правильной работы нужны файлы локализации и установленныне переменные LOCALE_PATH и LOCALE*/
        static IS_ON_STATIC_TRANSLATE=true;
        /**Путь к папке с файлами локализации*/
        static LOCALE_PATH = 'storage/resources/locales'
        /**Путь к папке с контроллерами*/
        static CONTROLLERS_PATH='${params.controllersPath}'
        /**Стандартный язык локализации*/
        static STORAGE_PATH='${params.storagePath}'
        /**Стандартный язык локализации*/
        static LOCALE='ru'
        /**Путь к хранилищу сессий*/
        static SESSIONS_PATH='${params.sessionsPath}'
        /**Время в часах после которых сессия становится не действительной*/
        static SESSION_CLEAN_TIME=24
        /**Массив путей для статических файлов*/
        static STATIC_PATHS = ['public']
        /**Разрешенные форматы для статических файлов отправляемых клиенту в формате Map, где ключ это формат а значение MIME-тип*/
        static ALLOWED_STATIC_FORMATS=new Map([
            ['.png','image/png'],
            ['.svg','image/svg+xml'],
            ['.jpg','image/jpeg'],
            ['.jpeg','image/jpeg'],
            ['.ico','image/x-icon'],
            ['.css','text/css'],
            ['.js','application/javascript'],
            ['.otf','font/otf'],
            ['.ttf','font/ttf'],
        ])
        /**Разрешенные форматы для загрузки файлов на сервер в формате Map, где ключ это формат а значение MIME-тип*/
        static ALLOWED_UPLOAD_FORMATS=new Map([
            ['.png','image/png'],
            ['.svg','image/svg+xml'],
            ['.jpg','image/jpeg'],
            ['.jpeg','image/jpeg'],
        ])
        /**Ограничение максимального размера файлов в MB*/
        static MAX_FILE_SIZE=10 //MB
        /** Ограничение минимального размера файлов в MB*/
        static MIN_FILE_SIZE=0 //MB
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

function createPathes(rootModule,configPath){
    return `export default class PATHES{
    static ROOT_MODULE = '${rootModule}'
    static CONFIG_PATH = '${configPath}'
}`
}