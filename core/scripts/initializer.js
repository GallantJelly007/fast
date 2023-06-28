//@ts-check
import * as fs from 'fs'

try{
    if(process.env.INIT_CWD){
        let root = process.env.INIT_CWD
        if (!fs.existsSync(root)) {
            fs.mkdir(`${root}/src`,{recursive: true}, (err) => {
                if (err) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                if(!fs.existsSync(`${root}/src/project-config.mjs`)){
                    fs.writeFile(`${root}/src/project-config.mjs`,createConfig(`${root}/src`),(err)=>{
                        if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                        let configPath = {CONFIG_PATH:`${root}/src/project-config.mjs`}
                        fs.writeFile('../settings/pathes.json',JSON.stringify(configPath),err=>{
                            if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                        })
                    })
                }
                if(!fs.existsSync(`${root}/src/routes`)){
                    fs.mkdirSync(`${root}/src/routes`,{recursive: true})
                }
                if(!fs.existsSync(`${root}/src/public`)){
                    fs.mkdirSync(`${root}/src/public`,{recursive: true})
                }
                if(!fs.existsSync(`${root}/src/storage/resources`)){
                    fs.mkdirSync(`${root}/src/storage/resources`,{recursive: true})
                }
                if(!fs.existsSync(`${root}/src/controllers`)){
                    fs.mkdirSync(`${root}/src/controllers`,{recursive: true})
                }
                if(!fs.existsSync(`${root}/src/controllers/ExampleController.mjs`)){
                    fs.copyFile('../base/ExampleController',`${root}/src/controllers/ExampleController.mjs`,(err)=>{
                        if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                    })
                }
                if(!fs.existsSync(`${root}/src/behaviours`)){
                    fs.mkdirSync(`${root}/src/behaviours`,{recursive: true})
                }
                if(!fs.existsSync(`${root}/src/behaviours/ExampleBehaviour.mjs`)){
                    fs.writeFile('../base/ExampleBehaviour.mjs',`${root}/src/behaviours/ExampleBehaviour.mjs`,(err)=>{
                        if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                    })
                }
                if(!fs.existsSync(`${root}/src/storage/sessions`)){
                    fs.mkdirSync(`${root}/src/storage/sessions`,{recursive: true})
                }
                if(!fs.existsSync(`${root}/src/routes.mjs`)){
                    fs.writeFile('../base/routes.mjs',`${root}/src/routes/routes.mjs`,(err)=>{
                        if(err!=null) console.error(`INIT COMMAND ERR:\n${err.stack}`)
                    })
                }
                
            });
        }
    }else{
        throw new Error('The command cannot be executed! The process.env.INIT_CWD property is missing')
    }
}catch(err){
    console.error(`INIT COMMAND ERR:\n${err.stack}`)
}

function createConfig(root){
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
        static DOMAIN_NAME='fast'
        /**Протокол для websocket*/
        static PROTOCOL_SOCKET='ws'
        /**Путь к корневой папке проекта*/
        static ROOT='${root}'
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
        static LOCALE_PATH = 'storage/resources'
        /**Стандартный язык локализации*/
        static LOCALE='ru'
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