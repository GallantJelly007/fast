export default class NamingCase{

    static cases = {
        CAMEL_CASE: 'CAMEL_CASE',
        PASCAL_CASE:'PASCAL_CASE',
        SNAKE_CASE:'SNAKE_CASE',
        KEBAB_CASE:'KEBAB_CASE'
    }
    
    static #regular=new Map([
        ['CAMEL_CASE',/^[_]?[a-z]+((\d)|([A-Z0-9]+[a-z0-9]+))*([A-Z])*$/], //camelCase
        ['PASCAL_CASE',/^[_]?[A-Z]+((\d)*|[A-Z0-9]|[a-z0-9])*([A-Z])*$/], //PascalCase
        ['SNAKE_CASE',/^([A-Za-z0-9]+_[A-Za-z0-9]+)+$/], //snake_case
        ['KEBAB_CASE',/^([A-Za-z0-9]+-[A-Za-z0-9]+)+$/] //kebab-case
    ])

    static getNamingType(name=''){
        if(typeof name =='string' && name!=''){
            for(let key of NamingCase.#regular.keys()){
                if(NamingCase.#regular.get(key).test(name)){
                    return key
                }
            }
            return 'NONE'
        } 
        return 'NONE'
    }

    static toNaming(name='',toType=''){
        if(typeof name == 'string' && name != '' && typeof toType=='string' && toType!=''){
            let type = NamingCase.getNamingType(name)
            if(type!='NONE'&&NamingCase.#regular.has(toType)){
                let newName,matches
                switch(type){
                    case 'CAMEL_CASE':
                        newName = name.split(/([a-z]+[A-Z]+)/).filter(elem=>elem!='').map(elem=>elem.toLowerCase())
                        break
                    case 'PASCAL_CASE':
                        newName = name.split(/([A-Z]+[a-z]+)/).filter(elem=>elem!='').map(elem=>elem.toLowerCase())
                        break
                    case 'KEBAB_CASE':
                        newName = name.split('-').map(elem=>elem.toLowerCase())
                        break
                    case 'SNAKE_CASE':
                        newName = name.split('_').map(elem=>elem.toLowerCase())
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
                        if(newName.length && newName[0]=='_')
                            newName.shift()
                        name = newName.join('-')
                        break
                    case 'SNAKE_CASE':
                        if(newName.length && newName[0]=='_')
                            newName.shift()
                        name = newName.join('-')
                        break
                }
            }
        }
        return name
    }
}


