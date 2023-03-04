class Logger {
    root = null;
    constructor(root) {
        this.root = root;
    }
    logToFile(err,url=null){
        if(!fs.existsSync(this.root+'/log')){
            fs.mkdir(this.root+'/log',755,err=>{
                if(err) console.log(err);
            });
        }
        let time = new Date();
        let t = time.getHours().toString().padStart(2,'0')+":"+time.getMinutes().toString().padStart(2,'0')+":"+time.getSeconds().toString().padStart(2,'0');
        let fileName = `log-${time.getDate().toString().padStart(2,'0')}-${(time.getMonth()+1).toString().padStart(2,'0')}-${time.getFullYear()}.txt`;
        if(!fs.existsSync(this.root+`/log/${fileName}`)){
            fs.writeFileSync(this.root+`/log/${fileName}`,`Ошибка-${t} ${url!=null?`, URL: ${url}`:''}: ${err.name} / ${err.message}\n--------------------------------------------------------------\n${err.stack}\n--------------------------------------------------------------\n\n`);
        }else{
            fs.appendFileSync(this.root+`/log/${fileName}`,`Ошибка-${t} ${url!=null?`, URL: ${url}`:''}: ${err.name} / ${err.message}\n--------------------------------------------------------------\n${err.stack}\n--------------------------------------------------------------\n\n`);
        } 
    }
    debug(obj,url=null){
        console.log('\x1b[36m%s\x1b[0m', (url!=null?url:'')+`:\n-----------------------------------------------------------------\n${obj}\n\n`);
    }
    warning(obj,url=null){
        console.log('\x1b[33m%s\x1b[0m', (url!=null?url:'')+`:\n-----------------------------------------------------------------\n${obj}\n\n`);
    }
    error(err,url=null){
        console.log('\x1b[31m%s\x1b[0m', `Error: ${err.name} / ${err.message}${url!=null?`\nURL: ${url}\n`:''}\n-----------------------------------------------------------------\n${err.stack}\n-----------------------------------------------------------------\n\n`);
    }
}