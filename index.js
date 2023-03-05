//подключение App
const {App} = require('./core/app');
const config = require('./core/settings/config') ;

const routes={};
//Загрузка роутов из файла
routes[config.DOMAIN_NAME]=require('./core/settings/routes')
//Старт нового приложения
const app = new App(__dirname,config,routes);



