//@ts-check

import Logger from "./logger.mjs";
import url from 'url'

export default class Translate{ 
    #lang
    #strings={}
    static #CONFIG

    static async setConfig(pathToConfig){
        try{
            Translate.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('Translate.setConfig()',error)
        }
    }
    
    constructor(lang){
        this.#lang = typeof lang === 'string' && lang!="" ? lang : Translate.#CONFIG.LOCALE;
    } 

    async init(){
        try{
            if(Translate.#CONFIG.IS_ON_STATIC_TRANSLATE){
                this.#strings = (await import(url.pathToFileURL(Translate.#CONFIG.ROOT).href+'/'+Translate.#CONFIG.LOCALE_PATH+'/locale_'+this.#lang+'.js')).default
                return true
            }else{ 
                return false
            }
        }catch(err){
            throw err
        }
    }

    t(field,params=[]){
        try{
            if(this.#strings.hasOwnProperty(field)){
                let text = this.#strings[field]
                if(params!=null){
                    params = Array.isArray(params)?params:[params]
                    for(let i=0;i<params.length;i++){
                        let reg = new RegExp(`{\\$${i}}`,'g')
                        text = text.replace(reg,params[i])
                    }
                }
                return text
            }else{
                return ''
            }
        }catch(err){
            Logger.error('Translate.t()', err)
            return ''
        }
    }
}