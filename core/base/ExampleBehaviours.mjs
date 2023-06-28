//@ts-check
/*Behaviours классы служат для обработки входящих данных связи с бд и возврата результатов выполнения в контроллеры.
Здесь можно подключать модели для бд и использовать их в качестве БД используется PostgreeSQL
*/ 
export default class ExampleBehaviour{
    static async exampleFunc(app) {
        return {success:1,message:"Message Text"}; 
    }
}