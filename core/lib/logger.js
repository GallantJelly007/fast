//@ts-check
const fs=require('fs');
const Time = require('./time');

module.exports = class Logger{
    root;
    name;
    constructor(root,name){
        this.root=root;
        this.name=name;
    }
    errToFile(err,url=''){
        if(!fs.existsSync(this.root+'/log')){
            fs.mkdir(this.root+'/log',755,err=>{
                if(err) console.log(err);
            });
        }
        let time = new Time();
        let t = time.format('${H:m:S}');
        let fileName = `log-${time.format('${D.M.Y}')}.txt`;
        if(!fs.existsSync(this.root+`/log/${fileName}`)){
            fs.writeFileSync(this.root+`/log/${fileName}`,`${this.name.toUpperCase()}:\nОшибка-${t} ${url!=''?`, URL: ${url}`:''}: ${err.name} / ${err.message}--------------------------------------------------------------\n${err.stack}\n--------------------------------------------------------------\n\n`);
        }else{
            fs.appendFileSync(this.root+`/log/${fileName}`,`${this.name.toUpperCase()}:\nОшибка-${t} ${url!=''?`, URL: ${url}`:''}: ${err.name} / ${err.message}--------------------------------------------------------------\n${err.stack}\n--------------------------------------------------------------\n\n`);
        } 
    }
    debug(text,obj,url=''){
        let textObj=''
        try{
            textObj = obj?JSON.stringify(obj):''
        }catch(err){
            textObj = obj?obj.toString():''
        }
        console.log('\x1b[36m%s\x1b[0m', `${this.name.toUpperCase()}:\n`+(url!=''?`URL: ${url}\n`:'')+`-----------------------------------------------------------------\n${text!=''?`${text}: `:''}${textObj}\n`);
    }
    warning(text,obj,url=''){
        let textObj=''
        try{
            textObj = obj?JSON.stringify(obj):''
        }catch(err){
            textObj = obj?obj.toString():''
        }
        console.log('\x1b[33m%s\x1b[0m', `${this.name.toUpperCase()}:\n`+(url!=''?`URL: ${url}\n`:'')+`-----------------------------------------------------------------\n${text!=''?`${text}: `:''}${textObj}\n`);
    }
    error(err,url=''){
        console.log('\x1b[31m%s\x1b[0m', `${this.name.toUpperCase()}:\nError: ${err.name} / ${err.message}${url!=''?`\nURL: ${url}\n`:''}-----------------------------------------------------------------\n${err.stack}\n-----------------------------------------------------------------\n\n`);
    }
}