class Time{
    /** Количество миллисекунд прошедших с начала эпохи UNIX*/
    timestamp = 0
     /** Количество миллисекунд прошедших с начала 1 января 1 года н.э */
    ticks=0
    /** Миллисекунды от 0 до 999 */
    milliseconds=0
    /** Секунды от 0 до 59 */
    seconds=0
    /** Минуты от 0 до 59 */
    minutes=0
    /** Часы от 0 до 23 */
    hours=0
    /** Кол-во секунд с остатком в десятичном формате*/
    decimalSeconds=0
    /** Кол-во минут с остатком в десятичном формате*/
    decimalMinutes=0
    /** Кол-во часов с остатком в десятичном формате*/
    decimalHours=0
    /** Календарный день */
    day=1
    /** День недели от 1 до 7, где 1-Понедельник */
    dayOfWeek=4
    /** Месяц  от 1 до 12, где 1-Январь*/
    month=1
    /** Год в формате XXXX */
    year=1970
    /** Свойство високосности, если true - год високосный */
    isLeap=false
    /** Текущее смещение времени по временной зоне */
    tz=Time.TIMEZONE.utc

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

    static #daysMonthYear = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
    static #daysMonthLeapYear = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];

    static #monthesString = new Map([
        ['ru',['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']],
        ['en',['January','February','March','April','May','June','July','August','September','October','November','December']]
    ])

    static #getMonthDayReg(month,leap=false){
        let day31 = '(0[0-9]|1[0-9]|2[0-9]|3[0-1])'
        let day30 = '(0[0-9]|1[0-9]|2[0-9]|30)'
        let day29 = '(0[0-9]|1[0-9]|2[0-9])'
        let day28 = '(0[0-9]|1[0-9]|2[0-8])'
        if([1,3,5,7,8,10,12].includes(month)){
            return day31
        }else if([4,6,9,11].includes(month)){
            return day30
        }else{
            if(leap) return day29
            else return day28
        }
    }

    /** Временные зоны */
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

    /** Стандартное значение временной зоны, UTC-0 по умолчанию*/
    static defaultTz=Time.TIMEZONE.utc

    /**
     * ISO форматы, могут применяться для форматирования строки с помощью метода toISO()
     */
    static ISOFormats={
        /**  Формат строки ISO (hhmm) */
        TIME:'${Hm}',
        /**  Формат строки ISO (hh:mm) */
        TIMECLN:'${H:m}',
        /**  Формат строки ISO (hhmmss) */
        TIMESEC:'${HmS}',
        /**  Формат строки ISO (hh:mm:ss) */
        TIMESECCLN:'${H:m:S}',
        /**  Формат строки ISO (hhmmss±hh) */
        TIMESECTH:'${HmSTh}',
        /**  Формат строки ISO (hh:mm:ss±hh) */
        TIMESECCLNTH:'${H:m:STh}',
        /**  Формат строки ISO (hhmmss±hhmm) */
        TIMESECTZ:'${HmSThTp}',
        /**  Формат строки ISO (hh:mm:ss±hh:mm) */
        TIMESECCLNTZ:'${H:m:SThTp}',
        /**  Формат строки ISO (YYYY-MM) */
        DATEYMCLN:'${Y-M}',
        /**  Формат строки ISO (YYYYMM) */
        DATEYM:'${YM}',
        /**  Формат строки ISO (YYYY-MM-DD) */
        DATEYMDCLN:'${Y-M-D}',
        /**  Формат строки ISO (YYYYMMDD) */
        DATEYMD:'${YMD}',
        /**  Формат строки ISO (YYYYMMDDThhmmss) */
        DATETIMEYMD:'${YMDHmS}',
        /**  Формат строки ISO (YYYY-MM-DDThh:mm:ss) */
        DATETIMECLN:'${Y-M-DTH:m:S}',
        /**  Формат строки ISO (YYYYMMDDThhmmss±hh) */
        DATETIMETH:'${YMDTHmSTh}',
        /**  Формат строки ISO (YYYY-MM-DDThh:mm:ss±hh) */
        DATETIMECLNTH:'${Y-M-DTH:m:STh}',
        /**  Формат строки ISO (YYYYMMDDThhmmss±hhmm) */
        DATETIMETZ:'${YMDTHmSThTp}',
        /**  Формат строки ISO (YYYY-MM-DDThh:mm:ss±hh:mm) */
        DATETIMECLNTZCLN:'${Y-M-DTH:m:STz}',
        /**  Формат строки ISO (YYYY-MM-DDThh:mm:ss[.SSS]) */
        DATETIMEMSCLN:'${Y-M-DTH:m:S.s}',
        /**  Формат строки ISO (YYYY-MM-DDThh:mm:ss[.SSS]±hh) */
        DATETIMEMSCLNTH:'${Y-M-DTH:m:S.sTh}',
         /**  Формат строки ISO (YYYY-MM-DDThh:mm:ss[.SSS]±hhmm) */
        DATETIMEMSCLNTZ:'${Y-M-DTH:m:S.sThTp}',
         /**  Формат строки ISO (YYYY-MM-DDThh:mm:ss[.SSS]±hh:mm) */
        DATETIMEMSCLNTZCLN:'${Y-M-DTH:m:S.sTz}'
    }

    /**
     * Функция проверяющая является ли указанный год високосным
     * @param {number} year
     * Год от 1 до 9999
     * @returns {boolean} 
     * Возвращает true если год високосный, иначе - false
     */
    static isLeapYear(year) {
        if (year < 1 || year > 9999) {
            console.log(year)
            throw new Error("Year out of range Exception")
        }
        return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    }

    /** 
     * Метод установки временной зоны по умолчанию
     * @param {number} tz
     * Временная зона из массива Time.TIMEZONE
     */
    static setDefaultTz(tz){
        for(let key in Time.TIMEZONE){
            if(Time.TIMEZONE[key]==tz){
                Time.defaultTz=Time.TIMEZONE[key]
                return true
            }
        }
        return false
    }

     /**
     * Статическая функция для получения кол-ва дней в месяце
     * @param {number} month 
     * Месяц от 1 до 12
     * @param {boolean} high
     * Если true устанавливает год как високосный
     * ---
     * @returns {number} 
     * Кол-во дней в месяце
     */
    static getMonthDayCount(month,high=false){
        let monthDays = [31,high?29:28,31,30,31,30,31,31,30,31,30,31]
        if(month<1||month>12)
            return false
        return monthDays[month-1]
    }

    /**
     * Функция для получения строкового представления всех месяцев, или указанного месяца
     * @param {boolean} thisMonth 
     * Если true возвращает строковое представление указанного месяца, по умолчанию - false
     * @param {number} month 
     * Номер месяца от 1 до 12
     * @param {string} locale 
     * Параметр локализации
     * ---
     * @returns {string|Array<string>}
     * Возвращает строку (при thisMonth=true), либо массив строк
     */
    static getMonthString(thisMonth=false,month=1,locale='ru'){
        if(month<1||month>12)
            throw new Error('Month out of range exception')
        if(Time.#monthesString.has(locale)){
            if(thisMonth){
                let monthes = Time.#monthesString.get(locale)
                return monthes[month-1]
            }else{
                return Time.#monthesString.get(locale)
            }
        }
    }

    /**
     * Статическая функция получения кол-ва миллисекунд прошедших с 1 января 1 года н.э из метки времени UNIX
     * @param {number} timestamp 
     * Метка времени UNIX
     * @returns {number}
     * Кол-во миллисекунд
     */
    static timestampToTicks(timestamp){
        const ticksForStart = 62135596800000
        return timestamp+ticksForStart
    }

    /**
     * Статическая функция получения метки времени UNIX из кол-ва миллисекунд прошедших с 1 января 1 года н.э
     * @param {number} tiсks 
     * Кол-во миллисекунд прошедших с 1 января 1 года
     * @returns {number}
     * Метка времени UNIX
     */
    static ticksToTimestamp(ticks){
        return ticks-62135596800000
    }

    /**
     * Статическая функция создания определенной даты
     * @param {number} year
     * Год от 1 до 9999 (по умолчанию - 1970)
     * @param {number} month
     * Месяц от 1 до 12 (по умолчанию - 1)
     * @param {number} day
     * День в пределах указанного месяца и года (по умолчанию - 1)
     * @param {number} hours
     * Час в 24-х часовом формате (по умолчанию - 0)
     * @param {number} minutes
     * Минуты от 0 до 59 (по умолчанию - 0)
     * @param {number} seconds
     * Секунды от 0 до 59 (по умолчанию - 0)
     * @param {number} ms 
     * Миллисекунды от 0 до 999 (по умолчанию - 0)
     * @param {number} tz
     * Временная зона соответствующая Time.TIMEZONE (по умолчанию UTC0)
     * @returns {Time}
     * Возвращает объект Time
     */ 
    static create(year=1970,month=1,day=1,hours=0,minutes=0,seconds=0,ms=0,tz=Time.TIMEZONE.utc){
        let t = new Time()
        t.#calcTicks({
            year:year,
            month:month,
            day:day,
            hours:hours,
            minutes:minutes,
            seconds:seconds,
            milliseconds:ms,
            timezone:tz
        })
        return t
    }

    /**
     * Функция для нахождения кол-ва високосных дней(годов) в указанном промежутке лет
     * @param {number} yearStart 
     * Стартовы год от 1 до 9999
     * @param {number} yearEnd 
     * Финальный год от 1 до 9999
     * @returns {number}
     * Кол-во високосных лет(дней)
     */
    static leapYearsBeetwen(yearStart,yearEnd){
        if(yearStart<1||yearStart>9999||yearEnd<1||yearEnd>9999)
            throw new Error('Param year out of range Exception');
        let diff = yearEnd-yearStart
        let leapYears = Math.floor(diff/4-diff/100+diff/400)
        return leapYears;
    }

    /** 
    * Создание нового объекта времени
    * @param {Time|Date|string|number} param
    * Строка времени в формате ISO, временная метка в миллисекундах, стандартный объект Date либо другой объект Time для установки первоначального значения
    * @param {number} tz 
    * Временная зона из массива Time.TIMEZONE
    */
    constructor(param,tz=null){
        if(typeof param=='string'){
            this.#reverseISO(param)
        }else{
            if(typeof param=='number'){
                this.timestamp = param
            }else if(param instanceof Date){
                if(typeof window ==='undefined'){
                    this.timestamp=param.getTime()
                }else{
                    this.timestamp=param.getTime()-(param.getTimezoneOffset()*60*1000)
                }
            }else if(param instanceof Time){
                this.timestamp=param.ticks
            }else{
                this.timestamp=new Date().getTime()
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
            this.timestamp+=(this.tz*3600*1000)
            this.#calcDate()
        }
    }

    #reverseISO(str){
        let objDate={
            year:1970,
            month:1,
            day:1,
            hours:0,
            minutes:0,
            seconds:0,
            milliseconds:0,
            tzHours:0,
            tzMinutes:0,
        }
        let tz=Time.TIMEZONE.utc
        let keys =['year','month','day','hours','minutes','seconds','milliseconds','tzHours','tzMinutes']
        for(let reg of Time.#ISORegex){
            let res = str.match(reg)
            if(res){
                res.shift()
                let tzSym=0
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
        console.log(objDate)
        this.#calcTicks({
            year:objDate.year,
            month:objDate.month,
            day:objDate.day,
            hours:objDate.hours,
            minutes:objDate.minutes,
            seconds:objDate.seconds,
            milliseconds:objDate.milliseconds,
            timezone:tz
        })
    }

    #calcDate(){
        this.ticks=Time.timestampToTicks(this.timestamp)
        let days = this.ticks/86400000
        let leapDays = days/1461-days/36524+days/146097+59/365
        let years = ((this.ticks/86400000) - leapDays)/365;
        this.year=Math.trunc(years)+1
        let daysInYear = Math.trunc(((this.ticks-(Math.floor(leapDays)*86400000))-((this.year-1)*365*86400000))/86400000)
        this.isLeap=Time.isLeapYear(this.year)
        let arrDays = this.isLeap?Time.#daysMonthLeapYear:Time.#daysMonthYear
        let month=0;
        let day=0; 
        for(let i = 0; i<arrDays.length;i++){
            if(daysInYear<=arrDays[i+1]){
                month=i+1
                day=Math.floor(daysInYear-arrDays[i])+1
                break
            }
        }

        let currentCountMonthDay = Time.getMonthDayCount(month,this.isLeap)
        let isCorrect=false
        if(day>currentCountMonthDay){
            if(month==12){
                this.year++;
                month=1
                this.isLeap = Time.isLeapYear(this.year)
                day = 1
            }else{
                month++;
                day = 1
            }
            isCorrect=true
        }
        if(day-1==0&&!this.isLeap&&!isCorrect&&(this.ticks/86400000>1)){
            if(month-1==0){
                month = 12;
                this.year+=this.year!=1?-1:0;
                this.isLeap = Time.isLeapYear(this.year)
                day = Time.getMonthDayCount(month,this.isLeap)
            }else{
                month--;
                day = Time.getMonthDayCount(month,this.isLeap)
            }
        }

        this.month=month
        this.day=day
        this.decimalHours = (this.ticks%86400000)/3600000
        this.decimalMinutes = (this.ticks%3600000)/60000
        this.decimalSeconds = (this.ticks%60000)/1000
        this.hours = Math.trunc(this.decimalHours)
        this.minutes = Math.trunc(this.decimalMinutes)
        this.seconds = Math.trunc(this.decimalSeconds)
        this.milliseconds = this.ticks%1000
        this.dayOfWeek=Math.abs(((days%7)-6)<=0?((days%7)-6)+7:((days%7)-6))
    }

    #calcTicks(param={}){
        let days=1;
        let paramYear = (param.hasOwnProperty('year') && typeof param.year=='number' && /^([1-9]|[1-9][0-9]{1,3})$/.test(param.year))?param.year:this.year
        let paramMonth = (param.hasOwnProperty('month') && typeof param.month=='number' && /^([1-9]|1[0-2])$/.test(param.month))?param.month:this.month
        let paramDay = (param.hasOwnProperty('day') && typeof param.day=='number' && /^([0-9]|[1-2][0-9]|3[0-1])$/.test(param.day))?param.day:this.day
        let paramHours = (param.hasOwnProperty('hours') && typeof param.hours=='number' && /^([0-9]|1[0-9]|2[0-3])$/.test(param.hours))?param.hours:this.hours
        let paramMinutes = (param.hasOwnProperty('minutes') && typeof param.minutes=='number' && /^([0-9]|[0-5][0-9])$/.test(param.minutes))?param.minutes:this.minutes
        let paramSeconds = (param.hasOwnProperty('seconds') && typeof param.seconds=='number' && /^([0-9]|[0-5][0-9])$/.test(param.seconds))?param.seconds:this.seconds
        let paramMs = (param.hasOwnProperty('milliseconds') && typeof param.milliseconds=='number' && /^([0-9]|[1-9][0-9]|[1-9][0-9][0-9])$/.test(param.milliseconds))?param.milliseconds:this.milliseconds
        if(param.hasOwnProperty('timezone') && typeof param.timezone=='number'){
            for(let key in Time.TIMEZONE){
                if(Time.TIMEZONE[key]==param.timezone){
                    this.tz=Time.TIMEZONE[key]
                    break
                }
            }
        }
        if (paramYear >= 1 && paramYear <= 9999 && paramMonth >= 1 && paramMonth <= 12) {
            this.year = paramYear
            this.month = paramMonth
            let arrDays = Time.isLeapYear(paramYear)? Time.#daysMonthLeapYear: Time.#daysMonthYear;
            if (paramDay >= 1 && paramDay <= arrDays[paramMonth] - arrDays[paramMonth - 1]) {
                this.day=paramDay
                let y = paramYear - 1;
                days = y * 365 + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + arrDays[paramMonth - 1] + paramDay - 1;
            }
        }
        this.dayOfWeek=Math.abs(((days%7)-6)<=0?((days%7)-6)+7:((days%7)-6))
        let timeTicks = paramHours * 3600000 + paramMinutes * 60000 + paramSeconds*1000+paramMs;
        this.decimalHours = timeTicks/3600000;
        this.decimalMinutes = (paramMinutes * 60000 + paramSeconds*1000+paramMs)/60000
        this.decimalSeconds = (paramSeconds*1000+paramMs)/1000
        this.hours = Math.trunc(this.decimalHours)
        this.minutes = Math.trunc(this.decimalMinutes)
        this.seconds = Math.trunc(this.decimalSeconds)
        this.milliseconds = paramMs
        if (timeTicks > Number.MAX_SAFE_INTEGER || timeTicks < Number.MIN_SAFE_INTEGER){
            throw new Error('Out of range number value when calc ticks in time')
        }
        this.isLeap = this.year%4==0&&(this.year%100!=0||this.year%400==0)
        this.ticks = Math.trunc(days*24*3600*1000)+timeTicks
        this.ticks+=(this.ticks<Math.abs(this.tz*3600000)&&this.tz<0)?-this.ticks:(this.tz*3600000)
        this.timestamp = Time.ticksToTimestamp(this.ticks)
    }   

    #getMonthDays(leap=null){
        leap = leap!==null?leap:this.isLeap
        return [31,leap?29:28,31,30,31,30,31,31,30,31,30,31]
    }

    /** 
     * Установка новой временной зоны для текущего объекта Time
     * @param {number} tz 
     * Временная зона из массива Time.TIMEZONE
     * @param {boolean} diff
     * Параметр отвечающий за вычитание разницы времени между старой и новой временной зоной, по умолчанию - true
    */
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
            this.#calcDate()
        }
        return this
    }

    /**
     * Функция для получения строки времени в формате ISO
     * @param {?string} format 
     * Строка формата из свойства Time.ISOFormats
     * @returns {string} Строка времени в формате ISO
     */
    toISO(format=null){
        if(format!=null){
            for(let key in Time.ISOFormats){
                if(format==Time.ISOFormats[key])
                    return this.format(Time.ISOFormats[key])
            }
        }
        return this.format(Time.ISOFormats.DATETIMEMSCLNTZ)
    }

    /**
     * Функция для получения строкового представления месяца текущего Time объекта
     * @param {string} locale 
     * Параметр локализации
     * ---
     * @returns {string}
     * Возвращает строку с наименованием месяца
     */
    getMonthString(locale='ru'){
        if(Time.#monthesString.has(locale)){
            let monthes = Time.#monthesString.get(locale)
            return monthes[this.month-1]
        }
    }

    /**
     * Функция для получения кол-ва дней в месяце текущего объекта даты
     * @returns {number} 
     * Кол-во дней в месяце
     */
    getMonthDayCount(){
        return this.#getMonthDays(this.isLeap)[this.month-1]
    }

    /**
     * Функция для сложения дат
     * @param {Time|Date|string|number} param
     * Объект Time,Date либо строка времени в формате ISO, или метка времени UNIX для сложения с текущей датой 
     * @returns {Time} возвращает текущий объект Time с обновленными значениями
     */
    add(param){ 
        let paramTicks=0;
        if(param instanceof Time){
            paramTicks=param.ticks
        }else if(param instanceof Date||typeof param=='string'||typeof param == 'number'){
            paramTicks=new Time(param).ticks
        }
        let ticks = this.ticks+paramTicks+(Time.isLeapYear(this.year)?31622400000:31536000000)+86400000
        ticks = ticks<0?0:(ticks>315537897599999?315537897599999:ticks)
        this.timestamp = Time.ticksToTimestamp(ticks)
        this.#calcDate()
        return this
    }

    /**
     * Функция для вычитания дат
     * @param {Time|Date|string|number} param
     * Объект Time,Date либо строка времени в формате ISO, или метка времени UNIX для сложения с текущей датой 
     * @returns {Time} возвращает текущий объект Time с обновленными значениями
     */
    diff(param){
        let paramTicks=0;
        if(param instanceof Time){
            paramTicks=param.ticks
        }else if(param instanceof Date||typeof param=='string'||typeof param == 'number'){
            paramTicks=new Time(param).ticks
        }
        let ticks = this.ticks-paramTicks-(Time.isLeapYear(this.year-1)?31622400000:31536000000)-86400000 
        ticks = ticks<0?0:(ticks>315537897599999?315537897599999:ticks)
        this.timestamp = Time.ticksToTimestamp(ticks)
        this.#calcDate()
        return this
    }

    addSeconds(seconds){
        this.ticks+=(seconds*1000)
        this.#calcDate()
        return this
    }

    /**
     * Функция для сложения и вычитания минут (для вычитания используйте отрицательные значения)
     * @param {number} minutes
     * Кол-во минут для прибавления/вычитания
     * @returns {Time} возвращает текущий объект Time с обновленными значениями
     */
    addMinutes(minutes){
        this.ticks+=(minutes*60*1000)
        this.#calcDate()
        return this
    }

    /**
     * Функция для сложения и вычитания часов (для вычитания используйте отрицательные значения)
     * @param {number} hours
     * Кол-во часов для прибавления/вычитания
     * @returns {Time} возвращает текущий объект Time с обновленными значениями
     */
    addHours(hours){
        this.ticks+=(hours*3600*1000)
        this.#calcDate()
        return this
    }
 
    /**
     * Функция для сложения и вычитания лет (для вычитания используйте отрицательные значения)
     * @param {number} years
     * Кол-во лет для прибавления/вычитания
     * @returns {Time} возвращает текущий объект Time с обновленными значениями
     */
    addYear(years){
        this.year+=years
        this.#calcTicks()
        return this
    }
    
     /**
     * Функция для сложения и вычитания месяцев (для вычитания используйте отрицательные значения)
     * @param {number} months
     * Кол-во месяцев для прибавления/вычитания
     * @returns {Time} возвращает текущий объект Time с обновленными значениями
     */
    addMonth(months){
        let diff = this.month+months
        let minus=diff<this.month?true:false
        let index=diff<this.month?this.month-2:this.month-1
        let currentYear = this.year;
        for(let i=Math.abs(months);i>0;i--){
            if(index>11){
                currentYear++
                index=0
            }
            if(index<0){
                currentYear--
                index=11
            }
            index+=minus?-1:1
        }
        this.month=index+1
        this.year=currentYear
        this.#calcTicks()
        return this
    }

    /**
     * Функция для сложения и вычитания дней (для вычитания используйте отрицательные значения)
     * @param {number} days
     * Кол-во дней для прибавления/вычитания
     * @returns {Time} возвращает текущий объект Time с обновленными значениями
    */
    addDay(days){
        this.ticks+=(days*24*3600*1000)
        this.#calcDate()
        return this
    }

    /**
     * Функция для установки текущего времени 
     * @param {number} hours
     * Часы от 0 до 23
     * @param {number} minutes
     * Минуты от 0 до 59
     * @param {number} seconds
     * Секунды от 0 до 59
     * @param {number} milliseconds
     * Миллисекунды от 0 до 999
     * @returns {Time} возвращает текущий объект Time с обновленными значениями
     */
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
        if(isCalc)
            this.#calcDate()
        return this
    }

    /**
     * Функция для установки текущей даты 
     * @param {number} day
     * День месяца от 1 до 31 (в зависимости от месяца кол-во дней меняется соответственно)
     * @param {number} month
     * Месяц от 1 до 12
     * @param {number} year
     * Год в формате YYYY
     * @returns {Time} возвращает текущий объект Time с обновленными значениями
     */
    setDate(day=null,month=null,year=null){ 
        let isCalc=false
        if(/^([1-9]|[1-9][0-9]{1,3})$/.test(year)&&typeof year=='number'){
            this.year = year
            isCalc=true;
        }
        if(/^([1-9]|1[0-2])$/.test(month)&&typeof month=='number'){
            this.month = month
            isCalc=true;
        }
        if(Time.#getMonthDayReg(this.month,Time.isLeapYear(this.year)).test(day)&&typeof day=='number'){
            this.day = day
            isCalc=true;
        }
        if(isCalc)
            this.#calcTicks()
        return this
    }

    /**
     * Функция для установки времени в начало дня (00:00:00.000)
     * @returns {Time} возвращает текущий объект Time с обновленными значениями
     */
    startDay(){
        let sum = (this.hours*3600*1000)+(this.minutes*60*1000)+(this.seconds*1000)+this.milliseconds
        this.ticks-=sum
        this.#calcDate()
        return this
    }

    /**
     * Функция для установки времени в конец дня (23:59:59.999)
     * @returns {Time} возвращает текущий объект Time с обновленными значениями
     */
    endDay(){
        let sum = ((23-this.hours)*3600*1000)+((59-this.minutes)*60*1000)+((59-this.seconds)*1000)+(999-this.milliseconds)
        this.ticks+=sum
        this.#calcDate()
        return this
    }

    /**
     * Функция для свободного форматирования строки с использованием текущего объекта Time
     * @param {string} pattern
     * Входная строка с шаблонами, для того чтобы использовать вставку из объекта Time в строке необходимо использовать паттерн - ${спец.символы}
     * 
     * Можно использовать следующие спец. символы:
     * 
     * -
     * Y - год в формате YYYY
     * 
     * -
     * y - год в формате YY
     * 
     * -
     * D - день месяца (с добавочными нулями)
     * 
     * -
     * М - месяц (с добавочными нулями)
     * 
     * -
     * H - часы в 24-часовом формате(с добавочными нулями)
     * 
     * -
     * AP - часы в 12-часовом формате (с добавочными нулями)
     * 
     * -
     * m - минуты (с добавочными нулями)
     * 
     * -
     * S - секунды (с добавочными нулями)
     * 
     * -
     * s - миллисекунды (с добавочными нулями)
     * 
     * -
     * Th - Часы смещения по временной зоне
     * 
     * -
     * Tp - Минуты смещения по временной зоне
     * 
     * -
     * Tz - Часы и минуты смещения по временной зоне
     * 
     *---
     * Пример:
     * 
     * let t = new Time()
     * 
     * console.log(t.format('Время публикации: ${H:m}'))
     * 
     * ---
     * Вывод:
     * 
     * Время публикации 10:45
     * 
     * @returns {string} возвращает отформатированную строку
     */
    format(pattern){
        let res = pattern.match(/(\$\{[^\{\}]+\})/g)
        while(res){
            let item = res.shift()
            item = item.replace(/[\{\}\$]/g,'')
            item = item.replace(/AP/g, this.hours>12?(this.hours-12).toString().padStart(2,'0'):this.hours.toString().padStart(2,'0'))
            item = item.replace(/H/g, this.hours.toString().padStart(2,'0'))
            item = item.replace(/m/g, this.minutes.toString().padStart(2,'0'))
            item = item.replace(/S/g, this.seconds.toString().padStart(2,'0'))
            item = item.replace(/Y/g, this.year)
            item = item.replace(/y/g, this.year.toString().slice(2))
            item = item.replace(/D/g, this.day.toString().padStart(2,'0'))
            item = item.replace(/M/g, this.month.toString().padStart(2,'0'))
            item = item.replace(/s/g, this.milliseconds.toString().padStart(2,'0'))
            item = item.replace(/Th/g, `${this.tz>=0?'+':'-'}`+Math.abs(Math.floor(this.tz)).toString().padStart(2,'0'))
            item = item.replace(/Tp/g, Math.abs((this.tz*60)%60).toString().padStart(2,'0'))
            item = item.replace(/Tz/g, `${this.tz>=0?'+':'-'}`+Math.abs(Math.floor(this.tz)).toString().padStart(2,'0')+':'+Math.abs((this.tz*60)%60).toString().padStart(2,'0'))
            pattern = pattern.replace(/(\$\{[^\{\}]+\})/,item)
            res = pattern.match(/(\$\{[^\{\}]+\})/g)
        }
        return pattern
    }

    valueOf(){
        return this.ticks
    }
}

if(typeof window ==='undefined'){
    module.exports=Time
}
export default Time