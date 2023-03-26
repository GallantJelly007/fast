const Controller = require('../core/lib/controller');
const LocalStorage = require('../core/lib/storage');
const Cookie = require('../core/lib/cookie');
const Session = require('../core/lib/session');

module.exports = class ExampleController extends Controller{
    //Определяет тип контроллера, для Rest type='rest'
    static type='base';

    constructor(app){
        //Вторым параметром в super можно передать функцию для авторизации по токенам
        super(app);
    }

    //Все функции контроллера ассинхронные, Должны возвращать результат true- при успешном выполнении и false при неуспешном? А перед эти отправлять рендер или результат пользователю
    async view(app){
        app.view(app.config.ROOT+'/views/example.html');
        return true;
    }
}