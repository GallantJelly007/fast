export default class NamingCase{

    /**
     * Структура-перечисление всех поддерживаемых типов именования
     */
    static cases = {
        CAMEL_CASE: 'CAMEL_CASE',
        PASCAL_CASE:'PASCAL_CASE',
        SNAKE_CASE:'SNAKE_CASE',
        KEBAB_CASE:'KEBAB_CASE',
        MACRO_CASE:'MACRO_CASE',
        TRAIN_CASE:'TRAIN_CASE'
    }
    
    static #regular=new Map([
        ['CAMEL_CASE',/^[_]?[a-z]+((\d)|([A-Z0-9]+[a-z0-9]+))*([A-Z])*$/], //camelCase
        ['PASCAL_CASE',/^[_]?[A-Z]+((\d)*|[A-Z0-9]|[a-z0-9])*([A-Z])*$/], //PascalCase
        ['MACRO_CASE',/^([A-Z]+[A-Z0-9]*_[A-Z]+[A-Z0-9]*)+$/], //macro_case
        ['TRAIN_CASE',/^([A-Z]+[A-Z0-9]*-[A-Z]+[A-Z0-9]*)+$/], //train-case
        ['SNAKE_CASE',/^([A-Za-z]+[A-Za-z0-9]*_[A-Za-z]+[A-Za-z0-9]*)+$/], //snake_case
        ['KEBAB_CASE',/^([A-Za-z]+[A-Za-z0-9]*-[A-Za-z]+[A-Za-z0-9]*)+$/], //kebab-case
    ])

    /**
     * Функция для получения типа именования 
     * @param {string} name
     * Наименование параметра, переменной, функции и т.д. 
     * @returns 
     */
    static getNamingType(name=''){
        if(typeof name == 'string' && name != ''){
            for(let key of NamingCase.#regular.keys()){
                if(NamingCase.#regular.get(key).test(name)){
                    return key
                }
            }
            return 'NONE'
        } 
        return 'NONE'
    }

    /**
     * Конвертация имени из одного способа именования в другой
     * @param {string} name
     * Наименование параметра, переменной, функции и т.д. 
     * @param {string} toType 
     * @returns {string}
     * Возвращает имя преобразованное в новый тип
     */
    static toNaming(name='',toType=''){
        if(typeof name == 'string' && name != '' && typeof toType=='string' && toType!=''){
            let type = NamingCase.getNamingType(name)
            if(NamingCase.#regular.has(toType)){
                let newName,matches
                switch(type){
                    case 'CAMEL_CASE':
                        newName = name.replace(/[A-Z]/g,' $&').split(' ').map(elem=>elem.toLowerCase())
                        break
                    case 'PASCAL_CASE':
                        newName = name.replace(/[A-Z]/g,' $&').split(' ').map(elem=>elem.toLowerCase())
                        newName.shift()
                        break
                    case 'KEBAB_CASE':
                    case 'TRAIN_CASE':
                        newName = name.split('-').map(elem=>elem.toLowerCase())
                        break
                    case 'SNAKE_CASE':
                    case 'MACRO_CASE':
                        newName = name.split('_').map(elem=>elem.toLowerCase())
                        break
                    case 'NONE':
                        newName = name.replace(/\s*/g,'').replace(/[^A-Za-z0-9]+/g,' ').replace(/[A-Za-z]+[A-Za-z0-9]*/g,' $&').split(' ').map(elem=>elem.toLowerCase()).filter(elem=>elem!='')
                        break
                }
                switch(toType){
                    case 'CAMEL_CASE':
                        name = newName.map((elem, index) => {
                            let str = elem;
                            if (index != 0) str = str.replace(/^[\w]/, (m) => m.toUpperCase());
                            return str;
                        }).join('');
                        break
                    case 'PASCAL_CASE':
                        name = newName.map((elem) => {
                            let str = elem;
                            str = str.replace(/^[\w]/, (m) => m.toUpperCase());
                            return str;
                        }).join('')
                        break
                    case 'KEBAB_CASE':
                    case 'TRAIN_CASE':
                    case 'SNAKE_CASE':
                    case 'MACRO_CASE':
                        let joiner = toType=='MACRO_CASE'||toType=='SNAKE_CASE'?'_':'-'
                        let toUpper = toType=='MACRO_CASE'||toType=='TRAIN_CASE'
                        if(newName.length && newName[0]=='_')
                            newName.shift()
                        name = toUpper ? newName.join(joiner).toUpperCase() : newName.join(joiner)
                        break
                }
            }
        }
        return name
    }
}


