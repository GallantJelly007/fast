const config = {}
config.SITE_NAME='NAME SITE';
config.MAIL_NAME='MAIL NAME';
config.MAIL_PASS='Pass';
config.MAIL_USER='User';
config.MAIL_HOST='smtp.example.com';
config.MAIL_SECURE=true;
config.MAIL_PORT=465;
config.DB_NAME='example';
config.DB_USER='root';
config.DB_HOST='localhost';
config.DB_PASS='********';
config.DB_PORT=5432;
config.PORT=3002;
config.PORT_SOCKET=3004;
config.REQUIRE_SRV='http';
config.COOKIE_PASS='*********';
config.COOKIE_SECURE=false;
config.COOKIE_SIGN=false;
config.DOMAIN_NAME='example';
config.PROTOCOL_SOCKET='ws://';
config.ROOT='';
config.PROTOCOL=config.REQUIRE_SRV+'://';
config.DOMAIN= config.PROTOCOL+config.DOMAIN_NAME;
config.STATIC='public';
config.LTT=3;
config.LTRT=30;
config.LOCALE='ru';
config.SESSION_CLEAN_TIME=24;
config.ID_LENGTH=24;
config.ALLOWED_FORMATS=new Map([
    ['.png','image/png'],
    ['.svg','image/svg+xml'],
    ['.jpg','image/jpeg'],
    ['.jpeg','image/jpeg'],
    ['.ico','image/x-icon'],
    ['.css','text/css'],
    ['.js','application/javascript'],
    ['.otf','font/otf'],
    ['.ttf','font/ttf'],
]);

module.exports=config;
