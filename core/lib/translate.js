export default class Translate{ 
    #config=null
    #lang=null
    #strings=null

    constructor(config,lang=null){
        this.#config=config;
        this.#lang = lang;
        let lng=this.#lang!=null&&this.#lang!=""?this.#lang:this.#config.DEFAULT_LOCALE
        this.#strings = require(this.#config.LOCALE_PATH+'/'+lng)
    } 
    t(field,params=null){
        if(this.#strings.hasOwnProperty(field)){
            let text = this.#strings[field]
            params = Array.isArray(params)?params:[params]
            for(let i=0;i<params.length;i++){
                let reg = new RegExp(`{\\$${i}}`,'g')
                text = text.replace(reg,params[i])
            }
            return text
        }else{
            return false
        }
    }
}