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






const LocalStorage = require('./lib/storage');
const Session = require('./lib/session');
const {Router,SocketClient,HttpClient} = require('./lib/router');
const Logger = require('./lib/logger');





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
    #logger;
    constructor(root, config, routes) {
        this.#config = config
        this.#config.ROOT = root
        this.#routes = routes
        const server = require(this.#config.REQUIRE_SRV)
        this.#logger=new Logger(root,"APP")
        LocalStorage.setRoot(root)
        LocalStorage.restore()
        Session.setRoot(root)

        server.timeout = 120
        server.createServer((request, response) => {
            let router = new Router(this.#config, this.#routes)
            router.start(request, response)
        }).listen(this.#config.PORT)
     
        process.on('SIGINT', () => {
            this.#logger.debug('process.exit(1)','Закрытие App')
            Session.clean()
            LocalStorage.clean()
            process.exit(1)
        });
        process.on('SIGQUIT', () => {
            this.#logger.debug('process.exit(3)','Закрытие App')
            process.exit(3)
        });
        process.on('SIGTERM', () => {
            this.#logger.debug('process.exit(15)','Закрытие App')
            process.exit(15)
        });
    }
}


class AppSocket {
    clients = [];
    #config;
    #routes;
    #logger;
    constructor(root,config,port, routes) {
        const WebSocket = require('ws');
        const ws = new WebSocket.WebSocketServer({ port: port });
        this.#routes = routes;
        this.#config = config;
        this.#config.ROOT = root;
        this.#logger=new Logger(root,'AppSocket');
        LocalStorage.setRoot(root)
        LocalStorage.restore()
        Session.setRoot(root)

        ws.on('connection', client => {
            let newClient = new SocketClient(this.#config, client, this.#routes);
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

        process.on('SIGINT', () => {
            this.#logger.debug('process.exit(1)','Закрытие AppSocket')
            Session.clean()
            LocalStorage.clean()
            process.exit(1)
        });
        process.on('SIGQUIT', () => {
            this.#logger.debug('process.exit(3)','Закрытие AppSocket')
            process.exit(3)
        });
        process.on('SIGTERM', () => {
            this.#logger.debug('process.exit(15)','Закрытие AppSocket')
            process.exit(15)
        });
    }

    setOnExit(func) {
        process.on('exit', () => { func(this.clients) });
    }
}


module.exports = {App,AppSocket}