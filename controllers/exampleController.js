//@ts-chec
import Controller from '../core/lib/controller.js'
import LocalStorage from '../core/lib/storage.js'
import Cookie from '../core/lib/cookie.js'
import Session from '../core/lib/session.js'
import CONFIG from '../core/settings/config.js'

export default class ExampleController extends Controller{
    //Определяет тип контроллера, для Rest type='rest'
    static type='base'

    constructor(app){
        //Вторым параметром в super можно передать функцию для авторизации по токенам
        super(app)
    }

    //Все функции контроллера ассинхронные, Должны возвращать результат true- при успешном выполнении и false при неуспешном? А перед эти отправлять рендер или результат пользователю
    async view(app){
        try{
            app.view(CONFIG.ROOT+'/views/example.html')
            return true
        }catch(err){
            throw err
        }
    }
}