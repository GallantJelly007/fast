//@ts-check

import Logger from "./logger.js";
import url from 'url'
import CONFIG from "../settings/config.js";

export default class Translate{ 
    #lang
    #strings={}
    
    constructor(lang=null){
        let lng=lang!=null&&lang!=""?lang:CONFIG.LOCALE 
        this.#lang = lng;
    } 

    async init(){
        if(CONFIG.IS_ON_STATIC_TRANSLATE){
            this.#strings = (await import(url.pathToFileURL(CONFIG.ROOT).href+'/'+CONFIG.LOCALE_PATH+'/locale_'+this.#lang+'.js')).default
            return true
        }else{ 
            return false
        }
    }

    t(field,params=[]){
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
            return false
        }
    }
}