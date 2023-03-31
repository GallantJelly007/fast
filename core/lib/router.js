//@ts-check

const EventEmitter = require('events');
const Logger = require('./logger');
const fs = require('fs');
const nodemailer = require('nodemailer');
const Nun = require('nunjucks');
const Token = require('./token');
const Translate = require('./translate');
const Cookie = require('./cookie');
const InputHttp = require('./input');
const Session = require('./session');


class RouterStatic{
    #config;
    constructor(config){
        this.#config = config;
    }

    async start(request,response){
        let isSuccess=false
        let path = request.url.toString();
        path = path.startsWith('/') ? path.substring(1, path.length) : path;
        path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
        path = decodeURI(path);
        for (let item of this.#config.ALLOWED_FORMATS.keys()) {
            for(let folder of this.#config.STATIC_PATHS){
                if (path.startsWith(folder) && path.endsWith(item)) {
                    fs.readFile(this.#config.ROOT + "/" + path, (err, data) => {
                        if (!err) {
                            response.setHeader('Content-Type', this.#config.ALLOWED_FORMATS.get(item));
                            response.end(data);
                        } else {
                            response.statusCode = 404;
                            response.end();
                        }
                    });
                    isSuccess=true
                    break;
                }
            }
            if(isSuccess){
                break;
            }
        }
    }
}

class Router {
    #config;
    emmiter;
    #routes = {};
    #logger;
    constructor(config, routes) {
        this.#config = config;
        this.#routes = routes;
        this.emmiter = new EventEmitter();
        this.#logger = new Logger(config.ROOT,"Router");
    }

    async start(request, response) {
        let isCheck = false, isStatic = false;

        try {

            let path = request.url.toString();
            path = path.startsWith('/') ? path.substring(1, path.length) : path;
            path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
            path = decodeURI(path);
            for (let item of this.#config.ALLOWED_STATIC_FORMATS.keys()) {
                for (let folder of this.#config.STATIC_PATHS) {
                    if (path.startsWith(folder) && path.endsWith(item)) {
                        fs.readFile(this.#config.ROOT + "/" + path, (err, data) => {
                            if (!err) {
                                response.setHeader('Content-Type', this.#config.ALLOWED_STATIC_FORMATS.get(item));
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
                if (isStatic) {
                    break;
                }
            }
            if (!isStatic) {
                let ref = request.headers['x-forwarded-host'];
                ref = ref ?? request.headers['host'];
                let routes = null;
                for (let key in this.#routes) {
                    let reg = new RegExp(`^${key}$`)
                    if (reg.test(ref)) {
                        routes = this.#routes[key];
                        break;
                    }
                }
                if (routes == null) {
                    response.statusCode = 404;
                    response.end();
                    return;
                }
                let checkEvent = false;
                this.emmiter.on('checkRes', () => {
                    if (!isCheck) {
                        response.statusCode = 404;
                        response.end();
                    }
                })
                for (let item of routes.keys()) {
                    let reg = new RegExp(item);
                    if (reg.test(path)) {

                        let route, app;
                        if (item != path) {
                            route = path.replace(item, routes.get(item)).split(':');
                        } else {
                            route = routes.get(item).split(':');
                        }
                        if (route.length != 2) {
                            response.statusCode = 404;
                            response.end();
                            throw new Error('Неверный шаблон адреса');
                        }
                        let methods = route[0].split('/');
                        route = route[1].split('/');
                        if (!fs.existsSync(this.#config.ROOT + '/controllers/' + route[0] + 'Controller.js')) {
                            response.statusCode = 404;
                            response.end();
                            throw new Error('Не найден контроллер для запроса');
                        }
                        let classController = require(this.#config.ROOT + '/controllers/' + route.shift() + 'Controller');
                        response.setHeader('Content-Type', 'text/html; charset=utf-8');

                        switch (classController.type) {
                            case 'base': app = new HttpClient(this.#config, request, response, methods);
                                break;
                            case 'rest': app = new HttpClient(this.#config, request, response, methods, false);
                                break;
                            default: throw new Error('Не указан тип контролеера');
                        }
                        await app.getInput(methods);
                        let controller = new classController(app);
                        let method = route[0];
                        route.shift();

                        let r = this;
                        if (route.length == 0) route = null;
                        controller.on('ready', async (result) => {
                            if (!result) isCheck = false;
                            else await controller[method](app, route)
                                .then(result => {
                                    isCheck = result;
                                    r.emmiter.emit('checkRes');
                                })
                                .catch(err => {
                                    response.statusCode = 503;
                                    response.end();
                                    if (this.#config.DEV_MODE) {
                                        this.#logger.error(err, request.url.toString());
                                        this.#logger.errToFile(err, request.url.toString())
                                    }
                                });
                        });
                        checkEvent = true;
                        await controller.start();

                        break;
                    } else {
                        isCheck = false;
                    }
                }
                if (!checkEvent) {
                    response.statusCode = 404;
                    response.end();
                }
            }
        } catch (err) {
            if (this.#config.DEV_MODE) {
                this.#logger.error(err, request.url.toString());
                this.#logger.errToFile(err, request.url.toString())
            }
        }

    }
}

class RouterSocket {

    #routes;
    #config;
    #logger;
    constructor(config, routes) {
        this.#routes = routes;
        this.#config = config;
        this.#logger = new Logger(config.ROOT,"RouterSocket");
    }

    /**@param {SocketClient} client */
    async start(client) {
        try {

            let emmiter = new EventEmitter();
            let isCheck = false;
            if (client.input.hasOwnProperty('query')) {
                if (client.input.hasOwnProperty('type') && client.type == null) {
                    if (client.input.type != null && client.input.type != '') client.type = client.input.type;
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
                            client.send({ success: 0, message: "Неверные данные запроса" });
                            return;
                        }
                        let classController = require(client.config.ROOT + '/controllers/' + route.shift() + 'Controller');

                        let controller = new classController(client);

                        let method = 'action' + route[0][0].toUpperCase() + route[0].slice(1);
                        route.shift();
                        if (route.length > 0) controller.on('ready', async () => { isCheck = await controller[method](client, route); emmiter.emit('checkRes') });
                        else controller.on('ready', async () => { isCheck = await controller[method](client); emmiter.emit('checkRes') });
                        controller.start();
                        break;
                    } else {
                        isCheck = false;
                    }
                }
                emmiter.on('checkRes', () => {
                    if (!isCheck) {
                        client.send({ success: 0, message: "Неверные данные запроса" });
                    }
                })
            } else {
                client.send({ success: 0, message: "Неверные данные запроса" });
            }
        } catch (err) {
            if (this.#config.DEV_MODE) {
                this.#logger.error(err, client.input.query);
                this.#logger.errToFile(err, client.input.query);
            }
        }
    }
}


class Middle {

    logger;
    config;

    constructor(config) {
        this.config = config;
        this.logger = new Logger(config.ROOT,"Middle");
    }

    /**
     * 
     * @param {Number} port 
     * @returns {boolean} Возвращает true в случае успешного выполнения, иначе false
     * @desc Записывает порт, который уже используется, в файл на сервере и сохраняет
     */
    addClosePort(port = -1) {
        try{
            if (fs.existsSync(this.config.ROOT + '/core/settings/close-ports.json')) {
                let ports = JSON.parse(fs.readFileSync(this.config.ROOT + '/core/settings/close-ports.json', 'utf-8'));
                let check = false;
                for (let item of ports.ports) {
                    if (Number(item) == port) {
                        check = true;
                        break;
                    }
                }
                port = port == -1 ? this.config.PORT : port;
                if (!check) {
                    ports.ports.push(this.config.PORT)
                    JSON.stringify(ports);
                    fs.writeFileSync(this.config.ROOT + '/core/settings/close-ports.json', JSON.stringify(ports));
                }
                return true;
            }
            return false;
        }catch(err){
            if(this.config.DEV_MODE){
                this.logger.error(err);
                this.logger.errToFile(err);
            }
            return false;
        }
        
    }


    /**
     * @async
     * @param {String} to 
     * Адрес куда отправить письмо
     * @param {String} subject 
     * От кого письмо
     * @param {String} text 
     * Текст письма
     * @returns {Promise<boolean>} Возвращает true в случае успешной отправки либо false
     * @desc Отправляет письмо по указанному адресу через nodemailer
     */
    async mail(to, subject, text) {
        let transporter = nodemailer.createTransport({
            host: this.config.MAIL_HOST,
            port: this.config.MAIL_PORT,
            secure: this.config.MAIL_SECURE,
            auth: {
                user: this.config.MAIL_USER,
                pass: this.config.MAIL_PASS,
            },
        });
        try {
            let info = await transporter.sendMail({
                from: `"${this.config.SITE_NAME}" <${this.config.MAIL_USER}>`, // sender address
                to: to.toString(), // list of receivers
                subject: subject, // Subject line
                html: text, // html body
            });
            if (info.hasOwnProperty('accepted')) {
                if (info.accepted.length > 0) return true;
                else return false;
            } else return false;
        } catch (err) {
            if(this.config.DEV_MODE){
                this.logger.error(err);
                this.logger.errToFile(err);
            }
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

    render(path, param = null) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(path)) reject(false);
            param = param != null ? { domain: this.config.DOMAIN, CSRF: Session.genCsrf(), root: param } : { domain: this.config.DOMAIN, CSRF: Session.genCsrf() };
            Nun.render(path, param, (err, html) => {
                if (err) reject(err);
                resolve(html);
            });
        })
    }
}

class HttpClient extends Middle {
    request;
    response;
    /** @type {Token}*/
    token;
    /** @type {Translate}*/
    translate;
    input = {};
    os = 'Unknown';
    ip = null;

    constructor(config, req, res, methods ,useCookie = true,) {
        super(config);
        this.request = req;
        this.response = res;
        if (useCookie) {
            Cookie.init(this.request, this.response, this.config.COOKIE_PASS);
            Session.start(config.ROOT, Cookie.get('ses-id'), true);
            this.token = new Token(this.config.LTT, this.config.LTRT, this.config.CSRF_KEY, this.config.DOMAIN);
            this.translate = new Translate(this.config);
            if(this.config.DEV_MODE)
                this.logger.debug("Create HTTPClient",this);
        }else{
            this.getInput(methods).then((input)=>{
                if(input.hasOwnProperty('sesId')){
                    Session.start(config.ROOT, input.sesId, true);
                    this.token = new Token(this.config.LTT, this.config.LTRT, this.config.CSRF_KEY, this.config.DOMAIN);
                    this.translate = new Translate(this.config);
                    if(this.config.DEV_MODE)
                        this.logger.debug("Create HTTPClient without session",this);
                }else{
                    this.token = new Token(this.config.LTT, this.config.LTRT, this.config.CSRF_KEY, this.config.DOMAIN);
                    this.translate = new Translate(this.config);
                    if(this.config.DEV_MODE)
                        this.logger.debug("Create HTTPClient without session and cookie",this);
                }
            }).catch(()=>{
                this.logger.debug("Error create HTTPClient without cookie",this);
            })
        }
    }
    /**
     * 
     * @param {String} method 
     * Метод отправки данных http (POST,GET и т.д.)
     * @desc Получает входящие данные указанным методом (по умолчанию POST)  и устанавливает их в свойство input объекта, так же получает и устанавливает свойства ip и os
     */
    async getInput(method) {
        let input = new InputHttp(this.request);
        if (Array.isArray(method)) {
            for (let item of method) {
                let inputData = await input.getData(item);
                inputData = input.stripTags(inputData);
                this.input = Object.assign(this.input, inputData);
            }
        } else {
            this.input = await input.getData(method);
        }
        this.input = input.getUserData(this.input);
        this.os = input.getOs();
        this.ip = input.getIp();
        if(this.config.DEV_MODE)
            this.logger.debug("HttpClient.getInput()",this.input);
        return this.input;
    }

    /**
     * 
     * @param {String} path 
     * Путь до HTML-шаблона
     * @param {Object} param 
     * Объект с параметрами которые используется для подстановки в шаблон
     * @desc Рендерит HTML-шаблон .html и отправляет клиенту
     */
    view(path, param = null) {
        param = param != null ? { domain: this.config.DOMAIN, CSRF: Session.genCsrf(), p: param } : { domain: this.config.DOMAIN, CSRF: Session.genCsrf() };
        Nun.render(path, param, (err, html) => {
            if (err == null) {
                this.response.write(html);
                this.response.end();
            } else {
                if(this.config.DEV_MODE){
                    this.logger.error(err,"HttpClient.view()");
                    this.logger.errToFile(err,"HttpClient.view()");
                }
            }
        })
    }


    /**
     * 
     * @param {String} addr 
     * @desc
     * Переадресует запрос по указанному адресу, устанавливает заголовок 301
     */
    redirect(addr) {
        this.response.writeHead(301, { 'Location': addr });
        this.response.end();
        if(this.config.DEV_MODE){
            this.logger.debug("HttpClient.redirect()",addr);
        }
    }
}

class SocketClient extends Middle {
    /** @type {Token}*/
    token;
    /** @type {Translate}*/
    translate;
    input = {};
    client;
    type;
    emitter;
    #router;
    #routes;


    constructor(config, client, routes) {
        super(config);
        this.client = client;
        this.#routes = routes;
        this.emitter = new EventEmitter();
        this.token = new Token(this.config.LTT, this.config.LTRT, this.config.CSRF_KEY, this.config.DOMAIN);
        client.on('message', message => {
            let data;
            if (typeof message == 'string') {
                data = JSON.parse(message);
            } else {
                data = JSON.parse(new TextDecoder().decode(message));
            }
            let sesId = null;
            if (data.hasOwnProperty('sesId')) {
                sesId = data.sesId;
            }
            Session.start(config.ROOT, sesId);
            this.translate = new Translate(this.config);
            this.input = data;
            if (this.#router == null) {
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
    broadcast(data) {
        this.emitter.emit('broadcast', data);
    }

    /**
     * 
     * @param {Object} data 
     * @desc Отправляет клиенту данные в JSON формате через WebSocket
     */
    send(data) {
        this.client.send(new TextEncoder().encode(JSON.stringify(data)));
    }
}

module.exports = {Router,RouterSocket,RouterStatic,HttpClient,SocketClient}