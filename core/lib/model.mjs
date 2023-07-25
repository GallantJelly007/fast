//@ts-check

import pg from 'pg'
import * as fs from 'fs'
import NamingCase from './naming.mjs'
import Logger from './logger.mjs'

/**
 * @class Model
 */
export default class Model {
    static table = null
    static primary = null
    #position = 1
    #lastQuery = ''
    #data = []
    #query = ''
    static #CONFIG
    static #poolData=[]
    static #queryPool = []
    static classesNamingType = NamingCase.cases.PASCAL_CASE
    static namingType = NamingCase.cases.CAMEL_CASE

    static async setConfig(pathToConfig){
        try{
            Model.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('Model.setConfig()',error)
        }
        await Connect.setConfig(pathToConfig)
    }

    /**
     * Функция для инициализации классов модели
     * @param {boolean} isCreateModels
     * Переменная указывающая нужно ли создавать файл с моделями
     * @param {string} modelCreateFolder
     * Путь к папке для создания файла с моделями БД (относительно корневой папки проекта, например: models/extends)
     * @param {object} naming
     * Объект параметров для установки стилей именования при создании классов моделей
     * @param {string} naming.classesNamingType
     * Стиль именования классов (по умолчанию Pascal-Case)
     * @param {string} naming.propNamingType
     * Стиль именования свойств и полей класса (по умолчанию Camel-Case)
     */
    static async init(isCreateModels=false, modelCreateFolder='',naming={classesNamingType:Model.classesNamingType,propNamingType:Model.namingType}){
        let params = ['DB_USER','DB_HOST','DB_NAME','DB_PASS','DB_PORT']
        try{
            for(let key of params){
                if(!Model.#CONFIG[key]||Model.#CONFIG[key]==''){
                    throw new Error(`param ${key} no find in config file or empty value`)
                }
            }
            if(isCreateModels){
                modelCreateFolder = modelCreateFolder == '' ? Model.#CONFIG.MODEL_PATH : modelCreateFolder
                modelCreateFolder = modelCreateFolder.replace(/^[\.\/]+/,'').replace(/[\/]+$/,'')
                if(!fs.existsSync(modelCreateFolder)){
                    fs.mkdirSync(modelCreateFolder,{recursive:true})
                }
                let columns = await Model.#getTableInfo()
                let table=null
                let script = `import Model from 'fastflash'\n`
                for(let col of columns){
                    if(table==null||col.table_name!=table){
                        script+=table!=null?'\n}\n\n':''
                        table = col.table_name
                        let name = NamingCase.toNaming(table,naming.classesNamingType)
                        let key = await Model.#getTablePrimary(table)
                        if(key){
                            key=key[0].pkey
                            script+=`export class ${name} extends Model{\n   static table = '${table}'\n   static primary='${key}'`
                        }
                    }
                    script+=`\n   ${NamingCase.toNaming(col.column_name,naming.propNamingType)} = null`
                }
                script+=`\n}`
                fs.writeFileSync(`${modelCreateFolder}/model.extends.mjs`,script,{encoding:'utf-8'})
                return true
            }else{
                return true
            }
        }catch(err){
            Logger.error('Model.init()',err)
            return false
        }
    }

    static #getTableInfo(){
        return new Promise((resolve, reject) => {
            let connect = new Connect()
            connect.con().then(connect => {
                connect.query(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name`, [],result => {
                    connect.client.end()
                    if (!result) resolve(false)
                    else resolve(result.rows)
                })
            }).catch(err =>{
                Logger.error('Model.#getTableInfo',err)
                resolve(false)
            })
        })
    }

    static #getTablePrimary(tableName){
        return new Promise((resolve,reject)=>{
            let connect = new Connect()
            connect.con().then(connect => {
                connect.query(
                `SELECT a.attname AS pkey
                 FROM   pg_index i
                 JOIN   pg_attribute a ON a.attrelid = i.indrelid
                                     AND a.attnum = ANY(i.indkey)
                 WHERE  i.indrelid = '${tableName}'::regclass
                 AND    i.indisprimary;`, 
                [],result => {
                    connect.client.end()
                    if (!result) resolve(false)
                    else resolve(result.rows)
                })
            }).catch(err =>{
                Logger.error('Model.#getTablePrimary()',err)
                resolve(false)
            })
            
        })
    }

    /**
    * Определение типа пользователя.
     * @typedef {object} Query
     * @property {Select|Array<Query|any>|string} [select]
     * @property {Update|string} [update]
     * @property {string|Delete} [delete]
     * @property {string|Insert} [insert]
     * @property {string|Query} [sum]
     * @property {string|Query} [max]
     * @property {string|Query} [min]
     * @property {string|Query} [avg]
     * @property {string|Query} [count]
     * @property {Query} [inner]
     * @property {ParamCondition|Where|string} [where]
     * @property {OrderBy} [orderBy]
     * @property {string} [groupBy]
     * @property {ParamCondition|Where|string} [having]
     * @property {number|Query} [limit]
     * @property {number|Query} [offset]
    */
   

    /**
     * @typedef {object} Select
     * @property {Array<any>|Query|string} params
     * @property {Model|string} [tb]
    */

    /**
     * @typedef {object} Update
     * @property {Array<string|Query>|Query|string} set
     * @property {Model|string} [tb]
    */

    /**
     * @typedef {object} Insert
     * @property {Array<any>|any} [values]
     * @property {Array<any>|any} [valuesRaw]
     * @property {Model|string} [tb]
    */

    /**
     * @typedef {object} Delete
     * @property {Model|string} [tb]
    */

    /**
     * @typedef Where
     * @property {Where|Query|Array<ParamCondition>|ParamCondition|string} [and]
     * @property {Where|Query|Array<ParamCondition>|ParamCondition|string} [or]
     * @property {Where|Query|Param} [like]
     * @property {Where|Query|Param} [notLike]
     * @property {Where|Query|Param} [in]
     * @property {Where|Query|Param} [notIn]
     * @property {Where|Query|Param} [between]
     * @property {Where|Query|Param} [notBetween]
     * @property {Where|Query|string} [isNull]
     * @property {Where|Query|string} [isNotNull]
     * @property {Where|Query|string} [isUnknown]
     * @property {Where|Query|string} [isNotUnknown]
     * @property {Where|Query|string} [isTrue]
     * @property {Where|Query|string} [isFalse]
     */

    /**
     * @typedef OrderBy
     * @property {string|Array<string>} field
     * @property {string|Array<string>} direction
     */

    /**
     * @typedef ParamCondition 
     * @property {string} field
     * @property {string} condition
     * @property {any} [prepare]
     * @property {any} [raw]
     * @property {Query} [inner]
     */

    /**
     * @typedef Param 
     * @property {string} field
     * @property {Array<string|Query>|Query|string} params
     */



    #parseRequest(request){
        const orderProps=['field','condition','prepare']
        let req = {}
        for(let prop of orderProps){
            if(request.hasOwnProperty(prop)){
                req[prop]=request[prop]
                delete request[prop]
            }
        }
        request={...req,...request}
        for(let word in request){
            switch(word){
                case 'select':{
                    if(request[word]!==null && Array.isArray(request[word]) && request[word].length){
                        let params = request[word]
                        request[word] = {params:params}
                        this.#query += `SELECT `
                        this.#parseRequest(request[word])
                        this.#query += ` FROM ${this.constructor['table']}`
                    }else if(request[word]!==null && typeof request[word]=='object' && request[word].hasOwnProperty('params')){
                        let tb=''
                        if(request[word].hasOwnProperty('tb')){ 
                            if(typeof request[word].tb=='function'&&request[word].tb.prototype instanceof Model)
                                tb = request[word].tb.table
                            else if(typeof request[word].tb=='string')
                                tb = request[word].tb
                            delete request[word].tb
                        }
                        tb=tb==''?this.constructor['table']:tb        
                        this.#query += `SELECT `
                        this.#parseRequest(request[word])
                        this.#query += ` FROM ${tb}`
                    }else if(typeof request[word]=='string'){
                        this.#query += `SELECT ${request[word]} FROM ${this.constructor['table']}`
                    }
                    break
                }
                case 'insert':{
                    if(typeof request[word]=='object'&&request[word]!==null&&request[word].hasOwnProperty('values')||request[word].hasOwnProperty('valuesRaw')){
                        let tb=''
                        if(request[word].hasOwnProperty('tb')){ 
                            if(typeof request[word].tb=='function'&&request[word].tb.prototype instanceof Model)
                                tb = request[word].tb.table
                            else if(typeof request[word].tb=='string')
                                tb = request[word].tb
                            delete request[word].tb
                        }
                        tb=tb==''?this.constructor['table']:tb
                        this.#query += `INSERT INTO ${tb} `
                        if(request[word].hasOwnProperty('params')){
                            this.#query+='('
                            this.#parseRequest({params:request[word].params})
                            this.#query+=')'
                            delete request[word].params
                        }
                    }else if(typeof request[word]=='string'){
                        this.#query += `SELECT ${request[word]} FROM ${this.constructor['table']}`
                    }
                    break
                }
                case 'update':{
                    if(typeof request[word]=='object'&&request[word]!==null&&request[word].hasOwnProperty('set')){
                        let tb=''
                        if(request[word].hasOwnProperty('tb')){ 
                            if(typeof request[word].tb=='function'&&request[word].tb.prototype instanceof Model)
                                tb = request[word].tb.table
                            else if(typeof request[word].tb=='string')
                                tb = request[word].tb
                            delete request[word].tb
                        }
                        tb=tb==''?this.constructor['table']:tb
                        this.#query += `UPDATE ${tb} SET `
                        this.#parseRequest(request[word])
                    }else if(typeof request[word]=='string'){
                        this.#query += `SELECT ${request[word]} FROM ${this.constructor['table']}`
                    }
                    break
                }
                case 'delete':{
                    if(typeof request[word]=='object' && request[word]!==null){
                        let tb=''
                        if(request[word].hasOwnProperty('tb')){ 
                            if(typeof request[word].tb=='function'&&request[word].tb.prototype instanceof Model)
                                tb = request[word].tb.table
                            else if(typeof request[word].tb=='string')
                                tb = request[word].tb
                            delete request[word].tb
                        }
                        tb=tb==''?this.constructor['table']:tb
                        this.#query += `DELETE FROM ${tb}`
                        this.#parseRequest(request[word])
                    }else 
                        this.#query += `DELETE FROM ${this.constructor['table']}`
                    break
                }

                case 'having':
                case 'where':{
                    this.#query+=` ${word.toUpperCase()} `
                    if(typeof request[word]=='object' && request[word]!==null){
                        this.#parseRequest(request[word])
                    }else if(typeof request[word]=='string'){
                        this.#query+= request[word]
                    }
                    break
                }

                case 'and':
                case 'or':{
                    if(request[word].constructor==Array){
                        for(let i=0;i<request[word].length;i++){
                            if(typeof request[word][i] === 'object'){
                                this.#parseRequest(request[word][i])
                            }else{
                                this.#query+=request[word][i].toString()
                            }
                            if(i+1!=request[word].length){
                                this.#query+=` ${word.toUpperCase()} `
                            }
                        }
                    }else if(typeof request[word]=='object' && request[word]!==null){
                        this.#query+=` ${word.toUpperCase()} `
                        this.#parseRequest(request[word])
                    }else if(typeof request[word]=='string'){
                        this.#query+=` ${word.toUpperCase()} `+request[word]
                    }
                    break
                }
                
                case 'notIn':
                case 'in':{
                    if(typeof request[word]=='object' && request[word]!==null){
                        if(request[word].hasOwnProperty('field')&&request[word].hasOwnProperty('params')){
                            let f = request[word].field
                            delete request[word].field
                            this.#query+=`${f} ${word.replace(/[A-Z]/g,' $&').toUpperCase()} (`
                            this.#parseRequest(request[word])
                            this.#query+=')'
                        }
                    }
                    break
                }

                case 'like':
                case 'notLike':{
                    if(typeof request[word]=='object' && request[word]!==null){
                        if(request[word].hasOwnProperty('field')&&request[word].hasOwnProperty('params')){
                            let f = request[word].field
                            delete request[word].field
                            this.#query+=`${f} ${word.replace(/[A-Z]/g,' $&').toUpperCase()} `
                            this.#parseRequest(request[word])
                        }
                    }
                    break
                }

                case 'between':
                case 'notBetween':{
                    if(typeof request[word] == 'object'&&request[word].constructor!=Array&&request[word].hasOwnProperty('field')&&request[word].hasOwnProperty('params')){
                        if(Array.isArray(request[word].params) && request[word].params.length==2){
                            this.#query += `${request[word].field} ${word.replace(/[A-Z]/g,' $&').toUpperCase()}`
                            delete request[word].field
                            request[word].and = request[word].params
                            delete request[word].params
                            this.#parseRequest(request[word])
                        }
                    }
                    break
                }   

                case 'isNull':
                case 'isNotNull':
                case 'isTrue':
                case 'isFalse':
                case 'isUnknown':
                case 'isNotUnknown':{
                    if(typeof request[word] == 'object'&&request[word].constructor!=Array){
                        this.#parseRequest(request[word])
                        this.#query+=` ${word.replace(/[A-Z]/g,' $&').toUpperCase()}`
                    }else{
                        this.#query+=`${request[word].toString()} ${word.replace(/[A-Z]/g,' $&').toUpperCase()}`
                    }
                    break
                }
                case 'groupBy':{
                    this.#query+=` GROUP BY ${request[word].toString()}`
                    break
                }
                case 'orderBy':{
                    if(typeof request[word]=='object'&& request[word]!==null &&request[word].constructor!=Array&&request[word].hasOwnProperty('field')&&request[word].hasOwnProperty('direction')){
                        this.#query += ' ORDER BY '
                        if (!Array.isArray(request[word].field))
                            request[word].field = Model.asArray(request[word].field)
                        if (!Array.isArray(request[word].direction)) 
                            request[word].direction=Model.asArray(request[word].direction)
                        if(request[word].field.length!=request[word].direction.length)
                            throw new Error('Params field and direction must have the same number of elements')
                        while (request[word].field.length > 0) {
                            let item = request[word].field.shift()
                            this.#query += `${item} ${request[word].direction.shift()?.toUpperCase()??''}${request[word].field.length != 0?', ':''}`;
                        }
                    }
                    break
                }

                case 'limit':
                case 'offset':{
                    if(typeof request[word] == 'object'&&request[word].constructor!=Array){
                        this.#query+=` ${word.toUpperCase()} `
                        this.#parseRequest(request[word])
                    }else if(typeof request[word] == 'number'||!isNaN(Number(request[word]))){
                        this.#query+=` ${word.toUpperCase()} ${request[word]}`
                    }
                    break
                }

                case 'count':
                case 'avg':
                case 'max':
                case 'min':
                case 'sum':{
                    if(typeof request[word]=='object'&& request[word]!==null &&request[word].constructor!=Array){
                        this.#query+=`${word.toUpperCase()}(`
                        this.#parseRequest(request[word])
                        this.#query+=')'
                    }else{
                        this.#query+=`${word.toUpperCase()}(${request[word].toString()})`
                    }
                    break
                }
                case 'as':{
                    this.#query+=` ${word.toUpperCase()} ${request[word]}`
                    break
                }
                case 'field':{
                    this.#query += request[word]
                    break
                }
                case 'condition':{
                    this.#query +=` ${request[word]} `
                    break
                }
                case 'inner':{
                    if(typeof request[word]=='object' && request[word]!==null){
                        this.#query+='('
                        this.#parseRequest(request[word])
                        this.#query+=')'
                    }else{
                        this.#query+=`(${request[word].toString()})`
                    }
                    break
                }
                case 'prepare':{
                    this.#query+= `$${(this.#position++)}`
                    this.#data.push(request[word])
                    break
                }
                case 'raw':{
                    this.#query+= request[word].toString()
                    break
                }
                case 'distinct':{
                    if(request[word].constructor == Array){
                        let q=''
                        for(let item of request[word]){
                            q+=q==''?`DISTINCT ${item}`:`, DISTINCT ${item}`
                        }
                        this.#query+=q
                    }
                    if(typeof request[word]=='string')
                        this.#query+='DISTINCT '+request[word]
                    break
                }
                case 'params':{
                    if(request[word].constructor == Array){
                        let first=true
                        for(let i=0;i<request[word].length;i++){
                            this.#query+=first?'':', '
                            if(typeof request[word][i] === 'object'){
                                this.#parseRequest(request[word][i])
                            }else{
                                this.#query+=`'${request[word][i].toString()}'`
                            }
                            first=false
                        }
                    }else if(typeof request[word]=='object' && request[word]!==null){
                        this.#parseRequest(request[word])
                    }else if(typeof request[word]=='string'){
                        this.#query+=`'${request[word]}'`
                    }
                    break
                }
                case 'set':{
                    if(Array.isArray(request[word])&&request[word].length){
                        let q = ''
                        for(let item of request[word]){
                            if(Array.isArray(item)&&item.length==2){
                                q+=q==''?'':', '
                                q+=`${item[0]} = $${(this.#position++)}`
                                this.#data.push(item[1])
                            }else if(typeof item == 'object'&&item.hasOwnProperty('field')&&item.hasOwnProperty('prepare')){
                                q+=q==''?'':', '
                                q+=`${item.field} = $${(this.#position++)}`
                                this.#data.push(item.prepare)
                            }
                        }
                        this.#query+=q
                    }
                    break
                }
                case 'valuesRaw':
                case 'values':{
                    let raw = word.replace(/[A-Z]/g,' $&').split(' ').length==2
                    this.#query+=' VALUES ('
                    let q=''
                    request[word] = !Array.isArray(request[word])?[request[word]]:request[word]
                    if(request[word].length){
                        for(let item of request[word]){
                            q+=q==''?'':', '
                            if(raw){
                                if(typeof item === 'string')
                                    q+=`'${item}'`
                                else
                                    q+=item.toString()
                            }else{
                                q+=`$${(this.#position++)}`
                                this.#data.push(item)
                            }
                        }
                    }
                    this.#query+=q
                    this.#query+=')'
                    break
                }
            }
        }
    }



    /**
     * Функция для составления запроса объектным методом
     * @param {Query} params
     * @returns 
     */
    static request(params={select:'*'}){
        let obj = new this()
        obj.#parseRequest(params)
        return obj
    }

    /**
     * 
     * @param {any} params 
     * @param {boolean} wrapper
     * @param {object} asName
     * @param {string|null} asName.one
     * @param {string|null} asName.global
     */
    #parseParams(params=null,prepare = false,wrapper = false,stringQuotes=false,asName={one:null, global:null}){
        if(params != null){
            if(Array.isArray(params)){
                if(prepare){
                    this.#query+=`$${this.#position++}`
                    this.#data.push(params)
                }else{
                    if(wrapper)
                    this.#query+=`(`
                    for(let i=0;i<params.length; i++){
                        this.#parseParams(params[i],prepare,true,stringQuotes,asName)
                        if(i+1!=params.length)
                            this.#query+=', '
                    }
                    if(wrapper)
                        this.#query+=')'
                    if(wrapper && asName.global!=null)
                        this.#query+=` AS ${asName.global}`
                }
                
            }else if(typeof params == 'function'&&params.prototype instanceof Model){
                this.#query+=params.table+(asName.one!=null?` AS ${asName.one}`:'')
            }else if(typeof params == 'function'){
                this.#query+=`#`
                params(this)
                if(/#(SELECT|INSERT|DELETE|UPDATE)/.test(this.#query)){
                    this.#query=this.#query.replace('#','(')
                    this.#query+=')'
                }else{
                    this.#query=this.#query.replace('#','')
                }
            }else{
                if(prepare){
                    this.#query+=`$${this.#position++}`
                    this.#data.push(params)
                }else{
                    if(stringQuotes && typeof params == 'string')
                        this.#query+=`'${params}'`
                    else
                        this.#query+= params.toString()
                    this.#query+=(asName.one!=null?` AS ${asName.one}`:'')
                }
            }
        }
    }



    /**
     * Запрос Select к БД
     * @param {any} params 
     * Наименование параметра(-ов) для выборки (необязательный)
     * @param {any} table
     * Наименование таблицы для выборки (необязательно при условии что используется унаследованный класс модели для оперделенной таблицы)
     * @returns {Model}
     */
    static select(params = null, table = null) {
        let tb=null
        if(table!==null&&typeof table=='function'&&table.prototype instanceof Model)
            tb = table.table
        else if(typeof table=='string')
            tb = table
        tb=tb==null?this.table:tb
        let obj = new this()
        obj.#query = 'SELECT '
        if(params!=null){
            obj.#parseParams(params)
            obj.#query += ` FROM ${tb}`
        }else{
            obj.#query += `* FROM ${tb}`
        }
        return obj;
    }

    /**
     * 
     * @param {*} params 
     * @param {any} table 
     */
    select(params = null,table = null){
        let tb=null
        if(table!==null&&typeof table=='function'&&table.prototype instanceof Model)
            tb = table.table
        else if(typeof table=='string')
            tb = table
        tb=tb==null?this.constructor['table']:tb
        this.#query += `SELECT `
        if(params!=null){
            this.#parseParams(params)
            this.#query += ` FROM ${tb}`
        }else{
            this.#query += `* FROM ${tb}`
        }
    }

    #countable(type = 'count',params = null, distinct = false){
        let d = distinct ? 'DISTINCT ' : '';
        if (params != null) {
            this.#query += `${d}${type.toUpperCase()}(`
            this.#parseParams(params)
            this.#query+=')'
        } else {
            this.#query += `${d}${type.toUpperCase()}(*)`
        }
        return this
    }

   

    /**
     * 
     * @param {*} params 
     * @param {*} distinct 
     */
    count(params = null, distinct = false) {
        return this.#countable('count',params,distinct)
    }

    /**
     * 
     * @param {*} params 
     * @param {*} distinct 
     */
    min(params = null, distinct = false) {
        return this.#countable('min',params,distinct)
    }

    /**
     * 
     * @param {*} params 
     * @param {*} distinct 
     */
    max(params = null, distinct = false) {
        this.#countable('max',params,distinct)
        return this
    }

    /**
     * 
     * @param {*} params 
     * @param {*} distinct 
     */
    sum(params = null, distinct = false) {
        return this.#countable('sum',params,distinct)
    }

    /**
     * 
     * @param {*} params 
     * @param {*} distinct 
     */
    avg(params = null, distinct = false) {
        return this.#countable('avg',params,distinct)
    }


    #conditional(before='where',field,condition,param){
        let prepare=!/^[\s]*@/.test(field)
        field = field.replace(/@/,'')
        this.#query+=` ${before.toUpperCase()} ${field} ${condition} `
        this.#parseParams(param,prepare)
        return this
    }
    #baseIn(before='',field, params,not=false){
        let prepare=!/^[\s]*@/.test(field)
        field = field.replace(/@/,'')
        this.#query+=` ${before.toUpperCase()} ${field}${not?' NOT':''} IN `
        this.#parseParams(params,prepare,true)
        return this
    }
    #baseIs(before='',exp='',field){
        if(typeof field == 'function'){
            this.#query+=` ${before.toUpperCase()} `
            field(this)
            this.#query+=` IS ${exp.toLocaleUpperCase()}`
        }else{
            this.#query+=` ${before.toUpperCase()} ${field} IS ${exp.toLocaleUpperCase()}`
        }
        return this
    }
    #baseBetween(before='',field,params,symmetric=false,not=false){
        try{
            let prepare=false;
            if(typeof field == 'function'){
                this.#query+=` ${before.toUpperCase()} `
                field(this)
                this.#query+=`${not?' NOT':''} BETWEEN ${symmetric?'SYMMETRIC ':''}`
            }else{
                prepare=!/^[\s]*@/.test(field)
                field = field.replace(/@/,'')
                this.#query+=` ${before.toUpperCase()} ${field}${not?' NOT':''} BETWEEN ${symmetric?'SYMMETRIC ':''}`
            }
            if(Array.isArray(params)&&params.length==2){
                this.#parseParams(params[0],prepare)
                this.#query+=' AND '
                this.#parseParams(params[1],prepare)
            }else{
                throw new Error('Params in between function must be type of array, and length=2')
            }
        }catch(err){
            Logger.error('Model.#baseBetween',err)
        }
        return this
    }
    #baseLike(before='',field,params,not=false){
        try{
            let prepare=false;
            if(typeof field == 'function'){
                this.#query+=` ${before.toUpperCase()} `
                field(this)
                this.#query+=`${not?' NOT':''} LIKE `
            }else{
                prepare=!/^[\s]*@/.test(field)
                field = field.replace(/@/,'')
                this.#query+=` ${before.toUpperCase()} ${field}${not?' NOT':''} LIKE `
            }
            this.#parseParams(params,prepare,false,true)
        }catch(err){
            Logger.error('Model.#baseLike',err)
        }
        return this
    }
    /**
     * 
     * @param {*} field 
     * @param {*} condition 
     * @param {*} param 
     * @returns 
     */
    where(field, condition, param) {
        return this.#conditional('where',field,condition,param)
    }
    and(field, condition, param){
        return this.#conditional('and',field,condition,param)
    }
    or(field, condition, param){
        return this.#conditional('or',field,condition,param)
    }
    in(field, params) {
        return this.#baseIn('where',field,params)
    }
    andIn(field, params) {
        return this.#baseIn('and',field,params)
    }
    orIn(field, params){
        return this.#baseIn('or',field,params)
    }
    notIn(field, params){
        return this.#baseIn('where',field,params,true)
    }
    andNotIn(field, params){
        return this.#baseIn('and',field,params,true)
    }
    orNotIn(field, params){
        return this.#baseIn('or',field,params,true)
    }
    isNull(field){
        return this.#baseIs('where','null',field)
    }
    andIsNull(field){
        return this.#baseIs('and','null',field)
    }
    orIsNull(field){
        return this.#baseIs('or','null',field)
    }
    isNotNull(field){
        return this.#baseIs('where','not null',field)
    }
    andIsNotNull(field){
        return this.#baseIs('and','not null',field)
    }
    orIsNotNull(field){
        return this.#baseIs('or','not null',field)
    }
    isTrue(field){
        return this.#baseIs('where','true',field)
    }
    andIsTrue(field){
        return this.#baseIs('and','true',field)
    }
    orIsTrue(field){
        return this.#baseIs('or','true',field)
    }
    isFalse(field){
        return this.#baseIs('where','false',field)
    }
    andIsFalse(field){
        return this.#baseIs('and','false',field)
    }
    orIsFalse(field){
        return this.#baseIs('or','false',field)
    }
    isUnknown(field){
        return this.#baseIs('where','unknown',field)
    }
    andIsUnknown(field){
        return this.#baseIs('and','unknown',field)
    }
    orIsUnknown(field){
        return this.#baseIs('or','unknown',field)
    }
    isNotUnknown(field){
        return this.#baseIs('where','not unknown',field)
    }
    andIsNotUnknown(field){
        return this.#baseIs('and','not unknown',field)
    }
    orIsNotUnknown(field){
        return this.#baseIs('or','not unknown',field)
    }
    /**
     * 
     * @param {function|string} field 
     * @param {Array<any>} params 
     * @param {boolean} symmetric 
     * @returns 
     */
    between(field,params,symmetric=false){
        return this.#baseBetween('where',field,params,symmetric)
    }
    andBetween(field,params,symmetric=false){
        return this.#baseBetween('and',field,params,symmetric)
    }
    orBetween(field,params,symmetric=false){
        return this.#baseBetween('or',field,params,symmetric)
    }
    notBetween(field,params,symmetric=false){
        return this.#baseBetween('where',field,params,symmetric,true)
    }
    andNotBetween(field,params,symmetric=false){
        return this.#baseBetween('and',field,params,symmetric,true)
    }
    orNotBetween(field,params,symmetric=false){
        return this.#baseBetween('or',field,params,symmetric,true)
    }
    like(field,params){
        return this.#baseLike('where',field,params)
    }
    orLike(field,params){
        return this.#baseLike('or',field,params)
    }
    andLike(field,params){
        return this.#baseLike('end',field,params)
    }
    notLike(field,params){
        return this.#baseLike('where',field,params,true)
    }
    andNotLike(field,params){
        return this.#baseLike('and',field,params,true)
    }
    orNotLike(field,params){
        return this.#baseLike('or',field,params,true)
    }
    /**
     * 
     * @param {string|Array<string>} field 
     * @param {string|Array<string>} direction 
     * @returns 
     */
    orderBy(field, direction = 'asc') {
        try{
            this.#query += ' ORDER BY '
            if (!Array.isArray(field))
                field = Model.asArray(field)
            if (!Array.isArray(direction)) 
                direction=Model.asArray(direction)
            if(field.length!=direction.length)
                throw new Error('Params field and direction must have the same number of elements')
            while (field.length > 0) {
                let item = field.shift()
                this.#query += `${item} ${direction.shift()?.toUpperCase()??''}${field.length != 0?', ':''}`
            }
        }catch(err){
            Logger.error('Model.orderBy()',err)
        }
        return this
    }

    groupBy(field) {
        this.#query += ' GROUP BY '
        this.#parseParams(field)
        return this
    }

    having(field,condition,params){
        this.#query+=` HAVING ${field} ${condition} `
        this.#parseParams(params)
        return this
    }

     /**
     * 
     * @param {*} count 
     * @returns 
     */
    limit(count) {
        this.#query += ` LIMIT ${count}`
        return this
    }

    /**
     * 
     * @param {*} count 
     * @returns 
     */
    offset(count) {
        this.#query += ` OFFSET ${count}`
        return this
    }
  

    


    /**
     * 
     * @param {*} tb 
     * @param {*} fieldCondition 
     * @param {*} fieldCondition2 
     * @returns 
     */
    join(tb, fieldCondition, fieldCondition2) {
        this.#lastQuery = ''
        let current=this.constructor['table']
        this.#query += ` JOIN ${tb} ON ${current}.${fieldCondition}=${fieldCondition2}`;
        return this;
    }

    

   

    

    /**
     * Асинхронная функция добавления новой записи на основе текущего объекта модели
     * @returns {Promise<object>}
     * ---
     * Возвращает объект вида { success: false | true }
     */
    save() {
        return new Promise((resolve, reject) => {
            let names = [], values = [], data = []
            let position = 1
            for (let prop of Object.keys(this)) {
                if (this[prop] != null) {
                    if (this[prop].toString().toLowerCase() === 'current_timestamp') {
                        this[prop]=new Date()
                    }
                    let bname = prop.replace(/([A-Z])/g, '_$1').toLowerCase()
                    names.push(bname)
                    values.push(`$${position}`)
                    position++
                    data.push(this[prop])
                }
            }
            let strQuery = `INSERT INTO ${this.constructor['table']} (${names.toString()}) VALUES (${values.toString()}) RETURNING ${this.constructor['primary']}`
            let connect = new Connect()
            connect.con().then(connect => {
                connect.query(strQuery, data, result => {
                    connect.client.end()
                    if (!result){
                        resolve({success:false})
                    } else {
                        this[this.constructor['primary']]=result.rows[0][this.constructor['primary']]
                        resolve({success:true, insertId:result.rows[0][this.constructor['primary']]})
                    }
                })
            }).catch(err=>{
                Logger.error('Model.save()',err)
                resolve({success:false})
            });
        })
    }


    /**
     * Статическая функция обновления используемой модели, для отправки должна использовать функцию set и send-методы в цепочке
     * @returns {Model}
     */
    static update(){
        let query = `UPDATE ${this.table}`
        let obj = new this()
        obj.setQuery(query)
        return obj
    }

    /**
     * Функция для использования в цепочке со статической update-функцией
     * @param {string|object} props 
     * Наименование свойства, либо объект со свойствами и их значениями
     * @param {any|null} value 
     * Значение свойства (нужно только в случае если props - единичное свойство)
     * @returns {Model}
     */
    set(props,value=null){
        try{
            let addQuery=''
            if(typeof props === 'object' && props!=null && !props.hasOwnProperty('length')){
                for(let key in props){
                    addQuery+=addQuery==''?`${key}=$${(this.#position++)}`:`, ${key}=$${(this.#position++)}`
                    this.#data.push(props[key])
                }
                this.#query+=` SET ${addQuery}`
            }else if(typeof props == 'string'&&value!=null){
                addQuery+=`${props}=$${(this.#position++)}`
                this.#data.push(value)
                this.#query+=` SET ${addQuery}`
            }else{
                throw new Error('Параметры не соответствуют необходимым условиям')
            }
        }catch(err){
            Logger.error(this.constructor['table'],err)
        }
        return this
    }

    /**
     * Функция для обновления текущего объекта модели(записи в бд)
     * @param {boolean} isNull
     * Параметр указывающий устанавливать ли NULL значения для полей, по умолчанию - false(не сохраняет null) 
     * @returns {Promise<object>}
     * ---
     * Возвращает объект вида { success: false | true }
     */
    update(isNull = false) {
        return new Promise((resolve, reject) => {
            let position = 1
            let names = [], values = [], conditions = ''
            for (let prop of Object.keys(this)) {
                let bname = prop.replace(/([A-Z])/g, '_$1').toLowerCase()

                if (this.constructor['primary'] != null && this.constructor['primary'] == bname) {
                    conditions = ` WHERE ${bname}=$${position++}`
                    values.push(this[prop])
                }
                if(typeof this[prop] === 'undefined'){
                    this[prop]=null
                }
                if (!isNull && this[prop] === null) {
                    continue
                } else {
                    if (bname != this.constructor['primary'] && this[prop] === null) {
                        names.push(`${bname}=NULL`);
                    } else if(bname != this.constructor['primary']){
                        if (this[prop]!=null&&this[prop].toString().toLowerCase() === 'current_timestamp') {
                            this[prop]=new Date()
                        }
                        names.push(`${bname}=$${position++}`)
                        values.push(this[prop])
                    }
                }
            }
            let connect = new Connect()
            this.#query=`UPDATE ${this.constructor['table']} SET ${names.toString() + conditions}`
            try{
                connect.con().then(connect => {
                    connect.query(this.#query, values, result => {
                        connect.client.end()
                        if (!result) resolve({success:false})
                        else resolve({success:true})
                    })
                }).catch(err=>{
                    Logger.error('(object) Model.update()',err)
                    resolve({success:false})
                });
            }catch(err){
                Logger.error('(object) Model.update()',err)
                resolve({success:false})
            }
        });
    }

    /**
     * Асинхронная функция выполнения запроса. Для получения конкретного результата можно использовать функции - first, many
     * @returns {Promise<object>} 
     * ---
     * Возвращает объект вида { success: false | true } и дополнительное поле - data, при успешном выполнении
     */
    send() {
        return new Promise((resolve, reject) => {
            let connect = new Connect()
            try{
                connect.con().then(connect => {
                    connect.query(this.#query, this.#data, result => {
                        if (!result) {
                            connect.client.end()
                            resolve({success:false})
                        }
                        this.#position=1
                        this.#data=[]
                        if (/^DELETE/.test(this.#query)) {
                            connect.client.end()
                            if(result.hasOwnProperty('rowCount')){
                                resolve({success:true})
                            }
                            resolve({success:false})
                        }
                        if (/^SELECT/.test(this.#query)) {
                            let objs
                            if(/JOIN/.test(this.#query)||/AS/.test(this.#query)) objs = this.constructor['parse'](result.rows,true)
                            else objs = this.constructor['parse'](result.rows)
                            connect.client.end()
                            resolve({success:true,data:objs})
                        }
                    })
                }).catch((err)=>{
                    Logger.error('Connect.con()',err)
                    resolve({success:false})
                })
            }catch(err){
                Logger.error('Model.send()',err)
                resolve({success:false})
            }
        })
    }

    /**
     * Асинхронная функция выполнения запроса
     * @returns {Promise<object>}
     * ---
     * Возвращает только одну запись
     */
    async first(){
        let res = await this.send()
        if(res.success&&res.data){
            let data = Array.isArray(res.data)?res.data[0]:res.data!=null?res.data:null
            res.data=data
            return res
        }else{
            return res
        }
    }

    /**
     * Асинхронная функция выполнения запроса.
     * @returns {Promise<object>} 
     * ---
     * Возвращает записи в виде массива(даже если присутствует только одна запись)
     */
    async many(){
        let res = await this.send()
        if(res.success&&res.data){
            let data = Array.isArray(res.data)?res.data:res.data!=null?[res.data]:null
            res.data=data
            return res
        }else{
            return res
        }
    }

    /**
     * Функция для получения строки текущего запроса из объекта модели
     * @returns {string}
     */
    query(){
        return this.#query;
    }

    /**
     * Установка "сырого" запроса для текущего объекта модели
     * @param {string} query
     * Строка запроса 
    */
    setQuery(query) {
        this.#query = query;
    }

    /**
     * Функция для получения всех строк запросов транзакции
     * @returns {string[]}
     */
    queryPool(){
        return Model.#queryPool;
    }

    /**
     * Функция для добавления запроса из текущего объекта модели в транзакцию
     */
    pool(){
        Model.#queryPool.push(this.#query)
        Model.#poolData=Model.#poolData.concat(this.#data)
    }
    /**
     * Статическая функция для выполнения транзакции
     * @returns {Promise<object>}
     */
    static sendPool() {
        return new Promise((resolve, reject) => {
            try {
                if (Model.#queryPool.length) {
                    let position = 1;
                    let transaction = 'BEGIN;'
                    transaction += Model.#queryPool.join(';')
                    transaction = transaction.replace(/\$[0-9]+/g, () => `$${position++}`)
                    transaction += 'COMMIT;'
                    let connect = new Connect()
                    try {
                        connect.con().then(connect => {
                            connect.query(transaction, Model.#poolData, result => {
                                if (!result) {
                                    connect.client.end()
                                    resolve({ success: false })
                                }
                                connect.client.end()
                                resolve({ success: true, data: result.rows })
                            })
                        }).catch((err) => {
                            Logger.error('Connect.con()', err)
                            resolve({success:false})
                        })
                    } catch (err) {
                        Logger.error('Model.sendPool()', err)
                        resolve({ success: false })
                    }
                }
            } catch (err) {
                Logger.error('Model.sendPool()', err)
                resolve({ success: false })
            }
        })
    }

    /**
     * Функция для выполнения транзакции из объекта модели
     * @returns {Promise<object>}
    */
    sendPool() {
        return new Promise((resolve, reject) => {
            try {
                if (Model.#queryPool.length) {
                    let position = 1;
                    let transaction = 'BEGIN;'
                    transaction += Model.#queryPool.join(';')
                    transaction = transaction.replace(/\$[0-9]+/g, () => `$${position++}`)
                    transaction += 'COMMIT;'
                    let connect = new Connect()
                    try {
                        connect.con().then(connect => {
                            connect.query(transaction, Model.#poolData, result => {
                                if (!result) {
                                    connect.client.end()
                                    resolve({ success: false })
                                }
                                connect.client.end()
                                resolve({ success: true, data: result.rows })
                            })
                        }).catch((err) => {
                            Logger.error('Connect.con()', err)
                            resolve({success:false})
                        })
                    } catch (err) {
                        Logger.error('Model.sendPool()', err)
                        resolve({ success: false })
                    }
                }
            } catch (err) {
                Logger.error('Model.sendPool()', err)
                resolve({ success: false })
            }
        })
    }

    /**
     * Статическая функция удаления для используемой модели, для отправки запроса должна вызывать send() в цепочке
     * @returns {Model}
     */
    static delete() {
        let query = `DELETE FROM ${this.table}`
        let obj = new this()
        obj.setQuery(query)
        return obj
    }

    /**
     * Функция для удаления текущего объекта модели (записи) из БД
     * @returns {Promise<object>}
     */
    delete(){
        return new Promise((resolve, reject) => {
            let connect = new Connect()
            this.#query=`DELETE FROM ${this.constructor['table']} WHERE ${this.constructor['primary']} = ${this[this.constructor['primary']]}`
            try{
                connect.con().then(connect => {
                    connect.query(this.#query,null, result => {
                        connect.client.end()
                        for(let prop of Object.keys(this)){
                            this[prop]=null
                        }
                        if (!result) resolve({success:false})
                        else resolve({success:true})
                    })
                }).catch(err=>{
                    Logger.error('(object) Model.delete()',err)
                    resolve({success:false})
                })
            }catch(err){
                Logger.error('(object) Model.delete()',err)
                resolve({success:false})
            }
        });
    }

    /**
     * Функция для парсинга ответа запроса и преобразования строк БД в объекты текущей модели
     * @param {any} objs 
     * Результат выполненного запроса
     * @param {boolean} join 
     * Параметр указывающий включать ли в результат поля которые не совпадают с полями объекта модели (по умолчанию - false)
     * @returns {null|object|object[]}
     */
    static parse(objs,join=false) {
        let objects = [];
        if(objs==null||objs.length==0) return null;
        for (let item of objs) {
            let obj;
            obj = new this();
            for (let key in item) {
                let newName = NamingCase.toNaming(key,Model.namingType)
                for (let name in obj) {
                    if (name == newName||join) {
                        obj[newName] = item[key];
                    }
                }
            }
            if (objs.length == 1) return obj;
            else objects.push(obj);
        }
        return objects;
    }

    /**
     * Функция приведения значения к массиву
     * @param {object} obj 
     * @returns {object[]}
     */
    static asArray(obj) {
        if(!Array.isArray(obj)) return [obj];
        return obj; 
    }
    
    /**
    * Функция для объединения объекта с объектом модели по наименованию параметров
    * @param {object} mergeObj 
    * @returns {object}
    * Возвращает объект использованной модели
    */
    mergeToThis(mergeObj){
        for(let name in this){
            if(mergeObj&&mergeObj.hasOwnProperty(name)){
                if(this[name]==null) this[name]=mergeObj[name]
                delete mergeObj[name]
            }
        }
        for(let name in mergeObj){
            this[name]=mergeObj[name]
        }
        return this;
    }

}

class Connect {

    static #CONFIG
    client

    static async setConfig(pathToConfig){
        try{
            Connect.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('Connect.setConfig()',error)
        }
    }

    constructor() {
        this.client = new pg.Client({
            user: Connect.#CONFIG.DB_USER,
            host: Connect.#CONFIG.DB_HOST,
            database: Connect.#CONFIG.DB_NAME,
            password: Connect.#CONFIG.DB_PASS,
            port: Connect.#CONFIG.DB_PORT
        })
    }

    con(){
        return new Promise((resolve, reject) => {
            this.client.connect(err => {
                if (err) {
                    Logger.error(`Connect.con(): Ошибка подключения к базе данных`,err)
                    reject();
                } else {
                    resolve(this);
                }
            });
        })
    }

    query(queryStr, params, action) {
        this.client.query(queryStr, params, (err, result) => {
            if (err) {
                Logger.error(`Connect.query()\n\nQUERY:${queryStr}\n\nPARAMS:${params}`,err)
                action(false)
            } else if (action != null) {
                action(result)
            }
        })
    }
}
