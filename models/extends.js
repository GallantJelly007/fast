const {Model} = require('../core/app');

//Пример класса модели для таблицы в БД
class ExtendExampleModel extends Model{
    static table = 'user_data'; //table name
    static primary="user_id"; //PRIMARY 
    userId=null; //поля таблицы
    userName=null;
    userSurname=null;
    userEmail=null;
    userPass=null;
    userKey=null;
    userRkey=null;
}
module.exports={ExtendExampleModel};