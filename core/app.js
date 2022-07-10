//@ts-check

/**
 * @typedef {Object} Result
 * @property {number} success 
 * @property {string} message 
 */

/**
 * @typedef {Object} TokenBody
 * @property {object} header 
 * @property {object} body 
 * @property {string} sign 
 */

 const fs = require('fs');
 const crypto = require('crypto');
 const url = require('url');
 const { Client } = require('pg');
 const Nun = require('nunjucks');
 const EventEmitter = require('events');
 const nodemailer = require('nodemailer');
 const path = require('path');
 
 
 const regular = new Map([
     ["login",/^[a-zA-Z][a-zA-Z0-9-_\.]{3,20}$/],
     ["name",/[A-zА-яЁ-ё]{2,30}$/u],
     ["email",/^[\w.]+@([A-z0-9][-A-z0-9]+\.)+[A-z]{2,4}$/],
     ["pass",/^[^А-Яа-яЁё]{8,20}$/],
     ["telephone",/^(\+)([- _():=+]?\d[- _():=+]?){11,14}(\s*)?$/]
 ]);
 
 
 const oses = new Map([
         ['Windows 3.11' , /(Win16)/],
         ['Windows 95' , /(Windows 95)|(Win95)|(Windows_95)/],
         ['Windows 98' , /(Windows 98)|(Win98)/],
         ['Windows 2000' , /(Windows NT 5.0)|(Windows 2000)/],
         ['Windows 2000 Service Pack 1' , /(Windows NT 5.01)/],
         ['Windows XP' , /(Windows NT 5.1)|(Windows XP)/],
         ['Windows Server 2003' , /(Windows NT 5.2)/],
         ['Windows Vista' , /(Windows NT 6.0)|(Windows Vista)/],
         ['Windows 7' , /(Windows NT 6.1)|(Windows 7)/],
         ['Windows 8' , /(Windows NT 6.2)|(Windows 8)/],
         ['Windows 8.1' , /(Windows NT 6.3)|(Windows 8.1)/],
         ['Windows 10' , /(Windows NT 10.0)|(Windows 10)/],
         ['Windows 11' , /(Windows NT 11.0)|(Windows 11)/],
         ['Windows NT 4.0' , /(Windows NT 4.0)|(WinNT4.0)|(WinNT)|(Windows NT)/],
         ['Windows ME' , /(Windows ME)|(Windows 98; Win 9x 4.90 )/],
         ['Windows CE' , /(Windows CE)/],
         ['Mac OS X Kodiak (beta)' , /(Mac OS X beta)/],
         ['Mac OS X Cheetah' , /(Mac OS X 10.0)/],
         ['Mac OS X Puma' , /(Mac OS X 10.1)/],
         ['Mac OS X Jaguar' , /(Mac OS X 10.2)/],
         ['Mac OS X Panther' , /(Mac OS X 10.3)/],
         ['Mac OS X Tiger' , /(Mac OS X 10.4)/],
         ['Mac OS X Leopard' , /(Mac OS X 10.5)/],
         ['Mac OS X Snow Leopard' , /(Mac OS X 10.6)/],
         ['Mac OS X Lion' , /(Mac OS X 10.7)/],
         ['Mac OS X' , /(Mac OS X)/],
         ['Mac OS' , /(Mac_PowerPC)|(PowerPC)|(Macintosh)/],
         ['Open BSD' , /(OpenBSD)/],
         ['SunOS' , /(SunOS)/],
         ['Solaris 11' , /(Solaris\/11)|(Solaris11)/],
         ['Solaris 10' , /((Solaris\/10)|(Solaris10))/],
         ['Solaris 9' , /((Solaris\/9)|(Solaris9))/],
         ['CentOS' , /(CentOS)/],
         ['QNX' , /(QNX)/],
         ['UNIX' , /(UNIX)/],
         ['Ubuntu 21.04' , /(Ubuntu\/21.04)|(Ubuntu 21.04)/],
         ['Ubuntu 20.04' , /(Ubuntu\/20.04)|(Ubuntu 20.04)/],
         ['Ubuntu 19.04' , /(Ubuntu\/19.04)|(Ubuntu 19.04)/],
         ['Ubuntu 18.04' , /(Ubuntu\/18.04)|(Ubuntu 18.04)/],
         ['Ubuntu 17.04' , /(Ubuntu\/17.04)|(Ubuntu 17.04)/],
         ['Ubuntu 16.04' , /(Ubuntu\/16.04)|(Ubuntu 16.04)/],
         ['Ubuntu 15.04' , /(Ubuntu\/15.04)|(Ubuntu 15.04)/],
         ['Ubuntu 14.04' , /(Ubuntu\/14.04)|(Ubuntu 14.04)/],
         ['Ubuntu 13.10' , /(Ubuntu\/13.10)|(Ubuntu 13.10)/],
         ['Ubuntu 13.04' , /(Ubuntu\/13.04)|(Ubuntu 12.04)/],
         ['Ubuntu 12.10' , /(Ubuntu\/12.10)|(Ubuntu 12.10)/],
         ['Ubuntu 12.04 LTS' , /(Ubuntu\/12.04)|(Ubuntu 12.04)/],
         ['Ubuntu 11.10' , /(Ubuntu\/11.10)|(Ubuntu 11.10)/],
         ['Ubuntu 11.04' , /(Ubuntu\/11.04)|(Ubuntu 11.04)/],
         ['Ubuntu 10.10' , /(Ubuntu\/10.10)|(Ubuntu 10.10)/],
         ['Ubuntu 10.04 LTS' , /(Ubuntu\/10.04)|(Ubuntu 10.04)/],
         ['Ubuntu 9.10' , /(Ubuntu\/9.10)|(Ubuntu 9.10)/],
         ['Ubuntu 9.04' , /(Ubuntu\/9.04)|(Ubuntu 9.04)/],
         ['Ubuntu 8.10' , /(Ubuntu\/8.10)|(Ubuntu 8.10)/],
         ['Ubuntu 8.04 LTS' , /(Ubuntu\/8.04)|(Ubuntu 8.04)/],
         ['Ubuntu 6.06 LTS' , /(Ubuntu\/6.06)|(Ubuntu 6.06)/],
         ['Red Hat Linux' , /(Red Hat)/],
         ['Red Hat Enterprise Linux' , /(Red Hat Enterprise)/],
         ['Fedora 17' , /(Fedora\/17)|(Fedora 17)/],
         ['Fedora 16' , /(Fedora\/16)|(Fedora 16)/],
         ['Fedora 15' , /(Fedora\/15)|(Fedora 15)/],
         ['Fedora 14' , /(Fedora\/14)|(Fedora 14)/],
         ['Chromium OS' , /(ChromiumOS)/],
         ['Google Chrome OS' , /(ChromeOS)/],
         ['OpenBSD' , /(OpenBSD)/],
         ['FreeBSD' , /(FreeBSD)/],
         ['NetBSD' , /(NetBSD)/],
         ['Android 12.0' , /(Android\/12)|(Android 12)/],
         ['Android 11.0' , /(Android\/11)|(Android 11)/],
         ['Android 10.0' , /(Android\/10)|(Android 10)/],
         ['Android 9.0 Pie' , /(Android\/9)|(Android 9)/],
         ['Android 8.1 Oreo' , /(Android\/8.1)|(Android 8.1)/],
         ['Android 8.0 Oreo' , /(Android\/8)|(Android 8)/],
         ['Android 7.1 Nougat' , /(Android\/7.1)|(Android 7.1)/],
         ['Android 7.0 Nougat' , /(Android\/7)|(Android 7)/],
         ['Android 6.0 Marshmallow' , /(Android\/6)|(Android 6)/],
         ['Android 5.1 Lollipop' , /(Android\/5.1)|(Android 5.1)/],
         ['Android 5.0 Lollipop' , /(Android\/5)|(Android 5)/],
         ['Android 4.4 KitKat' , /(Android\/4.4)|(Android 4.4)/],
         ['Android 4.3 Jelly Bean' , /(Android\/4.3)|(Android 4.3)/],
         ['Android 4.2 Jelly Bean' , /(Android\/4.2)|(Android 4.2)/],
         ['Android 4.1 Jelly Bean' , /(Android\/4.1)|(Android 4.1)/],
         ['Android 4.0 Ice Cream Sandwich' , /(Android\/4.0)|(Android 4.0)/],
         ['Linux' , /(Linux)|(X11)/],
         ['iPod' , /(iPod)/],
         ['iPhone' , /(iPhone)/],
         ['iPad' , /(iPad)/],
         ['OS/8' , /(OS\/8)|(OS8)/],
         ['Older DEC OS' , /(DEC)|(RSTS)|(RSTS\/E)/ ],
         ['WPS-8' , /(WPS-8)|(WPS8)/ ],
         ['BeOS' , /(BeOS)|(BeOS r5)/],
         ['BeIA' , /(BeIA)/],
         ['OS/2 2.0' , /(OS\/220)|(OS\/2 2.0)/],
         ['OS/2' , /(OS\/2)|(OS2)/],
         ['Search engine or robot' , /(nuhk)|(Googlebot)|(Yammybot)|(Openbot)|(Slurp)|(msnbot)|(Ask Jeeves\/Teoma)|(ia_archiver)/]
 ]);
 
 
 class App{
     #config = null;
     #routes = null;
     constructor(root,config,routes){
         this.#config=config;
         this.#config.ROOT=root;
         this.#routes=routes;
         const server = require(this.#config.REQUIRE_SRV);
         LocalStorage.setRoot(root);
         LocalStorage.restore();
         process.on('SIGINT',()=>{
             console.log('Закрытие приложения');
             Session.clean(__dirname);
             LocalStorage.clean();
             process.exit(1);
         });
         process.on('SIGQUIT',()=>{
             console.log('Закрытие приложения');
             process.exit(3);
         });
         process.on('SIGTERM',()=>{
             console.log('Закрытие приложения');
             process.exit(15);
         });
     
         server.createServer((request, response) => {
             let router = new Router(this.#config,this.#routes);
             router.start(request,response);
         }).listen(this.#config.PORT);  
         server.timeout=120;
     }
 }
 class Logger{
     root=null;
     constructor(root){
         this.root=root;
     }
     logToFile(e,url){
         if(!fs.existsSync(this.root+'/log')){
             fs.mkdir(this.root+'/log',755,err=>{
                 if(err) console.log(err);
             });
         }
         let time = new Date();
         let t = time.getHours().toString().padStart(2,'0')+":"+time.getMinutes().toString().padStart(2,'0')+":"+time.getSeconds().toString().padStart(2,'0');
         let fileName = `log-${time.getDate().toString().padStart(2,'0')}-${(time.getMonth()+1).toString().padStart(2,'0')}-${time.getFullYear()}.txt`;
         if(!fs.existsSync(this.root+`/log/${fileName}`)){
             fs.writeFileSync(this.root+`/log/${fileName}`,`Ошибка-${t}, URL: ${url}:` + e.name + "/" + e.message + "\n--------------------------------------------------------------\n" + e.stack+'\n--------------------------------------------------------------\n\n');
         }else{
             fs.appendFileSync(this.root+`/log/${fileName}`,`Ошибка-${t}:` + e.name + "/" + e.message + "\n--------------------------------------------------------------\n" + e.stack+'\n--------------------------------------------------------------\n\n');
         } 
     }
 }
 
 class AppSocket{
     clients=[];
     config=null;
     routes=null;
     constructor(port,root,routes){
         const WebSocket = require('ws');
         const ws = new WebSocket.WebSocketServer({ port: port });
         this.routes=routes;
         this.config=require('./settings/config');
         this.config.ROOT=root;
         ws.on('connection', client => {
             let newClient = new SocketClient(this.config,client,this.routes);
             newClient.send({success:1,message:"success"});
             this.clients.push(newClient);
             newClient.emitter.on('close',()=>{
                 for(let i=0;i<this.clients.length;i++){
                     if(this.clients[i]==newClient){
                         this.clients.splice(i);
                         break;
                     }
                 }
             })
 
             newClient.emitter.on('broadcast',(data)=>{
                 for(let i=0;i<this.clients.length;i++){
                     if(this.clients[i]==newClient){
                         continue;
                     }
                     if(data.hasOwnProperty('type')){
                         if(this.clients[i].type==data.type&&data.type!=null){
                             this.clients[i].send(data.data);
                         }
                     }else{
                         this.clients[i].send(data.data);
                     }
                 }
             })
         });
     }
     setOnExit(func){
         process.on('exit',()=>{func(this.clients)});
     }
 }
 
 class Router{
     #config=null;
     emmiter=null;
     #routes={};
     constructor(config,routes){
         this.#config = config;
         this.#routes = routes;
         this.emmiter = new EventEmitter();
     }
     
     async start(request,response) {
         let isCheck = false, isStatic = false;
         let path = request.url.toString();
         path = path.startsWith('/') ? path.substring(1, path.length) : path;
         path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
         path = decodeURI(path);
         for (let item of this.#config.ALLOWED_FORMATS.keys()) {
             if (path.startsWith(this.#config.STATIC) && path.endsWith(item)) {
                 fs.readFile(this.#config.ROOT + "/" + path, (err, data) => {
                     if (!err) {
                         response.setHeader('Content-Type', this.#config.ALLOWED_FORMATS.get(item));
                         response.end(data);
                     } else {
                         response.statusCode = 404;
                         response.end();
                     }
                 });
                 isStatic = true;
                 break;
             }
         }
         if (!isStatic) {
             let ref = request.headers['x-forwarded-host'];
             let routes=null;
             for(let key in this.#routes){
                 let reg = new RegExp(`^${key}$`)
                 if(reg.test(ref)){
                     routes=this.#routes[key];
                     break;
                 }
             }
             if(routes==null){
                 response.statusCode = 404;
                 response.end();
                 return;
             }
             let checkEvent=false;
             this.emmiter.on('checkRes',()=>{
                 if (!isCheck) {
                     response.statusCode = 404;
                     response.end();
                 }
             })
             for (let item of routes.keys()) {
                 let reg = new RegExp(item);
                 if (reg.test(path)) {
                     
                     let route,app;
                     if (item != path) {
                         route = path.replace(item, routes.get(item)).split(':');
                     } else {
                         route = routes.get(item).split(':');
                     }
                     if(route.length!=2){
                         console.error('Неверный шаблон адреса');
                         response.statusCode = 404;
                         response.end();
                         break;
                     }
                     let methods = route[0].split('/');
                     route=route[1].split('/');
                     if (!fs.existsSync(this.#config.ROOT + '/controllers/' + route[0] + 'Controller.js')) {
                         console.error('Не найден контроллер для запроса');
                         response.statusCode = 404;
                         response.end();
                         break;
                     }
                     let classController = require(this.#config.ROOT+'/controllers/' + route.shift() + 'Controller');
                     response.setHeader('Content-Type', 'text/html; charset=utf-8');
                    
                     switch(classController.type){
                         case 'base': app = new HttpClient(this.#config,request,response);
                                     break;
                         case 'rest': app = new HttpClient(this.#config,request,response,false);
                                     break;
                     }
                     await app.getInput(methods);
                     let controller = new classController(app);
                     let method = 'action' + route[0][0].toUpperCase() + route[0].slice(1);
                     route.shift();
                     try{
                         let r = this;
                         if (route.length == 0) route=null;
                         controller.on('ready',async (result)=>{
                             if(!result) isCheck=false;
                             else await controller[method](app,route)
                             .then(result=>{
                                 isCheck=result;
                                 r.emmiter.emit('checkRes');
                             })
                             .catch(err=>{
                                 console.log(err);
                                 app.logger.logToFile(err,request.url.toString());
                                 response.statusCode=503;
                                 response.end();
                             });  
                         });
                         checkEvent=true;
                         await controller.start();
                     }catch(err){
                         console.error(err);
                     }
                     break;
                 } else {
                     isCheck = false;
                 }
             }
             if(!checkEvent){
                 response.statusCode = 404;
                 response.end();
             }
            
         }
     }
 }
 
 class RouterSocket{
 
     #routes=null;
     constructor(routes){
         this.#routes=routes;
     }
     
     /**@param {SocketClient} client */
     async start(client){
         let emmiter = new EventEmitter();
         let isCheck = false;
         if(client.input.hasOwnProperty('query')){
             if(client.input.hasOwnProperty('type')&&client.type==null){
                 if(client.input.type!=null&&client.input.type!='') client.type = client.input.type;
             }
             let path = client.input.query;
             for (let item of this.#routes.keys()) {
                 let reg = new RegExp(item);
                 if (reg.test(path)) {
                     let route;
                     if (item != path) {
                         route = path.replace(item, this.#routes.get(item)).split('/');
                     } else {
                         route = this.#routes.get(item).split('/');
                     }
                     if (!fs.existsSync(client.config.ROOT + '/controllers/' + route[0] + 'Controller.js')) {
                         client.send({success:0,message:"Неверные данные запроса"});
                         return;
                     }
                     let classController = require(client.config.ROOT+'/controllers/' + route.shift() + 'Controller');
                     
                     let controller = new classController(client);
                    
                     let method = 'action' + route[0][0].toUpperCase() + route[0].slice(1);
                     route.shift();
                     if (route.length > 0) controller.on('ready',async ()=>{isCheck = await controller[method](client,route); emmiter.emit('checkRes')});
                     else controller.on('ready',async ()=>{isCheck = await controller[method](client); emmiter.emit('checkRes')});
                     controller.start();
                     break;
                 } else {
                     isCheck = false;
                 }
             }
             emmiter.on('checkRes',()=>{
                 if (!isCheck) {
                     client.send({success:0,message:"Неверные данные запроса"});
                 }
             })
         }else{
             client.send({success:0,message:"Неверные данные запроса"});
         }
     }
 }
 
 class Middle{
 
     logger = null;
     config = null;
 
     constructor(config){
         this.config=config;
         this.logger=new Logger(this.config.ROOT);
     }
 
     /**
      * 
      * @param {Number} port 
      * @returns {boolean} Возвращает true в случае успешного выполнения, иначе false
      * @desc Записывает порт, который уже используется, в файл на сервере и сохраняет
      */
     addClosePort(port=null){
         if(fs.existsSync(this.config.ROOT+'/core/settings/close-ports.json')){
             let ports = JSON.parse(fs.readFileSync(this.config.ROOT+'/core/settings/close-ports.json','utf-8'));
             let check=false;
             for(let item of ports.ports){
                 if(Number(item)==port){
                     check=true;
                     break;
                 }
             }
             port=port==null?this.config.PORT:port;
             if(!check){
                 ports.ports.push(this.config.PORT)
                 JSON.stringify(ports);
                 fs.writeFileSync(this.config.ROOT+'/core/settings/close-ports.json',JSON.stringify(ports));
             }
             return true;
         }
         return false;
     }
 
 
     /**
      * @async
      * @param {String} to 
      * Адрес куда отправить письмо
      * @param {String} subject 
      * От кого письмо
      * @param {String} text 
      * Текст письма
      * @returns {boolean} Возвращает true в случае успешной отправки либо false
      * @desc Отправляет письмо по указанному адресу через nodemailer
      */
     async mail(to,subject,text){
         let transporter = nodemailer.createTransport({
             host: this.config.MAIL_HOST,
             port: this.config.MAIL_PORT,
             secure: this.config.MAIL_SECURE, 
             auth: {
               user: this.config.MAIL_USER, 
               pass: this.config.MAIL_PASS, 
             },
         });
         try{
             let info = await transporter.sendMail({
                 from: `"${this.config.SITE_NAME}" <${this.config.MAIL_USER}>`, // sender address
                 to: to.toString(), // list of receivers
                 subject: subject, // Subject line
                 html: text, // html body
             });
             if (info.hasOwnProperty('accepted')){
                 if(info.accepted.length > 0)return true;
                 else return false;
             }else return false;
         }catch(err){
             this.logger.logToFile(err);
             return false;
         }
        
     }
 
     /**
      * @async
      * @param {String} path 
      * Путь до HTML-шаблона
      * @param {Object} param 
      * Объект с параметрами которые используется для подстановки в шаблон
      * @returns {Promise}
      * @desc Рендерит HTML-шаблон .html и возвращает его через Promise
      */
 
     render(path,param=null){
         return new Promise((resolve,reject)=>{
             if(!fs.existsSync(path)) reject(false);
             param = param!=null?{domain:this.config.DOMAIN,CSRF:Session.genCsrf(),root:param}:{domain:this.config.DOMAIN,CSRF:Session.genCsrf()};
             Nun.render(path, param, (err, html) => { 
                 if(err) reject(err);
                 resolve(html);
             });
         })
     }
 }
 
 class HttpClient extends Middle{
     request = null;
     response = null;
     /** @type {Token}*/
     token = null;
     /** @type {Translate}*/
     translate=null;
     input = {};
     os=null;
     ip=null;
 
     constructor(config,req,res,useCookie=true){
         super(config);
         this.request=req;
         this.response=res;
         if(useCookie){
             Cookie.init(this.request,this.response,this.config.COOKIE_PASS);
         }
         Session.start(config.ROOT,Cookie.get('ses-id'),true);
         this.token=new Token(this.config.LTT,this.config.LTRT,this.config.CSRF_KEY,this.config.DOMAIN);
         this.translate=new Translate(this.config);
     }
     /**
      * 
      * @param {String} method 
      * Метод отправки данных http (POST,GET и т.д.)
      * @desc Получает входящие данные указанным методом (по умолчанию POST)  и устанавливает их в свойство input объекта, так же получает и устанавливает свойства ip и os
      */
     async getInput(method){
         let input = new InputHttp(this.request);
         if(Array.isArray(method)){
             for(let item of method){
                 let inputData = await input.getData(item);
                 inputData=input.stripTags(inputData);
                 this.input=Object.assign(this.input, inputData);
             }
         }else{
             this.input=await input.getData(method);
         }
         this.input=input.getUserData(this.input);
         this.os=input.getOs();
         this.ip = input.getIp();
     }
 
     /**
      * 
      * @param {String} path 
      * Путь до HTML-шаблона
      * @param {Object} param 
      * Объект с параметрами которые используется для подстановки в шаблон
      * @desc Рендерит HTML-шаблон .html и отправляет клиенту
      */
     view(path,param=null){
         param = param!=null?{domain:this.config.DOMAIN,CSRF:Session.genCsrf(),p:param}:{domain:this.config.DOMAIN,CSRF:Session.genCsrf()};
         Nun.render(path,param,(err,html)=>{
             if(err==null){
                 this.response.write(html); 
                 this.response.end(); 
             }else{
                 console.log(err);
             }
         })
     }
 
 
     /**
      * 
      * @param {String} addr 
      * @desc
      * Переадресует запрос по указанному адресу, устанавливает заголовок 301
      */
     redirect(addr){
         this.response.writeHead(301, {'Location': addr});
         this.response.end();
     }
 }
 
 class SocketClient extends Middle{
     /** @type {Token}*/
     token = null;
     /** @type {Translate}*/
     translate=null;
     input={};
     client=null;
     type=null;
     emitter = null;
 
     #router=null;
     #routes=null;
 
 
     constructor(config,client,routes){
         super(config);
         this.client = client;
         this.#routes=routes;
         this.emitter = new EventEmitter();
         this.token=new Token(this.config.LTT,this.config.LTRT,this.config.CSRF_KEY,this.config.DOMAIN);
         client.on('message', message => {
             let data;
             if(typeof message=='string'){
                 data = JSON.parse(message);
             }else{
                 data = JSON.parse(new TextDecoder().decode(message));
             }
             let sesId=null;
             if(data.hasOwnProperty('sesId')){
                sesId=data.sesId;
             }
             Session.start(config.ROOT,sesId);
             this.translate=new Translate(this.config);
             this.input = data;
             if(this.#router==null){
                 this.#router = new RouterSocket(this.#routes)
             }
             this.#router.start(this);
             
             //client.send(new TextEncoder().encode(JSON.stringify({success:1,message:"success"})));
         });
         client.on('close', () => {
             this.emitter.emit('close')
         });
     }
 
     /**
      * 
      * @param {Object} data 
      * @desc Делает рассылку в JSON формате всем подключенным клиентам из списка
      */
     broadcast(data){
         this.emitter.emit('broadcast',data);
     }
 
     /**
      * 
      * @param {Object} data 
      * @desc Отправляет клиенту данные в JSON формате через WebSocket
      */
     send(data){
         this.client.send(new TextEncoder().encode(JSON.stringify(data)));
     }
 }
 
 class Filter {
     /**
      * @param {String} type 
      * @param {any} variable 
      * @returns {boolean} true|false|null
      * @desc Валидирует данные с помощью регулярных выражений возвращает null если нет подходящего типа для проверки
      */
     validate(type,variable){
         for(let [key,value] of regular){
             let reg = new RegExp(`^.*${key}*$`)
             if(reg.test(type)){ 
                 if(value.test(variable)){
                     return true;
                 }else{
                     return false;
                 }
             }
         }
         return null;
     }
 
     /**
      * 
      * @param {String} uri 
      * @param {boolean} hardCheck 
      * @returns {Object}
      * @desc Парсит данные из Ajax запроса если они передаются блоками и возвращает объект 
      */
     parseData(uri,hardCheck=false){
         let reg = new RegExp(/content-disposition/,'gi');
         if(reg.test(uri)){
             let obj={};
             let data = uri.split(/--[\w\-\_\@\#\~\(\)\[\]\\\/\*\.\,\?\^\&\+\:\;\'\"\`\$\<\>]+/);
             for(let i =0;i<data.length;i++){
                 data[i]=data[i].replace(/[\n\r\t]+/g,';');
                 let arr = data[i].split(';');
                 if(arr.length>1){
                     let name;
                     for(let item of arr){
                         if(/name="([^"]+)"/.test(item)){
                             name=item.match(/name="([^"]+)"/);
                             name=name[1];
                             arr.pop();
                             let value=arr.pop();
                             if(/^(false|true)$/i.test(value)){
                                 value=value.toLowerCase()==="true"?true:false;
                             }
                             if(/^[0-9]*[\.]?[0-9]+$/g.test(value)){
                                 value=Number(value);
                             }
                             obj[name]=value;
                             break;
                         }
                     } 
                 }
             }
             return obj;
         }else{
             return this.parseURI(uri);
         }   
     }
 
     /**
      * 
      * @param {String} uri 
      * @param {boolean} hardCheck 
      * @returns {Object} Возвращает объект с параметрами из URL(URI) строки
      */
     parseURI(uri,hardCheck=false){
         let arr = uri.split('&');
         let result={};
         for(let item of arr){
             let spl = item.split('=');
             if(spl.length==2){
                 result[spl[0]]=decodeURIComponent(spl[1]);
             }else{
                 if(hardCheck) return false;
             }
         }
         for(let key in result){
             if(/^(false|true)$/i.test(result[key])){
                 result[key]=result[key].toLowerCase()==="true"?true:false;
             }
             if(/^[0-9]*[\.]?[0-9]+$/g.test(result[key])){
                 result[key]=Number(result[key]);
             }
         }
         return result;
     }
 
     /**
      * 
      * @param {Object} data 
      * @param {boolean} hardCheck 
      * @returns {boolean|Object} true|Object
      * @desc Передавая данные в объекте, валидирует их и возвращает либо те что прошли валидацию, либо false при условии hardCheck=true
      */
     getUserData(data,hardCheck=false){
         let userData ={};
         for(let key in data){
             if(data[key]!=null&&data[key]!=undefined&&data[key]!=''){
                 let valid = this.validate(key,data[key]);
                 if(valid||valid==null){
                     userData[key]=data[key];
                 }else{
                     if(hardCheck) return false;
                 }
             }
         }
         return userData;
     }
 
     /**
      * 
      * @param {(Array|Object|String)} data 
      * @returns {(Array|Object|String)} 
      * @desc Очищает данные в объекте, массиве или строке от html тегов
      */
     stripTags(data){
         let reg = /(<)([\/]{0,1})[^\<\>]+(>)/g;
         if(Array.isArray(data)){
             for(let i=0;i<data.length;i++){
                 data[i]=data[i].toString().replace(reg,'');
             }
         }else if(typeof data === 'object'){
             for(let key in data){
                 data[key]=data[key].toString().replace(reg,'');
             }
         }else{
             data=data.toString().replace(reg,'');
         }
         return data;
     }
 }
 
 class InputHttp extends Filter{
     #request = null;
     constructor(req){
         super();
         this.#request=req;
     }
 
     getData(method='POST'){
         switch(method){
             case 'get': 
                 return new Promise((resolve,reject)=>{
                     let params  = url.parse(this.#request.url,true);
                     resolve(params.query); 
                 });
 
             case 'post': 
                 return new Promise((resolve,reject)=>{
                     let body='',data='';
                     this.#request.on('data',chunk=> body+=chunk.toString());
                     this.#request.on('end',()=>{
                         resolve(this.parseData(body));
                     });
                 });  
         }
     }
 
     getOs(){
         try{
             for(let [item,reg] of oses) {
                 if (reg.test(this.#request.headers['user-agent'])) {
                     return item;
                 }
             }
             return 'Unknown';
         } catch {
             return 'Unknown';
         }
     }
     
     getIp(){
         return this.#request.headers['x-forwarded-for'];
     }
 }
 
 class Session {
     static #sessionStorage=new Map();
     static #sesId=null;
     static root=null;
     static isStart=false;
     
     static cleanTime = require('./settings/config').SESSION_CLEAN_TIME; 
 
     static start(root, sesId=null,setCookie=false){
         this.idLength = require('./settings/config').ID_LENGTH;
         if(!fs.existsSync(root+"/storage/sessions")){
             fs.mkdir(root+"/storage/sessions",(err) =>{
                 if(err){
                     return false;
                 }
             });
         }
         this.root=root;
         if(sesId!=null){
             this.#sesId=sesId;
             this.restore();
         }else{
             this.#sesId = this.genId();
         }
         if(setCookie){
             Cookie.set('ses-id',this.#sesId)
         }
         if(!this.isset('csrf_key')){
             this.set('csrf_key',Session.hash(20,'all')+this.#sesId);
         }
         this.isStart=true;
     }
    
     static genId(){
         let random;
         do{
             random=[];
             for(let i=0;i<this.idLength/4;i++){
                 random.push(Session.hash(4,'chars-numbers'));
             }
             random=random.join('-');
         }while(fs.existsSync(this.root+"/storage/sessions/"+random+'.json'));
         return random;
     }
 
     static genCsrf(){
         let sign = crypto.createHash('sha256').update(this.get('csrf_key')).digest('hex'); 
         return sign;
     }
 
     static verifyCsrf(key){
         if(this.isStart){
             let sign = crypto.createHash('sha256').update(this.get('csrf_key')).digest('hex');
             if(sign!=key) return false;
             else return true;
         }else{
             return false;
         }
     }
 
     static set(name, value){
         this.#sessionStorage.set(name,value);
         this.save();
         return true;
     }
 
     static unset(name){
         if(this.#sessionStorage.has(name)){
             this.#sessionStorage.delete(name);
             this.save();
             return true;
         }
         return false;
     }
 
     static isset(name){
         return this.#sessionStorage.has(name);
     }
 
     static get(name=null){
         if(name==null) return this.#sessionStorage;
         else return this.#sessionStorage.get(name);
     }
 
     static save(){
         let data= Object.fromEntries(this.#sessionStorage);
         let obj;
         if(fs.existsSync(this.root+'/storage/sessions/'+this.#sesId+'.json')){
             obj = JSON.parse(fs.readFileSync(this.root+'/storage/sessions/'+this.#sesId+'.json','utf-8'));
             obj.data=data;
             obj.update=Date.now();
         }else{
             obj={data:data,create:Date.now(),update:Date.now()};
         }
         fs.writeFileSync(this.root+'/storage/sessions/'+this.#sesId+'.json',JSON.stringify(obj));
     }
 
     static close(){
         if(fs.existsSync(this.root+'/storage/sessions/'+this.#sesId+'.json')){
             fs.unlinkSync(this.root+'/storage/sessions/'+this.#sesId+'.json');
             this.#sessionStorage=new Map();
             this.#sesId = this.genId();
         }
     }
 
     static clean(root){
         if(fs.existsSync(root+'/storage/sessions')){
             let files = fs.readdirSync(root+'/storage/sessions',{withFileTypes:true});
             for(let file of files){
                 let path = root+'/storage/sessions/'+file.name;
                 let obj = JSON.parse(fs.readFileSync(path,'utf-8'));
                 if(new Date(Date.now()-obj.update).getHours()>this.cleanTime){
                     fs.unlinkSync(path);
                 }
             }
         }
     }
 
     static restore(){
         if(fs.existsSync(this.root+'/storage/sessions/'+this.#sesId+'.json')){
             let obj = JSON.parse(fs.readFileSync(this.root+'/storage/sessions/'+this.#sesId+'.json','utf-8'));
             this.#sessionStorage = new Map(Object.entries(obj.data));
         }else{
             this.#sessionStorage = new Map();
         }
     }
 
      /**
      * 
      * @param {Number} length 
      * @param {String} type 
      * @returns {String} Возвращает строку из разного набора символов указанной длинны
      * 
      * @desc ТИПЫ:
      * 
      * all - цифры,буквы и некоторые спец. символы
      * 
      * chars - буквы
      * 
      * caps-chars - буквы в верхнемрегистре
      * 
      * numbers - числа
      * 
      * code - буквы в верхнем регистре и числа
      * @static
      */
     static hash(length,type='all'){
         let chars,result='';
         switch(type){
             case 'chars':chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                 break;
             case 'caps-chars': chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                 break;
             case 'numbers': chars = '0123456789';
                 break;
             case 'chars-numbers': chars='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                 break;
             case 'code': chars= '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                 break;
             case 'all': chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@_';
                 break;
             default: chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@_';
                 break;
         }
         for(let i=0;i<length;i++){
             result+=chars[Math.round(Math.random()*length)];
         }
         return result;
     }
 }
 
 class LocalStorage{
     static ROOT;
     static #storage;
     static setRoot(root){
         this.ROOT=root;
     }
     
     static set(name, value){
         this.#storage.set(name,value);
         this.save();
         return true;
     }
 
     static unset(name){
         if(this.#storage.has(name)){
             this.#storage.delete(name);
             this.save();
             return true;
         }
         return false;
     }
 
     static isset(name){
         return this.#storage.has(name);
     }
 
     static clean(){
         if(fs.existsSync(this.ROOT+'/storage/localStorage.json')){
             fs.unlinkSync(this.ROOT+'/storage/localStorage.json');
             this.#storage=new Map();
         }
     }
 
     static get(name=null){
         if(name==null) return this.#storage;
         else return this.#storage.get(name);
     }
 
     static save(){
         let data= Object.fromEntries(this.#storage);
         let obj;
         if(fs.existsSync(this.ROOT+'/storage/localStorage.json')){
             obj = JSON.parse(fs.readFileSync(this.ROOT+'/storage/localStorage.json','utf-8'));
             obj.data=data;
             obj.update=Date.now();
         }else{
             obj={data:data,create:Date.now(),update:Date.now()};
         }
         fs.writeFileSync(this.ROOT+'/storage/localStorage.json',JSON.stringify(obj));
     }
     static restore(){
         if(fs.existsSync(this.ROOT+'/storage/localStorage.json')){
             let obj = JSON.parse(fs.readFileSync(this.ROOT+'/storage/localStorage.json','utf-8'));
             this.#storage = new Map(Object.entries(obj.data));
         }else{
             this.#storage = new Map();
         }
     }
 }
 
 class Cookie{
     static #request=null;
     static #response=null;
     static #cookieData=new Map();
     static #cookiePass=null;
     static isInit=false;
 
     static init(req,res,cookiePass){
         this.#request=req;
         this.#response=res;
         this.#cookiePass=cookiePass;
         this.isInit=true;
     }
     static set(name,value,expires=null,domain=null,path=null,secure=false,httpOnly=false,sameSite=null,signed=false){
         if(signed){
             let key = crypto.createHmac('sha256',this.#cookiePass).update(name).digest('hex');
             name +='.'+key;
         }
         if(value==null||value==undefined||value==''){
             return false;
         } 
         let data;
         if(Array.isArray(value)||typeof value === 'object'){
             data=`"${encodeURIComponent(JSON.stringify(value))}"`;
         }else{
             data=`"${encodeURIComponent(value)}"`;
         }
         let cookie = `${name}=${data}`;
         if(expires!=null) cookie+=`; Expires=${new Date(expires).toUTCString()}`;
         if(domain!=null) cookie+=`; Domain=${domain}`;
         if(path!=null) cookie+=`; Path=${path}`;
         if(secure) cookie+='; Secure';
         if(httpOnly) cookie+='; HttpOnly';
         if(sameSite!=null) cookie+=`; SameSite = ${sameSite}`;
         this.#cookieData.set(name,cookie);
         data=Array.from(this.#cookieData.values());
         this.#response.setHeader('Set-Cookie',data);
         return true;
     }
 
     static isset(name){
         let cookies = this.#request.headers['cookie'];
         if(cookies!=undefined){
             let reg = new RegExp(`${name}="([\\w\\%\\[\\]\\{\\}\\#\\.\\,\\?\\$]+)"`,'g');
             return reg.test(cookies);
         }
     }
 
     /**
      * 
      * @param {string} name 
      * @returns {object|string|null} Возвращает объект либо строку из cookie если они есть, если нет то null
      */
     static get(name){
         let cookies = this.#request.headers['cookie'];
         if(cookies!=undefined){
             let reg = new RegExp(`${name}="([\\w\\%\\[\\]\\{\\}\\#\\.\\,\\?\\$\\-\\+\\_\\'\\@]+)"`,'g');
             let res = cookies.match(reg);
             if(res!=null){
                 reg = new RegExp(/"([\w\s\W\S]+)"/);
                 let obj = res[0].match(reg);
                 obj = decodeURIComponent(obj[1]);
                 if(/\[[\w\s\W\S]+\]/.test(obj)||/\{[\w\s\W\S]+\}/.test(obj)){
                     return JSON.parse(obj);
                 }else{
                     return obj;
                 }
             }else{
                 return null;
             } 
         }else{
             return null;
         }
     }
 
     static delete(name){
         let time = new Date(0).toUTCString();
         let cookie = `${name}=delete; Expires=${time}`;
         this.#cookieData.set(name,cookie);
         let data=Array.from(this.#cookieData.values());
         this.#response.setHeader('Set-Cookie',data);
         return true;
     }
 }
 
 class Token{
 
     LTT=null;
     LTRT=null;
     DOMAIN=null;
     CSRF_KEY=null;
 
     constructor(ltt,ltrt,csrf,domain){
         this.LTT=ltt;
         this.LTRT=ltrt;
         this.DOMAIN=domain;
         this.CSRF_KEY=csrf;
     }
 
     btoa(text){
         return Buffer.from(text, 'binary').toString('base64');
     };
 
     atob(text){
         return Buffer.from(text, 'base64').toString('binary');
     };
 
     encode(data,key,refresh=false){
         if(key!=null&&key!=undefined&&key!=''){
             let header ={ alg:'SHA256'};
             let segments=[];
             segments[0]=this.btoa(JSON.stringify(header));
             segments[1]=this.btoa(JSON.stringify(data));
             let dataSign = segments[0]+"."+segments[1];
             let sign = crypto.createHmac('sha256',String(key)).update(dataSign).digest('base64');
             segments[2]=sign;
             let res = segments.join('.');
             return encodeURIComponent(res);
         }else{
             return false;
         }
     }
 
      /**@returns {false|TokenBody}  */
     decode(token){
         try{
             if(token==null||token=='') return false;
             let segments = decodeURIComponent(token).split('.');
             if(segments.length<3){
                 return false;
             }
             let data={};
             data.header=JSON.parse(this.atob(segments[0]));
             data.body=JSON.parse(this.atob(segments[1]));
             data.sign = segments[2];
             return data;
         }catch(ex){
             console.error(ex);
             return false;
         }
     }
 
      /**@returns {Result}  */
     verify(token,key){
         let data = this.decode(token);
         if(!data){
             return {success: 0,message: 'Токен поврежден'};
         }
         let time = new Date();
         if(data.body.exp<time.getTime()){
             return {success:1,message:'Время действия токена истекло'};
         }
         let segments = decodeURIComponent(token).split('.');
         let dataSign = segments[0]+"."+segments[1];
         let sign = crypto.createHmac('sha256',String(key)).update(dataSign).digest('base64');
         if(data.sign!=sign){
             return {success:0,message:'Недействительный токен'};
         }
         return {success: 1, message:'Действительный токен'};
     }
 
     verifyUserToken(user,token,rToken=null) {
         try {
             let infoAccess = this.decode(token);
             if(!infoAccess) return false;
             let infoRefresh = rToken!=null?this.decode(rToken):null;
             if (!user.hasOwnProperty('userId')||!user.hasOwnProperty('userKey')||!user.hasOwnProperty('userRkey')) return false; 
             if(infoAccess.body.data.userId!=user.userId) return false;
             let result = this.verify(token,user.userKey);
             if(result.success==0){
                 if(infoRefresh===false) return false;
                 if(infoRefresh!=null){
                     if(infoRefresh.body.data.userId!=infoAccess.body.data.userId) return false;
                     if(infoRefresh.body.data.userId!=user.userId) return false;
                     result = this.verify(rToken,user.keyRtoken);
                     if(result.success==1){
                         return true;
                     }else{
                         return false;
                     }
                 }else{
                     return false;
                 }
             }else{
                 return true;
             }
         } catch(e) {
             console.error(e);
             console.error('Ошибка проверки токена');
             return false;
         }
     }
 
     generate(user,refresh=false){
         let token,refreshToken;
         let data={
             iss:this.DOMAIN,
             gen:Date.now(),
             exp:Date.now()+((3600*1000)*24*this.LTT),
             data:{
                 userId:user.userId,
                 userName:user.userName,
                 userSurname:user.userSurname,
                 email:user.userEmail,
                 userRole:user.userRole,
             }
         };
         token = this.encode(data,user.userKey);
         if(token==false) throw new Error('В объекте user отсутствует ключ для генерации access_token');
         if(refresh){
             let dateAccess = data.exp;
             data.exp = Date.now()+((3600*1000)*24*this.LTRT);
             let dateRefresh = data.exp;
             refreshToken = this.encode(data,user.userRkey,true);
             if(refreshToken==false) throw new Error('В объекте user отсутствует ключ для генерации refresh_token');
             return {success:1,accessToken:token,refreshToken:refreshToken,dateAccess:dateAccess, dateRefresh:dateRefresh};
         }else{
             return {success: 1,accessToken: token,dateAccess:data.exp};
         }
     }
 
 }
 
 class Translate{ 
    
     #config=null;
     constructor(config){
         this.#config=config;
     } 
     get(field,lng=null){
         lng=lng!=null&&lng!=""?lng:(Session.isset('lang')?Session.get('lang'):this.#config.LOCALE);
     }
     getIn(field,param=null,lng=null){
         lng=lng!=null&&lng!=""?lng:(Session.isset('lang')?Session.get('lang'):this.#config.LOCALE);
         let locale; 
         if(param!=null) locale = new Locale(param);
         else locale = new Locale();
         locale.messages = require(this.#config.ROOT+'/storage/resources/locale_'+lng)(locale);
         if(locale.messages.has(field)) return locale.messages.get(field);
         else return false;
     }
 }
 
 class Locale{
     param={};
     constructor(p){
         this.param=p;
     }
     messages=null;
 }
 
 class Model {
     static table = null;
     static primary = null;
     #position = 1;
     #lastQuery = '';
     #data = [];
     #query = null;
 
     static select(params = null, distinct = false, tb = null) {
         let d = distinct ? 'DISTINCT ' : '';
         if (tb == null) {
             tb = this.table;
         }
         let query = 'SELECT ';
         if (params != null) {
             query += d + params.toString() + ' FROM ' + tb;
         } else {
             query += d + '* FROM ' + tb;
         }
         let obj = new this();
         obj.setQuery(query);
         return obj;
     }
 
     setQuery(query) {
         this.#query = query;
     }
 
     inSelect(params = null, distinct = false, tb = null) {
         let d = distinct ? 'DISTINCT ' : '';
         if (tb == null) {
             tb = this.constructor.table;
         }
         if (params != null) {
             this.#query += 'SELECT ' + d + params.toString() + ' FROM ' + tb;
         } else {
             this.#query += 'SELECT ' + d + '* FROM ' + tb;
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
 
     where(f, param = null) {
         if (typeof f == 'function' && param == null) {
             this.#lastQuery = 'innerWhere';
             this.#query += ' (';
             f(this);
             this.#query += ')'
         } else if (typeof f == 'string') {
             f = f.replace('?', '$' + this.#position);
             this.#position++;
             if (param != null) this.#data.push(param);
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
 
     on(f, param = null) {
         if (this.#lastQuery == 'where' || this.#lastQuery == 'innerWhere') {
             this.#query += ' AND ';
         } else {
             this.#query += ' WHERE ';
         }
         if (typeof f == 'function' && param == null) {
             this.#lastQuery = 'innerWhere';
             this.#query += ' ON ('
             f(this);
             this.#query += ')'
         } else if (typeof f == 'string') {
             param=param==null?'':param.toString();
             f = f + ' ON (' + param + ')';
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
             f = f.replace('?', '$' + this.#position);
             this.#position++;
             this.#data.push(param);
             if (this.#lastQuery == 'innerWhere') {
                 this.#query += f;
             } else {
                 this.#query += ' OR ' + f;
             }
             this.#lastQuery = 'where';
         }
         return this;
     }
 
     join(fieldCondition, fieldCondition2, tb2, tb = null) {
         tb = tb == null ? this.constructor.table : tb;
         this.#query += ' JOIN ' + this.constructor.table + ' ON ' + this.constructor.table + '.' + fieldCondition + '=' + tb2 + '.' + fieldCondition;
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
             this.#query += item + ' ' + direction.shift() + br;
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
             for (let name in this) {
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
             let strQuery = `INSERT INTO ${this.constructor.table} (${names.toString()}) VALUES (${values.toString()})`;
             let connect = new Connect();
             connect.con().then(connect => {
                 connect.query(strQuery, data, result => {
                     this.#position = 1;
                     connect.client.end();
                     if (!result) resolve(false);
                     else resolve(true);
                 })
             });
         })
     }
 
     update(isNull = false) {
         return new Promise((resolve, reject) => {
             this.#position = 1;
             let names = [], values = [], conditions = '';
             for (let item in this) {
                 let bname = item.replace(/([A-Z])/g, '_$1').toLowerCase();
                 if (this.constructor.primary != null && this.constructor.primary == bname) {
                     conditions = `WHERE ${bname}=$${this.#position}`;
                     values.push(this[item]);
                     this.#position++;
                 }
                 if (!isNull && this[item] == null) {
                     continue;
                 } else {
                     if (bname != this.constructor.primary && this[item] == null) {
                         names.push(`${bname}=NULL`);
                     } else {
                         if (this[item].toString().toLowerCase() === 'current_timestamp') {
                             this[item]=new Date();
                         }
                         names.push(`${bname}=$${this.#position}`);
                         values.push(this[item]);
                         this.#position++;
                     }
                 }
             }
             let connect = new Connect();
             this.#query=`UPDATE ${this.constructor.table} SET ${names.toString() + conditions}`
             try{
                 connect.con().then(connect => {
                     connect.query(this.#query, values, result => {
                         this.#position=1;
                         connect.client.end();
                         if (!result) resolve(false);
                         else resolve(true);
                     })
                 });
             }catch{
                 console.error(this.#query);
                 resolve(false);
             }
             
         });
     }
     /**
      * 
      * @param {boolean} wordSensetive 
      * @returns Возвращает промис, если что то пойдет не так при подключении вернет false. 
      * @desc
      * SELECT запрос вернет null если нет строк, объект если одна строка и массив объектов если строк больше.
      * 
      * COUNT,MAX,MIN,SUM и другие мат.запросы возвращают число
      * 
      * DELETE запрос true или false
      */
     send(wordSensetive = true) {
         return new Promise((resolve, reject) => {
             let connect = new Connect();
             try{
                 connect.con().then(connect => {
                     connect.query(this.#query, this.#data, result => {
                         if (!result) {
                             connect.client.end();
                             resolve(false);
                         }
                         if (wordSensetive) {
                             if (/^[^(]+COUNT[^)]+/.test(this.#query)) {
                                 connect.client.end();
                                 resolve(result.rows[0].count);
                             }
                             if (/^[^(]+MAX[^)]+/.test(this.#query)) {
                                 connect.client.end();
                                 resolve(result.rows[0].max);
                             }
                             if (/^[^(]+MIN[^)]+/.test(this.#query)) {
                                 connect.client.end();
                                 resolve(result.rows[0].min);
                             }
                             if (/^[^(]+SUM[^)]+/.test(this.#query)) {
                                 connect.client.end();
                                 resolve(result.rows[0].sum);
                             }
                         }
                         if (/^DELETE/.test(this.#query)) {
                             connect.client.end();
                             if(result.hasOwnProperty('rowCount')){
                                 resolve(true);
                             }
                             resolve(false);
                         }
                         if (/^SELECT/.test(this.#query)) {
                             let objs = this.constructor.parse(result.rows);
                             connect.client.end();
                             resolve(objs);
                         }
                     })
                 }).catch(()=>{throw 'Error'});
             }catch{
                 console.error(this.#query);
                 resolve(false);
             }
         })
     }
 
     static delete(param) {
         let query = 'DELETE FROM ' + this.table;
         let obj = new this();
         obj.setQuery(query);
         return obj;
     }
 
     static parse(objs) {
         let objects = [];
         if(objs==null||objs.length==0) return null;
         for (let item of objs) {
             let obj;
             obj = new this();
             for (let key in item) {
                 let newName = key.split('_').map((elem, index) => {
                     let str = elem;
                     if (index != 0) str = str.replace(/^[\w]/, (m) => m.toUpperCase());
                     return str;
                 }).join('');
                 for (let name in obj) {
                     if (name == newName) {
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
     constructor() {
         this.config=require('./settings/config');
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
                 console.error('Не удалось выполнить запрос к базе', err);
                 action(false);
             } else if (action != null) {
                 action(result);
             }
         });
     }
 }
 
 class Controller extends EventEmitter{
  
     #app=null;
     static type='base';
     #callbackAuthToken=null;
     auth=false;
     /**@param {HttpClient|SocketClient} app */
     constructor(app,callbackAuthToken=null){
         super();
         this.#app=app;
         this.#callbackAuthToken = callbackAuthToken;
     }
     
     async start(){
         if(Session.isset('user')){
             let accessToken=null,refreshToken=null;
             if(this.#app instanceof HttpClient&&Cookie.isInit){
                 if(Cookie.isset('access_token')&&Cookie.isset('refresh_token')){
                     accessToken=Cookie.get('access_token');
                     refreshToken=Cookie.get('refresh_token');
                 }
             }else{
                 if(this.#app.input.hasOwnProperty('access_token')){
                     accessToken=this.#app.input.access_token;
                     if(this.#app.input.hasOwnProperty('refresh_token')) refreshToken=this.#app.input.refresh_token;
                 }
             }
             if(accessToken!=null){
                 let result = this.#app.token.verifyUserToken(Session.get('user'),accessToken,refreshToken);
                 if(!result) {if(this.#app.hasOwnProperty('session')) Session.close();}
                 else this.auth=true;
             }else{
                 if(this.#app.hasOwnProperty('session')) Session.close();
             }
             this.emit('ready',true);
         }else{
             try{
                 if(this.#callbackAuthToken!=null&&typeof this.#callbackAuthToken =='function'){
                     this.#callbackAuthToken(this.#app).then((result)=>{
                         this.auth=result;
                         this.emit('ready',true);
                     });
                 }else{
                     this.emit('ready',true);
                 }
             }catch{
                 this.emit('ready',false);
             }
         }
        
     }
 }
 
 
 
 module.exports={App,AppSocket,Model,Controller,HttpClient,SocketClient,LocalStorage,Session,Cookie};