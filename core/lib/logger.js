//@ts-check
import * as fs from 'fs'
import Time from './time.js'
import CONFIG from '../settings/config.js'

export default class Logger{
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
        return new Promise((resolve,reject)=>{
            let textObj=''
            try{
                textObj = obj&&obj!=null?JSON.stringify(obj):''
            }catch(err){
                textObj = obj&&obj!=null?obj.toString():''
            }
            if(!fs.existsSync(CONFIG.ROOT+'/log')){
                fs.mkdir(CONFIG.ROOT+'/log',755,err=>{
                    if(err!=null) reject(err)
                    else resolve(true)
                })
            }
            let time = new Time()
            let t = time.format('${H:m:S}')
            let fileName = `log-${time.format('${D.M.Y}')}.txt`
            if(!fs.existsSync(CONFIG.ROOT+`/log/${fileName}`)){
                fs.writeFile(CONFIG.ROOT+`/log/${fileName}`,`${name.toUpperCase()}:\nВывод-${t}`+(url!=''?`URL: ${url}\n`:'')+`-----------------------------------------------------------------\n${text!=''?`${text}: `:''}${textObj}\n`,(err)=>{
                    if(err!=null) reject(err)
                    else resolve(true)
                })
            }else{
                fs.appendFile(CONFIG.ROOT+`/log/${fileName}`,`${name.toUpperCase()}:\nВывод-${t}`+(url!=''?`URL: ${url}\n`:'')+`-----------------------------------------------------------------\n${text!=''?`${text}: `:''}${textObj}\n`,(err)=>{
                    if(err!=null) reject(err)
                    else resolve(true)
                })
            } 
            if(CONFIG.DEBUG)
                console.log(color, `${name.toUpperCase()}:\n`+(url!=''?`URL: ${url}\n`:'')+`-----------------------------------------------------------------\n${text!=''?`${text}: `:''}${textObj}\n`)
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
     * Имя модуля или приложения откуда вызывается logger
     * @param {Error} err 
     * Объект данных (необязательно)
     * @param {string} url 
     * Адрес входящего запроса (необязательно)
     * @returns 
     */
    static error(name,err,url=''){
        return new Promise((resolve,reject)=>{
            if(!fs.existsSync(CONFIG.ROOT+'/log')){
                fs.mkdir(CONFIG.ROOT+'/log',755,err=>{
                    if(err!=null)reject(err) 
                    else resolve(true)
                });
            }
            let time = new Time()
            let t = time.format('${H:m:S}')
            let fileName = `log-${time.format('${D.M.Y}')}.txt`
            if(!fs.existsSync(CONFIG.ROOT+`/log/${fileName}`)){
                fs.writeFile(CONFIG.ROOT+`/log/${fileName}`,`${name.toUpperCase()}:\nОшибка-${t} ${url!=''?`, URL: ${url}`:''}: ${err.name} / ${err.message}--------------------------------------------------------------\n${err.stack}\n--------------------------------------------------------------\n\n`,(err)=>{
                    if(err!=null) reject(err) 
                    else resolve(true)
                })
            }else{
                fs.appendFile(CONFIG.ROOT+`/log/${fileName}`,`${name.toUpperCase()}:\nОшибка-${t} ${url!=''?`, URL: ${url}`:''}: ${err.name} / ${err.message}--------------------------------------------------------------\n${err.stack}\n--------------------------------------------------------------\n\n`,(err)=>{
                    if(err!=null) reject(err) 
                    else resolve(true)
                })
            } 
            if(CONFIG.DEBUG)
                console.log('\x1b[31m%s\x1b[0m', `${name.toUpperCase()}:\nError: ${err.name} / ${err.message}${url!=''?`\nURL: ${url}\n`:''}-----------------------------------------------------------------\n${err.stack}\n-----------------------------------------------------------------\n\n`)
        })
    }
}

export class UrlError extends Error{
    url

    constructor(message,url){
        super(message)
        this.url=url
    }
}