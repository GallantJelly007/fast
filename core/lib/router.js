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
    #config ;
    emmiter;
    #routes = {};
    constructor(config, routes) {
        this.#config = config;
        this.#routes = routes;
        this.emmiter = new EventEmitter();
    }

    async start(request, response) {
        let isCheck = false, isStatic = false;
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
                        console.error('Неверный шаблон адреса');
                        response.statusCode = 404;
                        response.end();
                        break;
                    }
                    let methods = route[0].split('/');
                    route = route[1].split('/');
                    if (!fs.existsSync(this.#config.ROOT + '/controllers/' + route[0] + 'Controller.js')) {
                        console.error('Не найден контроллер для запроса');
                        response.statusCode = 404;
                        response.end();
                        break;
                    }
                    let classController = require(this.#config.ROOT + '/controllers/' + route.shift() + 'Controller');
                    response.setHeader('Content-Type', 'text/html; charset=utf-8');

                    switch (classController.type) {
                        case 'base': app = new HttpClient(this.#config, request, response);
                            break;
                        case 'rest': app = new HttpClient(this.#config, request, response, false);
                            break;
                    }
                    await app.getInput(methods);
                    let controller = new classController(app);
                    let method = route[0];
                    route.shift();
                    try {
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
                                    console.log(err);
                                    app.logger.logToFile(err, request.url.toString());
                                    response.statusCode = 503;
                                    response.end();
                                });
                        });
                        checkEvent = true;
                        await controller.start();
                    } catch (err) {
                        console.error(err);
                    }
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
    }
}

class RouterSocket {

    #routes = null;
    constructor(routes) {
        this.#routes = routes;
    }

    /**@param {SocketClient} client */
    async start(client) {
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
    }
}

export {Router,RouterSocket,RouterStatic}