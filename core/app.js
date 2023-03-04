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
    ["login", /^[a-zA-Z][a-zA-Z0-9-_\.]{3,20}$/],
    ["name", /[A-zА-яЁ-ё]{2,30}$/u],
    ["email", /^[\w.]+@([A-z0-9][-A-z0-9]+\.)+[A-z]{2,4}$/],
    ["pass", /^[^А-Яа-яЁё]{8,20}$/],
    ["telephone", /^(\+)([- _():=+]?\d[- _():=+]?){11,14}(\s*)?$/]
]);


const oses = new Map([
    ['Windows 3.11', /(Win16)/],
    ['Windows 95', /(Windows 95)|(Win95)|(Windows_95)/],
    ['Windows 98', /(Windows 98)|(Win98)/],
    ['Windows 2000', /(Windows NT 5.0)|(Windows 2000)/],
    ['Windows 2000 Service Pack 1', /(Windows NT 5.01)/],
    ['Windows XP', /(Windows NT 5.1)|(Windows XP)/],
    ['Windows Server 2003', /(Windows NT 5.2)/],
    ['Windows Vista', /(Windows NT 6.0)|(Windows Vista)/],
    ['Windows 7', /(Windows NT 6.1)|(Windows 7)/],
    ['Windows 8', /(Windows NT 6.2)|(Windows 8)/],
    ['Windows 8.1', /(Windows NT 6.3)|(Windows 8.1)/],
    ['Windows 10', /(Windows NT 10.0)|(Windows 10)/],
    ['Windows 11', /(Windows NT 11.0)|(Windows 11)/],
    ['Windows NT 4.0', /(Windows NT 4.0)|(WinNT4.0)|(WinNT)|(Windows NT)/],
    ['Windows ME', /(Windows ME)|(Windows 98; Win 9x 4.90 )/],
    ['Windows CE', /(Windows CE)/],
    ['Mac OS X Kodiak (beta)', /(Mac OS X beta)/],
    ['Mac OS X Cheetah', /(Mac OS X 10.0)/],
    ['Mac OS X Puma', /(Mac OS X 10.1)/],
    ['Mac OS X Jaguar', /(Mac OS X 10.2)/],
    ['Mac OS X Panther', /(Mac OS X 10.3)/],
    ['Mac OS X Tiger', /(Mac OS X 10.4)/],
    ['Mac OS X Leopard', /(Mac OS X 10.5)/],
    ['Mac OS X Snow Leopard', /(Mac OS X 10.6)/],
    ['Mac OS X Lion', /(Mac OS X 10.7)/],
    ['Mac OS X', /(Mac OS X)/],
    ['Mac OS', /(Mac_PowerPC)|(PowerPC)|(Macintosh)/],
    ['Open BSD', /(OpenBSD)/],
    ['SunOS', /(SunOS)/],
    ['Solaris 11', /(Solaris\/11)|(Solaris11)/],
    ['Solaris 10', /((Solaris\/10)|(Solaris10))/],
    ['Solaris 9', /((Solaris\/9)|(Solaris9))/],
    ['CentOS', /(CentOS)/],
    ['QNX', /(QNX)/],
    ['UNIX', /(UNIX)/],
    ['Ubuntu 21.04', /(Ubuntu\/21.04)|(Ubuntu 21.04)/],
    ['Ubuntu 20.04', /(Ubuntu\/20.04)|(Ubuntu 20.04)/],
    ['Ubuntu 19.04', /(Ubuntu\/19.04)|(Ubuntu 19.04)/],
    ['Ubuntu 18.04', /(Ubuntu\/18.04)|(Ubuntu 18.04)/],
    ['Ubuntu 17.04', /(Ubuntu\/17.04)|(Ubuntu 17.04)/],
    ['Ubuntu 16.04', /(Ubuntu\/16.04)|(Ubuntu 16.04)/],
    ['Ubuntu 15.04', /(Ubuntu\/15.04)|(Ubuntu 15.04)/],
    ['Ubuntu 14.04', /(Ubuntu\/14.04)|(Ubuntu 14.04)/],
    ['Ubuntu 13.10', /(Ubuntu\/13.10)|(Ubuntu 13.10)/],
    ['Ubuntu 13.04', /(Ubuntu\/13.04)|(Ubuntu 12.04)/],
    ['Ubuntu 12.10', /(Ubuntu\/12.10)|(Ubuntu 12.10)/],
    ['Ubuntu 12.04 LTS', /(Ubuntu\/12.04)|(Ubuntu 12.04)/],
    ['Ubuntu 11.10', /(Ubuntu\/11.10)|(Ubuntu 11.10)/],
    ['Ubuntu 11.04', /(Ubuntu\/11.04)|(Ubuntu 11.04)/],
    ['Ubuntu 10.10', /(Ubuntu\/10.10)|(Ubuntu 10.10)/],
    ['Ubuntu 10.04 LTS', /(Ubuntu\/10.04)|(Ubuntu 10.04)/],
    ['Ubuntu 9.10', /(Ubuntu\/9.10)|(Ubuntu 9.10)/],
    ['Ubuntu 9.04', /(Ubuntu\/9.04)|(Ubuntu 9.04)/],
    ['Ubuntu 8.10', /(Ubuntu\/8.10)|(Ubuntu 8.10)/],
    ['Ubuntu 8.04 LTS', /(Ubuntu\/8.04)|(Ubuntu 8.04)/],
    ['Ubuntu 6.06 LTS', /(Ubuntu\/6.06)|(Ubuntu 6.06)/],
    ['Red Hat Linux', /(Red Hat)/],
    ['Red Hat Enterprise Linux', /(Red Hat Enterprise)/],
    ['Fedora 17', /(Fedora\/17)|(Fedora 17)/],
    ['Fedora 16', /(Fedora\/16)|(Fedora 16)/],
    ['Fedora 15', /(Fedora\/15)|(Fedora 15)/],
    ['Fedora 14', /(Fedora\/14)|(Fedora 14)/],
    ['Chromium OS', /(ChromiumOS)/],
    ['Google Chrome OS', /(ChromeOS)/],
    ['OpenBSD', /(OpenBSD)/],
    ['FreeBSD', /(FreeBSD)/],
    ['NetBSD', /(NetBSD)/],
    ['Android 12.0', /(Android\/12)|(Android 12)/],
    ['Android 11.0', /(Android\/11)|(Android 11)/],
    ['Android 10.0', /(Android\/10)|(Android 10)/],
    ['Android 9.0 Pie', /(Android\/9)|(Android 9)/],
    ['Android 8.1 Oreo', /(Android\/8.1)|(Android 8.1)/],
    ['Android 8.0 Oreo', /(Android\/8)|(Android 8)/],
    ['Android 7.1 Nougat', /(Android\/7.1)|(Android 7.1)/],
    ['Android 7.0 Nougat', /(Android\/7)|(Android 7)/],
    ['Android 6.0 Marshmallow', /(Android\/6)|(Android 6)/],
    ['Android 5.1 Lollipop', /(Android\/5.1)|(Android 5.1)/],
    ['Android 5.0 Lollipop', /(Android\/5)|(Android 5)/],
    ['Android 4.4 KitKat', /(Android\/4.4)|(Android 4.4)/],
    ['Android 4.3 Jelly Bean', /(Android\/4.3)|(Android 4.3)/],
    ['Android 4.2 Jelly Bean', /(Android\/4.2)|(Android 4.2)/],
    ['Android 4.1 Jelly Bean', /(Android\/4.1)|(Android 4.1)/],
    ['Android 4.0 Ice Cream Sandwich', /(Android\/4.0)|(Android 4.0)/],
    ['Linux', /(Linux)|(X11)/],
    ['iPod', /(iPod)/],
    ['iPhone', /(iPhone)/],
    ['iPad', /(iPad)/],
    ['OS/8', /(OS\/8)|(OS8)/],
    ['Older DEC OS', /(DEC)|(RSTS)|(RSTS\/E)/],
    ['WPS-8', /(WPS-8)|(WPS8)/],
    ['BeOS', /(BeOS)|(BeOS r5)/],
    ['BeIA', /(BeIA)/],
    ['OS/2 2.0', /(OS\/220)|(OS\/2 2.0)/],
    ['OS/2', /(OS\/2)|(OS2)/],
    ['Search engine or robot', /(nuhk)|(Googlebot)|(Yammybot)|(Openbot)|(Slurp)|(msnbot)|(Ask Jeeves\/Teoma)|(ia_archiver)/]
]);

const mimeTypes = new Map([
    ['.atom', 'application/atom+xml'],
    ['.edi', 'application/EDI-X12'],
    ['.edi', 'application/EDIFACT'],
    ['.json', 'application/json'],
    ['.js', 'application/javascript'],
    ['.bin', 'application/octet-stream'],
    ['.ogg', 'application/ogg'],
    ['.pdf', 'application/pdf'],
    ['.ps', 'application/postscript'],
    ['.xml', '.application/soap+xml'],
    ['.woff', 'application/font-woff'],
    ['.xhtml', 'application/xhtml+xml'],
    ['.xml', 'application/xml-dtd'],
    ['.xml', 'application/xop+xml'],
    ['.zip', 'application/zip'],
    ['.gzip', 'application/gzip'],
    ['.torrent', 'application/x-bittorrent'],
    ['.dvi', 'application/x-tex'],
    ['.xml', 'application/xml'],
    ['.doc', 'application/msword'],
    ['.docx', 'application/msword'],
    ['.audio', 'audio/basic'],
    ['.audio', 'audio/L24'],
    ['.mp4', 'audio/mp4'],
    ['.aac', 'audio/aac'],
    ['.mp3', 'audio/mpeg'],
    ['.ogg', 'audio/ogg'],
    ['.oga', 'audio/vorbis'],
    ['.wma', 'audio/x-ms-wma'],
    ['.wma', 'audio/x-ms-wax'],
    ['.rm', 'audio/vnd.rn-realaudio'],
    ['.wav', 'audio/vnd.wave'],
    ['.webm', 'audio/webm'],
    ['.gif', 'image/gif'],
    ['.jpeg', 'image/jpeg'],
    ['.jpg', 'image/jpeg'],
    ['.jpe', 'image/jpeg'],
    ['.jpeg', 'image/pjpeg'],
    ['.jpg', 'image/pjpeg'],
    ['.jpe', 'image/pjpeg'],
    ['.png', 'image/png'],
    ['.svg', 'image/svg+xml'],
    ['.tiff', 'image/tiff'],
    ['.ico', 'image/vnd.microsoft.icon'],
    ['.ico', 'image/x-icon'],
    ['.wbmp', 'image/vnd.wap.wbmp'],
    ['.webp', 'image/webp'],
    ['.http', 'message/http'],
    ['.xml', 'message/imdn+xml'],
    ['.txt', 'message/partial'],
    ['.mht', 'message/rfc822'],
    ['.mhtml', 'message/rfc822'],
    ['.eml', 'message/rfc822'],
    ['.mime', 'message/rfc822'],
    ['.example', 'model/example'],
    ['.igs', 'model/iges'],
    ['.iges', 'model/iges'],
    ['.msh', 'model/mesh'],
    ['.mesh', 'model/mesh'],
    ['.silo', 'model/mesh'],
    ['.wrl', 'model/vrml'],
    ['.vrml', 'model/vrml'],
    ['.x3d', 'model/x3d+binary'],
    ['.x3d', 'model/x3d+vrml'],
    ['.x3d', 'model/x3d+xml'],
    ['.cmd', 'text/cmd'],
    ['.css', 'text/css'],
    ['.csv', 'text/csv'],
    ['.html', 'text/html'],
    ['.htm', 'text/html'],
    ['.js', 'text/javascript'],
    ['.txt', 'text/plain'],
    ['.php', 'text/php'],
    ['.xml', 'text/xml'],
    ['.md', 'text/markdown'],
    ['.manifest', 'text/cache-manifest'],
    ['.otf','font/otf'],
    ['.ttf','font/ttf'],
    ['.woff','font/woff'],
    ['.mpg', 'video/mpeg'],
    ['.mpeg', 'video/mpeg'],
    ['.mp4', 'video/mp4'],
    ['.ogg', 'video/ogg'],
    ['.mov', 'video/quicktime'],
    ['.qt', 'video/quicktime'],
    ['.webm', 'video/webm'],
    ['.wmv', 'video/x-ms-wmv'],
    ['.flv', 'video/x-flv'],
    ['.avi', 'video/x-msvideo'],
    ['.3gp', 'video/3gpp'],
    ['.3gpp', 'video/3gpp'],
    ['.3g2', 'video/3gpp2'],
    ['.3gpp2', 'video/3gpp2']
]);

class App {
    #config;
    #routes;
    constructor(root, config, routes) {
        this.#config = config;
        this.#config.ROOT = root;
        this.#routes = routes;
        const server = require(this.#config.REQUIRE_SRV);
        LocalStorage.setRoot(root);
        LocalStorage.restore();
        process.on('SIGINT', () => {
            console.log('Закрытие приложения');
            Session.clean(__dirname);
            LocalStorage.clean();
            process.exit(1);
        });
        process.on('SIGQUIT', () => {
            console.log('Закрытие приложения');
            process.exit(3);
        });
        process.on('SIGTERM', () => {
            console.log('Закрытие приложения');
            process.exit(15);
        });

        server.createServer((request, response) => {
            let router = new Router(this.#config, this.#routes);
            router.start(request, response);
        }).listen(this.#config.PORT);
        server.timeout = 120;
    }
}


class AppSocket {
    clients = [];
    config;
    routes;
    constructor(port, root, routes) {
        const WebSocket = require('ws');
        const ws = new WebSocket.WebSocketServer({ port: port });
        this.routes = routes;
        this.config = require('./settings/config');
        this.config.ROOT = root;
        ws.on('connection', client => {
            let newClient = new SocketClient(this.config, client, this.routes);
            newClient.send({ success: 1, message: "success" });
            this.clients.push(newClient);
            newClient.emitter.on('close', () => {
                for (let i = 0; i < this.clients.length; i++) {
                    if (this.clients[i] == newClient) {
                        this.clients.splice(i);
                        break;
                    }
                }
            })

            newClient.emitter.on('broadcast', (data) => {
                for (let i = 0; i < this.clients.length; i++) {
                    if (this.clients[i] == newClient) {
                        continue;
                    }
                    if (data.hasOwnProperty('type')) {
                        if (this.clients[i].type == data.type && data.type != null) {
                            this.clients[i].send(data.data);
                        }
                    } else {
                        this.clients[i].send(data.data);
                    }
                }
            })
        });
    }
    setOnExit(func) {
        process.on('exit', () => { func(this.clients) });
    }
}




class Middle {

    logger = null;
    config = null;

    constructor(config) {
        this.config = config;
        this.logger = new Logger(this.config.ROOT);
    }

    /**
     * 
     * @param {Number} port 
     * @returns {boolean} Возвращает true в случае успешного выполнения, иначе false
     * @desc Записывает порт, который уже используется, в файл на сервере и сохраняет
     */
    addClosePort(port = null) {
        if (fs.existsSync(this.config.ROOT + '/core/settings/close-ports.json')) {
            let ports = JSON.parse(fs.readFileSync(this.config.ROOT + '/core/settings/close-ports.json', 'utf-8'));
            let check = false;
            for (let item of ports.ports) {
                if (Number(item) == port) {
                    check = true;
                    break;
                }
            }
            port = port == null ? this.config.PORT : port;
            if (!check) {
                ports.ports.push(this.config.PORT)
                JSON.stringify(ports);
                fs.writeFileSync(this.config.ROOT + '/core/settings/close-ports.json', JSON.stringify(ports));
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
    request = null;
    response = null;
    /** @type {Token}*/
    token = null;
    /** @type {Translate}*/
    translate = null;
    input = {};
    os = null;
    ip = null;

    constructor(config, req, res, useCookie = true) {
        super(config);
        this.request = req;
        this.response = res;
        if (useCookie) {
            Cookie.init(this.request, this.response, this.config.COOKIE_PASS);
        }
        Session.start(config.ROOT, Cookie.get('ses-id'), true);
        this.token = new Token(this.config.LTT, this.config.LTRT, this.config.CSRF_KEY, this.config.DOMAIN);
        this.translate = new Translate(this.config);
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
    redirect(addr) {
        this.response.writeHead(301, { 'Location': addr });
        this.response.end();
    }
}

class SocketClient extends Middle {
    /** @type {Token}*/
    token = null;
    /** @type {Translate}*/
    translate = null;
    input = {};
    client = null;
    type = null;
    emitter = null;

    #router = null;
    #routes = null;


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














module.exports = { App, AppSocket, HttpClient, SocketClient};