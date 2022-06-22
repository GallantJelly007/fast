const {Controller,LocalStorage,Cookie,Session} = require('../core/app')

module.exports = class ExampleController extends Controller{
    //Определяет тип контроллера, для Rest type='rest'
    static type='base';

    constructor(app){
        //Вторым параметром в super можно передать функцию для авторизации по токенам
        super(app);
    }

    //Все функции контроллера ассинхронные и начинаются со слова action, Должны возвращать результат true- при успешном выполнении и false при неуспешном? А перед эти отправлять рендер или результат пользователю
    async actionExampleView(app){
        app.view(app.config.ROOT+'/views/example.twig');
        return true;
    }
}