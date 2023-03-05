class Time{

    ticks=0
    milliseconds=0
    seconds=0
    minutes=0
    hours=0
    decimalHours=0
    decimalSeconds=0
    decimalMinutes=0
    day=0
    dayOfWeek=0
    month=0
    year=0
    isHigh=false

    static TIMEZONE={
        minus_12:-12,
        minus_11:-11,
        minus_10:-10,
        minus_9_30:-9.5,
        minus_9:-9,
        minus_8_30:-8.5,
        minus_8:-8,
        minus_7:-7,
        minus_6:-6,
        minus_5:-5,
        minus_4_30:-4.5,
        minus_4:-4,
        minus_3_30:-3.5,
        minus_3:-3,
        minus_2_30:-2.5,
        minus_2:-2,
        minus_1:-1,
        utc:0,
        plus_0_30:0.5,
        plus_1: 1,
        plus_2: 2,
        plus_2_30: 2.5,
        plus_3: 3,
        plus_3_30: 3.5,
        plus_4: 4,
        plus_4_30: 4.5,
        plus_5: 5,
        plus_5_30: 5.5,
        plus_6: 6,
        plus_6_30: 6.5,
        plus_7: 7,
        plus_7_30: 7.5,
        plus_8: 8,
        plus_8_30: 8.5,
        plus_9: 9,
        plus_9_30: 9.5,
        plus_10: 10,
        plus_10_30: 10.5,
        plus_11: 11,
        plus_11_30: 11.5,
        plus_12: 12,
        plus_12_45: 12.75,
        plus_13: 13,
        plus_13_45: 13.75,
        plus_14: 14
    }

    static defaultTz=Time.TIMEZONE.utc
    tz=Time.TIMEZONE.utc

    static #getISORegexWithDate(regDay){
        return [
            `^[0-9]{4}(0[0-9]|1[0-2])${regDay}$`,
            `^[0-9]{4}-(0[0-9]|1[0-2])-${regDay}$`
        ]
    }

    static #ISORegex=[
        /^(0[0-9]|1[0-9]|2[0-3])([0-5][0-9])$/, //hhmm
        /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/, //hh:mm
        /^(0[0-9]|1[0-9]|2[0-3])([0-5][0-9])([0-5][0-9])$/, //hhmmss
        /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/, //hh:mm:ss
        /^(0[0-9]|1[0-9]|2[0-3])([0-5][0-9])([0-5][0-9])([\+-]{1})(0[0-9]|1[0-9]|2[0-3])$/, //hhmmss±hh
        /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])([\+-]{1})(0[0-9]|1[0-9]|2[0-3])$/, //hh:mm:ss±hh
        /^(0[0-9]|1[0-9]|2[0-3])([0-5][0-9])([0-5][0-9])([\+-]{1})(0[0-9]|1[0-9]|2[0-3])([0-5][0-9])$/, //hhmmss±hhmm
        /^(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])([\+-]{1})(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/, //hh:mm:ss±hh:mm
        /^([0-9]{4})-(0[1-9]|1[0-2])$/, //YYYY-MM
        /^([0-9]{4})(0[1-9]|1[0-2])$/, // YYYYMM
        /^([0-9]{4})-(0[1-9]|1[0-2])-(0[0-9]|[1-2][0-9]|3[0-1])$/, //YYYY-MM-DD
        /^([0-9]{4})(0[1-9]|1[0-2])(0[0-9]|[1-2][0-9]|3[0-1])$/, //YYYYMMDD
        /^([0-9]{4})(0[1-9]|1[0-2])(0[0-9]|[1-2][0-9]|3[0-1])([T ]{1})(0[0-9]|1[0-9]|2[0-3])([0-5][0-9])([0-5][0-9])$/, //YYYYMMDDThhmmss
        /^([0-9]{4})-(0[1-9]|1[0-2])-(0[0-9]|[1-2][0-9]|3[0-1])([T ]{1})(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/, //YYYY-MM-DDThh:mm:ss
        /^([0-9]{4})(0[1-9]|1[0-2])(0[0-9]|[1-2][0-9]|3[0-1])([T ]{1})(0[0-9]|1[0-9]|2[0-3])([0-5][0-9])([0-5][0-9])([\+-]{1})(0[0-9]|1[0-9]|2[0-3])$/, //YYYYMMDDThhmmss±hh
        /^([0-9]{4})-(0[1-9]|1[0-2])-(0[0-9]|[1-2][0-9]|3[0-1])([T ]{1})(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])([\+-]{1})(0[0-9]|1[0-9]|2[0-3])$/, //YYYY-MM-DDThh:mm:ss±hh
        /^([0-9]{4})(0[1-9]|1[0-2])(0[0-9]|[1-2][0-9]|3[0-1])([T ]{1})(0[0-9]|1[0-9]|2[0-3])([0-5][0-9])([0-5][0-9])([\+-]{1})(0[0-9]|1[0-9]|2[0-3])([0-5][0-9])$/, //YYYYMMDDThhmmss±hhmm
        /^([0-9]{4})-(0[1-9]|1[0-2])-(0[0-9]|[1-2][0-9]|3[0-1])([T ]{1})(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])([\+-]{1})(0[0-9]|1[0-9]|2[0-3])([0-5][0-9])$/, //YYYY-MM-DDThh:mm:ss±hh:mm
        /^([0-9]{4})-(0[1-9]|1[0-2])-(0[0-9]|[1-2][0-9]|3[0-1])([T ]{1})(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.)([0-9]{3})Z?$/, //YYYY-MM-DDThh:mm:ss[.SSS]
        /^([0-9]{4})-(0[1-9]|1[0-2])-(0[0-9]|[1-2][0-9]|3[0-1])([T ]{1})(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.)([0-9]{3})([\+-]{1})(0[0-9]|1[0-9]|2[0-3])Z?$/, //YYYY-MM-DDThh:mm:ss[.SSS]±hh
        /^([0-9]{4})-(0[1-9]|1[0-2])-(0[0-9]|[1-2][0-9]|3[0-1])([T ]{1})(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.)([0-9]{3})([\+-]{1})(0[0-9]|1[0-9]|2[0-3])([0-5][0-9])Z?$/,  //YYYY-MM-DDThh:mm:ss[.SSS]±hhmm
        /^([0-9]{4})-(0[1-9]|1[0-2])-(0[0-9]|[1-2][0-9]|3[0-1])([T ]{1})(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.)([0-9]{3})([\+-]{1})(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])Z?$/ //YYYY-MM-DDThh:mm:ss[.SSS]±hh:mm

    ]

    #reverseISO(str){
        let date;
        let startYear = 1970
        let objDate={
            year:1970,
            month:1,
            day:1,
            dayOfWeek:4,
            hours:0,
            minutes:0,
            seconds:0,
            milliseconds:0,
            tzHours:0,
            tzMinutes:0,
        }
        let tz=0
        let keys =['year','month','day','hours','minutes','seconds','milliseconds','tzHours','tzMinutes']
        for(let reg of Time.#ISORegex){
            let res = str.match(reg)
            if(res){
                res.shift()
                let tzSym=null
                let cicle = res.length
                let elem=res.shift()
                let isMs=false
                for(let i=0,k=0;i<cicle;i++){
                    if(i==0&&elem.length!=4){
                        k+=3
                    }
                    if(/^([T ]{1})$/.test(elem)){
                        elem=res.shift()
                        continue;
                    }
                    if(/^(\.)$/.test(elem)){
                        isMs=true
                        elem=res.shift()
                        continue;
                    }
                    if(/^([\+-]{1})$/.test(elem)){
                        k+=!isMs?1:0
                        tzSym=elem=='-'?-1:1
                        elem=res.shift()
                        continue;
                    }
                    objDate[keys[k]]=Number(elem)
                    elem=res.shift()
                    k++
                }
                tz = ((objDate.tzHours)+(objDate.tzMinutes/60))*tzSym
                break
            }
        } 

        let currentYear=objDate.year
        let allDays=0
        while(currentYear>startYear){
            currentYear--
            if(currentYear%4==0){
                allDays+=366
            }else{
                allDays+=365
            }
        }
        let monthDays=this.#getMonthDays()
        let i=0
        while(i<=objDate.month-2){
            allDays+=monthDays[i]
            i++
        }
        allDays+=objDate.day-1
        this.ticks=(allDays*24*3600*1000)+(objDate.hours*3600*1000)+(objDate.minutes*60*1000)+(objDate.seconds*1000)+objDate.milliseconds
        this.tz=tz
        this.milliseconds=objDate.milliseconds
        this.seconds=objDate.seconds
        this.minutes=objDate.minutes
        this.hours=objDate.hours
        this.day=objDate.day
        this.dayOfWeek=((allDays%7)-3)<=0?((allDays%7)-3)+7:((allDays%7)-3)
        this.month=objDate.month
        this.year=objDate.year
        this.decimalSeconds=Number(`${this.seconds}.${this.milliseconds.toString().padStart(3,'0')}`)
        this.decimalMinutes=this.minutes+(this.decimalSeconds/60)
        this.decimalHours=this.hours+(this.decimalMinutes/60)
        this.isHigh=this.year%4==0
    }
    
    static #getMonthDayReg(year, month){
        let high = Number(year)%4==0
        let days = [31,high?29:28,31,30,31,30,31,31,30,31,30,31]
        let day31 = '(0[0-9]|1[0-9]|2[0-9]|3[0-1])'
        let day30 = '(0[0-9]|1[0-9]|2[0-9]|30)'
        let day29 = '(0[0-9]|1[0-9]|2[0-9])'
        let day28 = '(0[0-9]|1[0-9]|2[0-8])'
        if([1,3,5,7,8,10,12].includes(month)){
            return days31
        }else if([4,6,9,11].includes(month)){
            return days30
        }else{
            if(high) return days29
            else return days28
        }
    }

    static setDefaultTz(tz){
        for(let key in Time.TIMEZONE){
            if(Time.TIMEZONE[key]==tz){
                Time.defaultTz=Time.TIMEZONE[key]
                return true
            }
        }
        return false
    }

    constructor(param,tz=null){
        if(typeof param=='string'){
            this.#reverseISO(param)
        }else{
            if(typeof param=='number'){
                this.ticks = param
            }else if(param instanceof Date){
                if(typeof window ==='undefined'){
                    this.ticks=param.getTime()
                }else{
                    this.ticks=param.getTime()-(param.getTimezoneOffset()*60*1000)
                }
            }else if(param instanceof Time){
                this.ticks=param.ticks
            }else{
                if(typeof window ==='undefined'){
                    this.ticks=new Date().getTime()
                }else{
                    this.ticks=new Date().getTime()-(new Date().getTimezoneOffset()*60*1000)
                }
            }
            if(tz!==null){
                let isset=false
                for(let key in Time.TIMEZONE){
                    if(Time.TIMEZONE[key]==tz){
                        this.tz=Time.TIMEZONE[key]
                        isset=true
                        break
                    }
                }
                if(!isset){
                    this.tz=Time.defaultTz
                }
            }else{
                this.tz=Time.defaultTz
            }
            this.ticks+=(this.tz*3600*1000)
            this.#reCalc()
        }
    }

    setTz(tz,diff=true){
        let isset=false
        for(let key in Time.TIMEZONE){
            if(Time.TIMEZONE[key]==tz){
                if(diff){
                    let diffTz=Time.TIMEZONE[key]-this.tz
                    this.ticks+=(diffTz*3600*1000)
                }
                this.tz=Time.TIMEZONE[key]
                
                isset=true
                break
            }
        }
        if(isset&&diff){
            this.#reCalc()
        }
        return this
    }

    #reCalc(){
        let days = Math.floor(this.ticks/(1000*3600*24))
        this.dayOfWeek=((days%7)-3)<=0?((days%7)-3)+7:((days%7)-3)
        let currentYearHigh=false
        let currentYear=1970
        while(currentYearHigh&&days>=366||!currentYearHigh&&days>=365){
            currentYear++
            if(currentYear%4==0){
                days-=366
                currentYearHigh=true
            }else{
                days-=365
                currentYearHigh=false
            }
        }
        this.isHigh=currentYearHigh
        this.year=currentYear
        let monthDays=this.#getMonthDays()
        let currentMonth=1
        let i=0
        while(days>=monthDays[i]){
            days-=monthDays[i]
            currentMonth++
            i++
        }
        this.decimalHours=this.ticks%(1000*3600*24)/(3600*1000)
        this.decimalMinutes = this.ticks%(1000*3600*24)%(3600*1000)/(60000)
        this.decimalSeconds = this.ticks%(1000*3600*24)%(3600*1000)%(60000)/1000
        this.milliseconds = this.ticks%(1000*3600*24)%(3600*1000)%(60000)%1000
        this.hours=Math.floor(this.decimalHours)
        this.minutes=Math.floor(this.decimalMinutes)
        this.seconds=Math.floor(this.decimalSeconds)
        this.day=days+1

        this.month=currentMonth
        this.year=currentYear
        this.isHigh=currentYearHigh
    }

    #getMonthDays(high=null){
        high = high!==null?high:this.isHigh
        return [31,high?29:28,31,30,31,30,31,31,30,31,30,31]
    }

    toISO(){
        return `${this.year.toString().padStart(4,'0')}-${(this.month).toString().padStart(2,'0')}-${this.day.toString().padStart(2,'0')}T${this.hours.toString().padStart(2,'0')}:${this.minutes.toString().padStart(2,'0')}:${this.seconds.toString().padStart(2,'0')}.${this.milliseconds.toString().padStart(3,'0')}${this.tz<0?'-':'+'}${Math.floor(Math.abs(this.tz)).toString().padStart(2,'0')}${Math.abs((this.tz*60)%60).toString().padStart(2,'0')}`
    }

    add(param){
        if(param instanceof Time){
            this.ticks+=param.ticks
        }else if(param instanceof Date||typeof param=='string'){
            this.ticks+=new Time(param).ticks
        }else if(typeof param == 'number'){
            this.ticks+=param
        }
        this.#reCalc()
        return this
    }

    addMinute(minutes){
        this.ticks+=(minutes*60*1000)
        this.#reCalc()
        return this
    }

    addHour(hour){
        this.ticks+=(hour*3600*1000)
        this.#reCalc()
        return this
    }

    addDay(day){
        this.ticks+=(day*24*3600*1000)
        this.#reCalc()
        return this
    }

    addMonth(month){ //Добавить смещение для високосных годов
        let diff = this.month+month
        let days = this.#getMonthDays()
        let minus=diff<this.month?true:false
        let index=diff<this.month?this.month--:this.month++
        let allDays=0
        let currentYear=this.year
        for(let i=0;i<Math.abs(month);i++){
            if(index>11){
                currentYear++
                days = this.#getMonthDays(currentYear%4==0)
                index=0
            }
            if(index<0){
                currentYear--
                days = this.#getMonthDays(currentYear%4==0)
                index=11
            }
            if(minus){
                allDays-=days[index]
            }else{
                allDays+=days[index]
            }
            index+=minus?-1:1
        }
        this.ticks+=(allDays*24*3600*1000)
        this.#reCalc()
        return this
    }

    addYear(year){
        let diff = this.year+year
        let minus = diff<this.year?true:false
        let allDays=0
        if(minus){
            for(let i=this.year;i>diff;i--){
                allDays-=i%4==0?366:365
            }
        }else{
            for(let i=this.year;i<diff;i++){
                allDays+=i%4==0?366:365
            }
        }
        this.ticks+=(allDays*24*3600*1000)
        this.#reCalc()
        return this
    }
   
    

    setTime(hours=null,minutes=null,seconds=null,milliseconds=null){
        let isCalc=false
        if(/^([0-9]|1[0-9]|2[0-3])$/.test(hours)){
            let diffHours = Number(hours)-this.hours
            this.ticks+=(diffHours*3600*1000)
            isCalc=true
        }
        if(/^([0-9]|[0-5][0-9])$/.test(minutes)){
            let diffMinutes = Number(minutes)-this.minutes
            this.ticks+=(diffMinutes*60*1000)
            isCalc=true
        }
        if(/^([0-9]|[0-5][0-9])$/.test(seconds)){
            let diffSeconds = Number(seconds)-this.seconds
            this.ticks+=(diffSeconds*1000)
            isCalc=true
        }
        if(/^([0-9]|[1-9][0-9]|[1-9][0-9][0-9])$/.test(milliseconds)){
            let diffMili = Number(milliseconds)-this.milliseconds
            this.ticks+=diffMili
            isCalc=true
        }
        if(isCalc){
            this.#reCalc()
        }
        return this
    }

    setDate(day=null,month=null,year=null){ //Проверить еще раз
        if(/^([0-9]{4})$/.test(year)){
            year = Number(year)
            let diff = year-this.year
            let minus = diff<0?true:false
            let allDays=0
            if(minus){
                for(let i=this.year;i>this.year+diff;i--){
                    allDays-=i%4==0?366:365
                }
            }else{
                for(let i=this.year;i<this.year+diff;i++){
                    allDays+=i%4==0?366:365
                }
            }
            this.ticks+=(allDays*24*3600*1000)
            this.#reCalc()
        }
        if(/^([1-9]|1[0-2])$/.test(month)){
            month = Number(month)
            let diff = month-this.month
            let days = this.#getMonthDays()
            let minus=diff<0?true:false
            let allDays=0
            if(minus){
                for(let i=this.month-1;i>this.month-1+diff;i--){
                    allDays-=days[i-1]
                }
            }else{
                for(let i=this.month-1;i<this.month-1+diff;i++){
                    allDays+=days[i]
                }
            }
            this.ticks+=(allDays*24*3600*1000)
            this.#reCalc()
        }
        if(/^([0-9]|[1-2][0-9]|3[0-1])$/.test(day)){
            let days = this.#getMonthDays()
            day=Number(day)
            if(day<1||day>days[this.month-1]){
                return
            }
            let diff=day-this.day
            this.ticks+=(diff*24*3600*1000)
            this.#reCalc()
        }
        return this
    }

    startDay(){
        let sum = (this.hours*3600*1000)+(this.minutes*60*1000)+(this.seconds*1000)+this.milliseconds
        this.ticks-=sum
        this.#reCalc()
        return this
    }

    endDay(){
        let sum = ((23-this.hours)*3600*1000)+((59-this.minutes)*60*1000)+((59-this.seconds)*1000)+(999-this.milliseconds)
        this.ticks+=sum
        this.#reCalc()
        return this
    }

    format(pattern){
        let res = pattern.match(/(\$\{[^\{\}]+\})/g)
        while(res){
            let item = res.shift()
            item = item.replace(/[\{\}\$]/g,'')
            item = item.replace(/AP/g,this.hours>12?(this.hours-12).toString().padStart(2,'0'):this.hours.toString().padStart(2,'0'))
            item = item.replace(/H/g,this.hours.toString().padStart(2,'0'))
            item = item.replace(/m/g,this.minutes.toString().padStart(2,'0'))
            item = item.replace(/S/g,this.seconds.toString().padStart(2,'0'))
            item = item.replace(/Y/g,this.year)
            item = item.replace(/y/g,this.year.toString().slice(2))
            item = item.replace(/D/g,this.day.toString().padStart(2,'0'))
            item = item.replace(/M/g,this.month.toString().padStart(2,'0'))
            item = item.replace(/s/g,this.milliseconds.toString().padStart(2,'0'))
            item = item.replace(/TZ/g,`${this.tz>=0?'+':'-'}`+Math.abs(Math.floor(this.tz)).toString().padStart(2,'0')+':'+Math.abs((this.tz*60)%60).toString().padStart(2,'0'))
            pattern = pattern.replace(/(\$\{[^\{\}]+\})/,item)
            res = pattern.match(/(\$\{[^\{\}]+\})/g)
        }
        return pattern
    }

    valueOf(){
        return this.ticks
    }

}

module.exports=Time

