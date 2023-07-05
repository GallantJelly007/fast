//@ts-check

// @ts-ignore
import { Controller } from 'fastflash'

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
            app.view('./views/example.html')
            return true
        }catch(err){
            throw err
        }
    }
}