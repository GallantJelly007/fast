//@ts-check
import Logger from "./logger.mjs"
import Time from "timelex"

export default class TaskManager{

    static #timeout
    static #tasks = new Map()
    static #isRun = false

    /**
     * @param {Number|Time} time 
     * Кол-во миллисекунд задержки, либо объект с временем запуска Time (часовой пояс по UTC) (Если устанавливается Time функция выполнится только 1 раз в указанное время)
     * @param {Function} callback 
     * Функция которая будет вызываться через интервал time
     * @param {object} options
     * Объект с дополнительными параметрами
     * @param {Array<any>|undefined} [options.funcArgs] 
     * Массив с параметрами для callback-функции (кол-во параметров(элементов) в массиве должно соответствовать кол-ву аргументов функции)
     * @param {Number|undefined} [options.repeatCount]
     * Кол-во повторных вызовов функции (по умолчанию: -1(бесконечно))
     * @returns {Promise<boolean>}
     */
    static async addTask(time,callback,options={}){
        try{
            if(callback instanceof Function){
                let repeatCount = -1
                let funcArgs = []
                if(typeof options == 'object' && options.constructor!=Array){
                    repeatCount = options?.repeatCount!=undefined 
                                && typeof options.repeatCount == 'number' 
                                && options.repeatCount>0 
                                && options.repeatCount<=Number.MAX_SAFE_INTEGER 
                                ? options.repeatCount 
                                : repeatCount
                    funcArgs = options?.funcArgs!=undefined 
                            && Array.isArray(options.funcArgs) 
                            ? options.funcArgs 
                            : funcArgs
                }
                if(typeof time == 'number')
                    time = time < 0 || time > Number.MAX_SAFE_INTEGER ? 0 : time
                else if(time instanceof Time)
                    repeatCount = 1
                else
                    time=0
                TaskManager.#tasks.set(callback,{   
                    interval:time,
                    startTime:null,
                    funcArgs:funcArgs,
                    repeatCount:repeatCount,
                    count:0
                })
                if(!TaskManager.#isRun){
                    TaskManager.#isRun = true
                    TaskManager.#runTasks()
                }
                return true
            }
            return false
        }catch(err){
            Logger.error('TaskManager.addTask()', err)
            return false
        }
    }

    static removeTask(callback){
        if(callback instanceof Function){
            if(TaskManager.#tasks.has(callback)){
                TaskManager.#tasks.delete(callback)
                if(TaskManager.#tasks.size == 0 && TaskManager.#isRun){
                    TaskManager.#isRun = false
                }
                return true
            }else{
                return false
            }
        }
        return false
    }

    static async #runTasks(){
        try{
            if(TaskManager.#isRun){
                let currentTime = new Time().setTz(Time.TIMEZONE.utc)
                let taskKeys = []
                TaskManager.#tasks.forEach((options,callback)=>{
                    if(options.startTime == null)
                        options.startTime = new Time().setTz(Time.TIMEZONE.utc)
                    let isRun=false
                    if(options.interval instanceof Time){
                        isRun = currentTime.equals(options.interval)
                    }else{
                        let millis = currentTime.valueOf() - options.startTime.valueOf()
                        isRun = millis>=options.interval
                    }
                    if(isRun){
                        if(options.funcArgs.length)
                            callback(...options.funcArgs)
                        else
                            callback()
                        options.startTime = new Time().setTz(Time.TIMEZONE.utc)
                        if(options.repeatCount!=-1){
                            options.count++
                            if(options.count>=options.repeatCount)
                                taskKeys.push(callback)
                        }
                    }
                })
                for(let key of taskKeys){
                    TaskManager.#tasks.delete(key)
                }
                if(TaskManager.#tasks.size==0){
                    TaskManager.#isRun = false
                }
                TaskManager.#timeout = setTimeout(()=>TaskManager.#runTasks(),1)
            }else{
                clearTimeout(TaskManager.#timeout)
            }
        }catch(err){
            Logger.error('TaskManager.runTasks()', err)
        }
    }
}