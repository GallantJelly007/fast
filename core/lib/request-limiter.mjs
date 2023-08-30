import * as fs from 'fs'
import * as crypto from 'crypto'
import path from 'path'
import Time from 'timelex'
import Logger from './logger.mjs'

export default class RequestLimiter{
    static #CONFIG
    static #limiters = []
    static #blackListPath
    static #ipMapPath
    #domain
    #routes
    #ipMap = new Map()
    #blackList = new Map()
    #interval
    #allowCount
    #blockCount
    #blockTime

    get domain(){
        return this.#domain
    }

    static async setConfig(pathToConfig){
        try{
            RequestLimiter.#CONFIG = (await import(pathToConfig)).default
        }catch(error){
            Logger.error('RequestLimiter.setConfig()',error)
        }
    }

    /**
     * @param {Object} params
     * @param {string} params.domain
     * @param {Map} [params.routes]
     * @param {number} [params.interval]
     * @param {number} [params.allowCount]
     * @param {number} [params.blockCount]
     * @param {number} [params.blockTime]
     */
    constructor(params){
        this.#domain = params.domain
        this.#interval = params?.interval ? params.interval : RequestLimiter.#CONFIG.LIMITER_TRACK_INTERVAL
		this.#allowCount = params?.allowCount ? params.allowCount : RequestLimiter.#CONFIG.LIMITER_MAX_ALLOW_REQUEST
		this.#blockCount = params?.blockCount ? params.blockCount : RequestLimiter.#CONFIG.LIMITER_BLOCK_LIMIT
		this.#blockTime = params?.blockTime ? params.blockTime : RequestLimiter.#CONFIG.LIMITER_BLOCK_TIME
        RequestLimiter.#limiters.push(this)
    
        if(!RequestLimiter.#blackListPath || !RequestLimiter.#ipMapPath){
            RequestLimiter.#blackListPath = path.join(RequestLimiter.#CONFIG.LIMITER_PATH,'/black_list.json').replace(/\\/g,'/')
            RequestLimiter.#ipMapPath = path.join(RequestLimiter.#CONFIG.LIMITER_PATH,'/ip_map.json').replace(/\\/g,'/')
        }

        let name = this.#routes instanceof Map 
                    ? this.domain + crypto.createHash('sha256').update(JSON.stringify(Array.from(this.#routes),this.#regexReplacer)).digest('hex')
                    : this.domain

        if (fs.existsSync(RequestLimiter.#blackListPath)) {
            let data = fs.readFileSync(RequestLimiter.#blackListPath,{encoding:'utf-8'})
            let obj = JSON.parse(data)
            if(obj?.[name])
                this.#blackList = new Map(obj[name])
        }
        if(fs.existsSync(RequestLimiter.#ipMapPath)){
            let data = fs.readFileSync(RequestLimiter.#ipMapPath,{encoding:'utf-8'})
            let obj = JSON.parse(data)
            if(obj?.[name])
                this.#ipMap = new Map(obj[name])
        }
    }
    

    checkIp(request){
        try{
            let ip = request.headers['x-forwarded-for']?.split(',').shift() ?? request.socket?.remoteAddress
            let addr = decodeURI(request.url.toString())
            let host = request.headers['x-forwarded-host'] ?? request.headers['host']
            host = host.replace(/\:[0-9]*/, '')
            if (this.#domain != host)
                return { success: true }
            if (this.#routes instanceof Map) {
                if (!Array.from(this.#routes).find(([key, value]) => new RegExp(key).test(addr))) {
                    return { success: true }
                }
            }
            let currentTime = new Time()
            if (ip) {
                if (this.#blackList.has(ip)) {
                    let timeBlock = new Time(this.#blackList.get(ip))
                    if (timeBlock > currentTime) {
                        return { success: false, code: 423, message: `Запрос с IP адреса: ${ip}, заблокирован!` }
                    } else {
                        this.#blackList.delete(ip)
                        this.#ipMap.set(ip, { count: 1, startTime: currentTime.timestamp, lastTime: currentTime.timestamp })
                        return { success: true }
                    }
                } else {
                    if (this.#ipMap.has(ip)) {
                        let data = this.#ipMap.get(ip)
                        let startTime = new Time(data.startTime)
                        if (currentTime.minutesBetween(startTime) < this.#interval) {
                            data.count++
                            if (data.count > this.#allowCount) {
                                if (data.count >= this.#blockCount) {
                                    this.#ipMap.delete(ip)
                                    this.#blackList.set(ip, currentTime.addMinutes(this.#blockTime).timestamp)
                                    return { success: false, code: 423, message: `IP адрес: ${ip}, заблокирован до ${currentTime.format('${H:m:S}, ${D.M.Y}')}!` }
                                } else {
                                    data.lastTime = currentTime.timestamp
                                    this.#ipMap.set(ip, data)
                                    return { success: false, code: 429, message: `IP адрес: ${ip} превысил допустимый лимит запросов, текущий отклонен со статусом 429` }
                                }
                            } else {
                                data.lastTime = currentTime.timestamp
                                this.#ipMap.set(ip, data)
                                return { success: true }
                            }
                        } else {
                            data.count = 1
                            data.startTime = currentTime.timestamp
                            data.lastTime = currentTime.timestamp
                            this.#ipMap.set(ip, data)
                            return { success: true }
                        }
                    } else {
                        this.#ipMap.set(ip, { count: 1, startTime: currentTime.timestamp, lastTime: currentTime.timestamp })
                        return { success: true }
                    }
                }
            } else {
                return { success: false, code: 503, message: 'IP не определен' }
            }
        }catch(err){
            Logger.error('RequestLimiter.checkIp()',err)
            return { success: false, code: 503, message: 'Ошибка выполнения'}
        }
    }

    static async clean(){
        try{
            if(RequestLimiter.#limiters.length){
                let time = new Time()
                for(let limiter of RequestLimiter.#limiters){
                    for(let [key,value] of limiter.#ipMap){
                        if((time.timestamp - value.lastTime) > (RequestLimiter.#CONFIG.LIMITER_STALE_IP*60*1000))
                            limiter.#ipMap.delete(key)
                    }
                    for(let [key,value] of limiter.#blackList){
                        if(value<time.timestamp)
                            limiter.#blackList.delete(key)
                    }
                }
                return true
            }else{
                return false
            }
        }catch(err){
            Logger.error('RequestLimiter.clean()',err)
            return false
        }
    }


    save(){
        return new Promise((resolve,reject)=>{
            try{
                if(!fs.existsSync(RequestLimiter.#CONFIG.LIMITER_PATH)) {
                    fs.mkdirSync(RequestLimiter.#CONFIG.LIMITER_PATH, { recursive: true })
                }
                let dataBlackList={}, dataIpMap = {}
                if(fs.existsSync(RequestLimiter.#blackListPath)){
                    let data = fs.readFileSync(RequestLimiter.#blackListPath,{encoding:'utf-8'})
                    dataBlackList = JSON.parse(data)
                }
                if(fs.existsSync(RequestLimiter.#ipMapPath)){
                    let data = fs.readFileSync(RequestLimiter.#blackListPath,{encoding:'utf-8'})
                    dataIpMap = JSON.parse(data)
                }
                let name = this.#routes instanceof Map 
                    ? this.domain + crypto.createHash('sha256').update(JSON.stringify(Array.from(this.#routes),this.#regexReplacer)).digest('hex')
                    : this.domain
                dataBlackList[name] = Array.from(this.#blackList)
                dataIpMap[name] = Array.from(this.#ipMap)
                fs.writeFileSync(RequestLimiter.#blackListPath, JSON.stringify(dataBlackList))
                fs.writeFileSync(RequestLimiter.#ipMapPath, JSON.stringify(dataIpMap))
                resolve(true) 
            }catch(err){
                Logger.error('RequestLimiter.save()',err)
                resolve(false)
            }   
        })
    }

    #regexReplacer(key,value){
        if(value instanceof RegExp)
            return {dataType:'RegExp', value: value.toString()}
        else 
            return value
    }

    #regexReviewer(key,value){
        if(value instanceof Object && value?.dataType == 'RegExp'){
            let m = value.value.match(/\/(.*)\/(.*)?/)
            return new RegExp(m[1], m[2] || "")
        }else
            return value
    }
}