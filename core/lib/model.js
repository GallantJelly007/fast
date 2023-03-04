export default class Model {
    static table = null;
    static primary = null;
    #position = 1;
    #lastQuery = '';
    #data = [];
    #query = null;
    static #config=null

    static async init(config, options){
        let params = ['DB_USER','DB_HOST','DB_NAME','DB_PASS','DB_PORT']
        try{
            Model.#config=config
            for(let key of params){
                if(!Model.#config[key]||Model.#config[key]==''){
                    throw `param ${key} no find in config file or empty value`
                }
            }
            if(options?.isCreateModels&&options?.modelCreatePath){
                if(!fs.existsSync(options.modelCreatePath)){
                    fs.mkdirSync(options.modelCreatePath)
                }
                let columns = await Model.#getTableInfo()
                let table=null
                let classes=[]
                let script = `const {Model} = require('../core/app')\n`
                for(let col of columns){
                    if(table==null||col.table_name!=table){
                        script+=table!=null?'\n}\n\n':''
                        table = col.table_name
                        let name = table.split('_').map(str=>str[0].toUpperCase() + str.substr(1)).toString().split(',').join('')
                        classes.push(name)
                        let key = await Model.#getTablePrimary(table)
                        if(key){
                            key=key[0].pkey
                            script+=`class ${name} extends Model{\n   static table = '${table}'\n   static primary='${key}'`
                        }
                    }
                    script+=`\n   ${col.column_name} = null`
                }
                script+=`\n}\n\nmodule.exports = {${classes.toString().split(',').join(', ')}}`
                fs.open(`${options.modelCreatePath}/models.js`, 'w', (err) => {
                    if(err) throw err;
                    fs.writeFile(`${options.modelCreatePath}/models.js`,script,err=>{
                        if(err) throw err;
                        console.log('Models init success!');
                    })
                });
            }else{
                console.log('Models init success!');
            }
        }catch(err){
            console.error(err)
        }
    }

    static #getTableInfo(){
        return new Promise((resolve, reject) => {
            let connect = new Connect(Model.#config);
            connect.con().then(connect => {
                connect.query(`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name`, [],result => {
                    connect.client.end();
                    if (!result) resolve(false);
                    else resolve(result.rows);
                })
            }).catch(err => console.error(err));
        })
    }

    static #getTablePrimary(tableName){
        return new Promise((resolve,reject)=>{
            let connect = new Connect(Model.#config);
            connect.con().then(connect => {
                connect.query(
                `SELECT a.attname AS pkey
                 FROM   pg_index i
                 JOIN   pg_attribute a ON a.attrelid = i.indrelid
                                     AND a.attnum = ANY(i.indkey)
                 WHERE  i.indrelid = '${tableName}'::regclass
                 AND    i.indisprimary;`, 
                [],result => {
                    connect.client.end();
                    if (!result) resolve(false);
                    else resolve(result.rows);
                })
            }).catch(err => console.error(err));
            
        })
    }

    static select(params = null, tb = null) {
        if (tb == null) {
            tb = this.table;
        }
        let query = 'SELECT ';
        if (params != null) {
            query += params.toString() + ' FROM ' + tb;
        } else {
            query += '* FROM ' + tb;
        }
        let obj = new this();
        obj.setQuery(query);
        return obj;
    }

    setQuery(query) {
        this.#query = query;
    }

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

    inSelect(params = null, tb = null) {
        if (tb == null) {
            tb = this.constructor.table;
        }
        if (params != null) {
            this.#query += 'SELECT ' + params.toString() + ' FROM ' + tb;
        } else {
            this.#query += 'SELECT * FROM ' + tb;
        }
        return this;
    }

    static count(fieldName = null, distinct = false, tb = null) {
        let d = distinct ? 'DISTINCT ' : '';
        if (tb == null) {
            tb = this.table;
        }
        let query = 'SELECT ';
        if (fieldName != null) {
            query += 'COUNT(' + d + fieldName + ')AS count FROM ' + tb;
        } else {
            query += 'COUNT(*) AS count FROM ' + tb;
        }
        let obj = new this();
        obj.setQuery(query);
        return obj;
    }

    static avg(fieldName = null, tb = null) {
        if (tb == null) {
            tb = this.table;
        }
        let query = 'SELECT ';
        if (fieldName != null) {
            query += `AVG(${fieldName}) AS avg FROM ${tb}`;
        } else {
            query += `AVG(*) AS avg FROM ${tb}`;
        }
        let obj = new this();
        obj.setQuery(query);
        return obj;
    }

    where(f, param = null) {
        if (typeof f == 'function' && param == null) {
            if (this.#lastQuery == 'where') {
                this.#query += ' AND';
            }
            this.#lastQuery = 'innerWhere';
            this.#query += ' (';
            f(this);
            this.#query += ')'
        } else if (typeof f == 'string') {
            f = f.replace(/\?/g, ()=>'$'+(this.#position++));
            if (param != null){
                if(Array.isArray(param)){
                    this.#data=this.#data.concat(param);
                }else{
                    this.#data.push(param)
                }
            } 
            if (this.#lastQuery == 'where') {
                this.#query += ' AND ' + f;
            } else if (this.#lastQuery == 'innerWhere') {
                this.#query += f;
            } else {
                this.#query += ' WHERE ' + f;
            }
            this.#lastQuery = 'where';
        }
        return this;
    }

    like(f, param = null) {
        if (this.#lastQuery == 'where') {
            if (typeof f == 'function' && param == null) {
                this.#lastQuery = 'innerWhere';
                this.#query += ' LIKE ('
                f(this);
                this.#query += ')'
            } else if (typeof f == 'string') {
                if (this.#lastQuery == 'where' || this.#lastQuery == 'innerWhere') {
                    this.#query += ' AND ';
                } else {
                    this.#query+=' WHERE ';
                }
                f = f + ' LIKE ' + "'"+param.toString()+"'";
                this.#query += f;
                this.#lastQuery = 'where';
            }
        }
    }

    in(param, f=null) {
        if (this.#lastQuery == 'where' || this.#lastQuery == 'innerWhere') {
            this.#query += ' AND '+param;
        } else {
            this.#query += ' WHERE '+param;
        }
        if (typeof f == 'function') {
            this.#lastQuery = 'innerWhere';
            this.#query += ' IN ('
            f(this);
            this.#query += ')'
        } else {
            f=f==null?'':f.toString();
            f = ' IN (' + f + ')';
            this.#query += f;
            this.#lastQuery = 'where';
        }
        return this;
    }

    or(f, param = null) {
        if (typeof f == 'function' && param == null) {
            this.#lastQuery = 'innerWhere';
            this.#query += ' OR ('
            f(this);
            this.#query += ')'
        } else if (typeof f == 'string') {
            f = f.replace(/\?/g, ()=>'$'+(this.#position++))
            if (param != null){
                if(Array.isArray(param)){
                    this.#data=this.#data.concat(param);
                }else{
                    this.#data.push(param)
                }
            } 
            if (this.#lastQuery == 'innerWhere') {
                this.#query += f;
            } else {
                this.#query += ' OR ' + f;
            }
            this.#lastQuery = 'where';
        }
        return this;
    }

    join(tb, fieldCondition, fieldCondition2) {
        this.#lastQuery = ''
        let current=this.constructor.table;
        this.#query += ` JOIN ${tb} ON ${current}.${fieldCondition}=${fieldCondition2}`;
        return this;
    }

    orderBy(fieldName, direction = 'asc') {
        if (fieldName == null || fieldName == '') {
            return false;
        }
        this.#query += ' ORDER BY ';
        if (!Array.isArray(fieldName)) {
            fieldName = Model.asArray(fieldName);
        }
        if (!Array.isArray(direction)) {
            direction=Model.asArray(direction);
        }
        while (fieldName.length > 0) {
            let item = fieldName.shift()
            let br = ', ';
            if (fieldName.length == 0) {
                br = '';
            }
            this.#query += item + ' ' + direction.shift().toUpperCase() + br;
        }
        return this;
    }

    groupBy(fieldName) {
        this.#query += ' GROUP BY ' + fieldName;
        return this;
    }

    limit(count) {
        this.#query += ' LIMIT ' + count;
        return this;
    }

    offset(count) {
        this.#query += ' OFFSET ' + count;
        return this;
    }

    save() {
        return new Promise((resolve, reject) => {
            let names = [], values = [], data = [];
            this.#position = 1;
            let obj = new this.constructor();
            for (let name in obj) {
                if (this[name] != null) {
                    if (this[name].toString().toLowerCase() === 'current_timestamp') {
                        this[name]=new Date();
                    }
                    let bname = name.replace(/([A-Z])/g, '_$1').toLowerCase();
                    names.push(bname);
                    values.push(`$${this.#position}`);
                    this.#position++;
                    data.push(this[name]);
                }
            }
            let strQuery = `INSERT INTO ${this.constructor.table} (${names.toString()}) VALUES (${values.toString()}) RETURNING ${this.constructor.primary}`;
            let connect = new Connect(Model.#config);
            connect.con().then(connect => {
                connect.query(strQuery, data, result => {
                    this.#position = 1;
                    connect.client.end();
                    if (!result){
                        resolve({success:false});
                    } else {
                        this[this.constructor.primary]=result.rows[0][this.constructor.primary]
                        resolve({success:true, insertId:result.rows[0][this.constructor.primary]})
                    }
                })
            }).catch(err=>console.error(err));
        })
    }

    update(isNull = false) {
        return new Promise((resolve, reject) => {
            this.#position = 1;
            let names = [], values = [], conditions = '';
            let obj = new this.constructor();
            for (let item in obj) {
                let bname = item.replace(/([A-Z])/g, '_$1').toLowerCase();
                if (this.constructor.primary != null && this.constructor.primary == bname) {
                    conditions = ` WHERE ${bname}=$${this.#position}`;
                    values.push(this[item]);
                    this.#position++;
                }
                if(typeof this[item] === 'undefined'){
                    this[item]=null
                }
                if (!isNull && this[item] === null) {
                    continue;
                } else {
                    if (bname != this.constructor.primary && this[item] === null) {
                        names.push(`${bname}=NULL`);
                    } else if(bname != this.constructor.primary){
                        if (this[item]!=null&&this[item].toString().toLowerCase() === 'current_timestamp') {
                            this[item]=new Date();
                        }
                        names.push(`${bname}=$${this.#position}`);
                        values.push(this[item]);
                        this.#position++;
                    }
                }
            }
            let connect = new Connect(Model.#config);
            this.#query=`UPDATE ${this.constructor.table} SET ${names.toString() + conditions}`
            try{
                connect.con().then(connect => {
                    connect.query(this.#query, values, result => {
                        this.#position=1;
                        connect.client.end();
                        if (!result) resolve({success:false});
                        else resolve({success:true});
                    })
                }).catch(err=>console.error(err));
            }catch{
                console.error(this.#query);
                resolve({success:false});
            }
        });
    }
    /**
     * 
     * @param {boolean} wordSensetive 
     * @returns Возвращает промис, если что то пойдет не так при подключении вернет false. 
     * @desc
     * Возвращает объект вида {success:false|true} и в зависимости от запроса дополнительное поле при успешном выполнении
     * 
     * Доп.поля:
     * 
     * SELECT - data
     * 
     * COUNT - count
     * 
     * MAX - max
     * 
     * MIN - min
     * 
     * SUM - sum
     * 
     */
    send(wordSensetive = true) {
        return new Promise((resolve, reject) => {
            let connect = new Connect(Model.#config);
            try{
                connect.con().then(connect => {
                    connect.query(this.#query, this.#data, result => {
                        if (!result) {
                            connect.client.end();
                            resolve({success:false});
                        }
                        if (wordSensetive) {
                            if (/^[^(]+COUNT[^)]+/.test(this.#query)) {
                                connect.client.end();
                                if(result.rows.length) resolve({success:true,count:Number(result.rows[0].count)});
                                else resolve({success:true, count:0});
                            }
                            if (/^[^(]+MAX[^)]+/.test(this.#query)) {
                                connect.client.end();
                                if(result.rows.length) resolve({success:true, max:Number(result.rows[0].max)});
                                else resolve({success:true, max:0});
                            }
                            if (/^[^(]+MIN[^)]+/.test(this.#query)) {
                                connect.client.end();
                                if(result.rows.length) resolve({success:true,min:Number(result.rows[0].min)});
                                else resolve({success:true, min:0});
                            }
                            if (/^[^(]+SUM[^)]+/.test(this.#query)) {
                                connect.client.end();
                                if(result.rows.length) resolve({success:true,sum:Number(result.rows[0].sum)});
                                else resolve({success:true, sum:0});
                            }
                        }
                        if (/^DELETE/.test(this.#query)) {
                            connect.client.end();
                            if(result.hasOwnProperty('rowCount')){
                                resolve({success:true});
                            }
                            resolve({success:false});
                        }
                        if (/^SELECT/.test(this.#query)) {
                            let objs;
                            if(/JOIN/.test(this.#query)||/AS/.test(this.#query)) objs = this.constructor.parse(result.rows,true);
                            else objs = this.constructor.parse(result.rows);
                            connect.client.end();
                            resolve({success:true,data:objs});
                        }
                    })
                }).catch((err)=>console.error(err));
            }catch(err){
                console.error(err);
                resolve({success:false});
            }
        })
    }

    async first(wordSensetive = true){
        let res = await this.send(wordSensetive)
        if(res.success&&res.data){
            let data = Array.isArray(res.data)?res.data[0]:res.data!=null?res.data:null
            res.data=data
            return res
        }else{
            return res
        }
    }

    async many(wordSensetive = true){
        let res = await this.send(wordSensetive)
        if(res.success&&res.data){
            let data = Array.isArray(res.data)?res.data:res.data!=null?[res.data]:null
            res.data=data
            return res
        }else{
            return res
        }
    }

    static delete(param) {
        let query = 'DELETE FROM ' + this.table;
        let obj = new this();
        obj.setQuery(query);
        return obj;
    }

    delete(){
        return new Promise((resolve, reject) => {
            let connect = new Connect(Model.#config);
            this.#query=`DELETE FROM ${this.constructor.table} WHERE ${this.constructor.primary} = ${this[this.constructor.primary]}`
            try{
                connect.con().then(connect => {
                    connect.query(this.#query,null, result => {
                        this.#position=1;
                        connect.client.end();
                        for(let key in this){
                            this[key]=null
                        }
                        if (!result) resolve({success:false});
                        else resolve({success:true});
                    })
                }).catch(err=>console.error(err));
            }catch{
                console.error(this.#query);
                resolve({success:false});
            }
        });
    }

    static parse(objs,join=false,nameStyle='none') {
        let objects = [];
        if(objs==null||objs.length==0) return null;
        for (let item of objs) {
            let obj;
            obj = new this();
            for (let key in item) {
                let newName=''
                switch(nameStyle){
                    case 'camel-case':{
                        newName = key.split('_').map((elem, index) => {
                            let str = elem;
                            if (index != 0) str = str.replace(/^[\w]/, (m) => m.toUpperCase());
                            return str;
                        }).join('');
                        break;
                    }
                    case 'pascal-case':
                    case 'kebab-case':
                    case 'none':
                    default:{
                        newName=key;
                        break;
                    }
                }
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

    static asArray(obj) {
        if(!Array.isArray(obj)) return [obj];
        return obj; 
    }

}

class Connect {
    client = null;
    config = null;
    constructor(config) {
        this.config=config
        this.client = new Client({
            user: this.config.DB_USER,
            host: this.config.DB_HOST,
            database: this.config.DB_NAME,
            password: this.config.DB_PASS,
            port: this.config.DB_PORT
        });
    }

    con(){
        return new Promise((resolve, reject) => {
            this.client.connect(err => {
                if (err) {
                    console.error('Ошибка подключения к базе данных', err);
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
                console.error(`Не удалось выполнить запрос к базе\n\n${queryStr}\n\n${params}`, err);
                action(false);
            } else if (action != null) {
                action(result);
            }
        });
    }
}
