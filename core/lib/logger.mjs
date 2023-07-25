//@ts-check
import * as fs from 'fs'
import Time from 'timelex'
import PATHES from '../settings/pathes.mjs';

export default class Logger{

    static #logFolder='';
    static isDebug = true;
    
    static async setLogPath(pathFolder){
        if(!fs.existsSync(pathFolder)){
            fs.mkdirSync(pathFolder,{recursive:true})
            return true
        }else if(fs.lstatSync(pathFolder).isDirectory()){
            Logger.#logFolder = pathFolder
            return true
        }
        return false
    }

    /**
     * Базовый метод вывода для логера
     * @param {string} name 
     * @param {string} text 
     * @param {any} obj 
     * @param {string} url 
     * @param {string} color 
     * @returns 
     */
    static #baseDebug(name,text,obj=null,url='',color){
        return new Promise(async (resolve,reject)=>{
            if(Logger.#logFolder==''){
                if(!PATHES.LOG_FOLDER || PATHES.LOG_FOLDER=='')
                    reject(new Error('Не была выполнена команда инициализации, для корректной работы выполните команду'))
                await Logger.setLogPath(PATHES.LOG_FOLDER)
            }
            let textObj=''
            try{
                textObj = obj&&obj!=null?JSON.stringify(obj):''
            }catch(err){
                textObj = obj&&obj!=null?obj.toString():''
            }
            let time = new Time()
            let t = time.format('${H:m:S}')
            let fileName = `log-${time.format('${D.M.Y}')}.txt`
            if(Logger.isDebug)
                console.log(color, `${name.toUpperCase()}:\n`+(url!=''?`URL: ${url}\n`:'')+`-----------------------------------------------------------------\n${text!=''?`${text}`:''}${textObj!=''?`: ${textObj}`:''}\n`)
            if(!fs.existsSync(`${Logger.#logFolder}/${fileName}`)){
                fs.writeFile(`${Logger.#logFolder}/${fileName}`,`${name.toUpperCase()}:\nВывод-${t}`+(url!=''?`URL: ${url}\n`:'')+`-----------------------------------------------------------------\n${text!=''?`${text}`:''}${textObj!=''?`: ${textObj}`:''}\n`,(err)=>{
                    if(err!=null) reject(err)
                })
            }else{
                fs.appendFile(`${Logger.#logFolder}/${fileName}`,`${name.toUpperCase()}:\nВывод-${t}`+(url!=''?`URL: ${url}\n`:'')+`-----------------------------------------------------------------\n${text!=''?`${text}`:''}${textObj!=''?`: ${textObj}`:''}\n`,(err)=>{
                    if(err!=null) reject(err)
                })
            } 
            resolve(true)
        })
    }

    /**
     * Метод для вывода сообщения в файл и консоль (при условии что CONFIG.DEBUG = true)
     * @param {string} name 
     * Имя модуля или приложения откуда вызывается logger
     * @param {string} text 
     * Текст сообщения
     * @param {any} obj 
     * Объект данных (необязательно)
     * @param {string} url 
     * Адрес входящего запроса (необязательно)
     * @returns 
     */
    static debug(name,text,obj=null,url=''){
        return this.#baseDebug(name,text,obj,url,'\x1b[36m%s\x1b[0m')
    }

    /**
     * Метод для вывода сообщения в файл и консоль (при условии что CONFIG.DEBUG = true)
     * @param {string} name 
     * Имя модуля или приложения откуда вызывается logger
     * @param {string} text 
     * Текст сообщения
     * @param {any} obj 
     * Объект данных (необязательно)
     * @param {string} url 
     * Адрес входящего запроса (необязательно)
     * @returns 
     */
    static warning(name,text,obj=null,url=''){
        return this.#baseDebug(name,text,obj,url,'\x1b[33m%s\x1b[0m')
    }

    /**
     * Метод для вывода ошибки в файл и консоль (при условии что CONFIG.DEBUG = true)
     * @param {string} name 
     * Название (функции, модуля, и др. информация) откуда вызывается logger
     * @param {Error} err 
     * Объект данных (необязательно)
     * @param {string} url 
     * Адрес входящего запроса (необязательно)
     * @returns 
     */
    static error(name,err,url=''){
        return new Promise(async (resolve,reject)=>{
            if(Logger.#logFolder==''){
                if(!PATHES.LOG_FOLDER || PATHES.LOG_FOLDER=='')
                    reject(new Error('Не была выполнена команда инициализации, для корректной работы выполните команду'))
                await Logger.setLogPath(PATHES.LOG_FOLDER)
            }
            let time = new Time()
            let t = time.format('${H:m:S}')
            let fileName = `log-${time.format('${D.M.Y}')}.txt`
            if(Logger.isDebug)
                console.log('\x1b[31m%s\x1b[0m', `${name.toUpperCase()}:\nОшибка - ${t} (${err?.name??''})\n${url!=''?`, URL: ${url}\n`:''}---------------------------STACK-TRACE---------------------------\n${err?.stack??''}\n-----------------------------------------------------------------\n\n`)
            if(!fs.existsSync(`${Logger.#logFolder}/${fileName}`)){
                fs.writeFile(`${Logger.#logFolder}/${fileName}`,`${name.toUpperCase()}:\nОшибка - ${t} (${err?.name??''})\n${url!=''?`, URL: ${url}\n`:''}---------------------------STACK-TRACE---------------------------\n${err?.stack??''}\n--------------------------------------------------------------\n\n`,(err)=>{
                    if(err!=null) reject(err) 
                })
            }else{
                fs.appendFile(`${Logger.#logFolder}/${fileName}`,`${name.toUpperCase()}:\nОшибка - ${t} (${err?.name??''})\n${url!=''?`, URL: ${url}\n`:''}---------------------------STACK-TRACE---------------------------\n${err?.stack??''}\n--------------------------------------------------------------\n\n`,(err)=>{
                    if(err!=null) reject(err) 
                })
            } 
            resolve(true)
        })
    }
}

export class UrlError extends Error{
    constructor(message,url){
        super(message)
        this.url=url
    }
}