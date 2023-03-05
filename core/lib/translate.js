//@ts-check

module.exports = class Translate{ 
    #config;
    #lang=null
    #strings=[]

    constructor(config,lang=null){
        this.#config=config;
        this.#lang = lang;
        let lng=this.#lang!=null&&this.#lang!=""?this.#lang:this.#config.DEFAULT_LOCALE
        if(this.#config.IS_ON_STATIC_TRANSLATE){
            this.#strings = require(this.#config.LOCALE_PATH+'/'+lng)
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