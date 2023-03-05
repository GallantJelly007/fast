//@ts-check

/**
 * @typedef {Object} TokenBody
 * @property {object} header 
 * @property {object} body 
 * @property {string} sign 
 */

/**
 * @typedef {Object} Result
 * @property {number} success 
 * @property {string} message 
 */

const crypto = require('crypto')

module.exports = class Token {

    LTT;
    LTRT;
    DOMAIN;
    CSRF_KEY;

    constructor(ltt, ltrt, csrf, domain) {
        this.LTT = ltt;
        this.LTRT = ltrt;
        this.DOMAIN = domain;
        this.CSRF_KEY = csrf;
    }

    btoa(text) {
        return Buffer.from(text, 'binary').toString('base64');
    };

    atob(text) {
        return Buffer.from(text, 'base64').toString('binary');
    };

    encode(data, key, refresh = false) {
        if (key != null && key != undefined && key != '') {
            let header = { alg: 'SHA256' };
            let segments = [];
            segments[0] = this.btoa(JSON.stringify(header));
            segments[1] = this.btoa(JSON.stringify(data));
            let dataSign = segments[0] + "." + segments[1];
            let sign = crypto.createHmac('sha256', String(key)).update(dataSign).digest('base64');
            segments[2] = sign;
            let res = segments.join('.');
            return encodeURIComponent(res);
        } else {
            return false;
        }
    }

    /**@returns {false|TokenBody}  */
    decode(token) {
        try {
            if (token == null || token == '') return false;
            let segments = decodeURIComponent(token).split('.');
            if (segments.length < 3) {
                return false;
            }
            let data = {};
            data.header = JSON.parse(this.atob(segments[0]));
            data.body = JSON.parse(this.atob(segments[1]));
            data.sign = segments[2];
            return data;
        } catch (ex) {
            console.error(ex);
            return false;
        }
    }

    /**@returns {Result}  */
    verify(token, key) {
        let data = this.decode(token);
        if (!data) {
            return { success: 0, message: 'Токен поврежден' };
        }
        let time = new Date();
        if (data.body.exp < time.getTime()) {
            return { success: 1, message: 'Время действия токена истекло' };
        }
        let segments = decodeURIComponent(token).split('.');
        let dataSign = segments[0] + "." + segments[1];
        let sign = crypto.createHmac('sha256', String(key)).update(dataSign).digest('base64');
        if (data.sign != sign) {
            return { success: 0, message: 'Недействительный токен' };
        }
        return { success: 1, message: 'Действительный токен' };
    }

    verifyUserToken(user, token, rToken = null) {
        try {
            let infoAccess = this.decode(token);
            if (!infoAccess) return false;
            let infoRefresh = rToken != null ? this.decode(rToken) : null;
            if (!user.hasOwnProperty('userId') || !user.hasOwnProperty('userKey') || !user.hasOwnProperty('userRkey')) return false;
            if (infoAccess.body.data.userId != user.userId) return false;
            let result = this.verify(token, user.userKey);
            if (result.success == 0) {
                if (infoRefresh === false) return false;
                if (infoRefresh != null) {
                    if (infoRefresh.body.data.userId != infoAccess.body.data.userId) return false;
                    if (infoRefresh.body.data.userId != user.userId) return false;
                    result = this.verify(rToken, user.keyRtoken);
                    if (result.success == 1) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return true;
            }
        } catch (e) {
            console.error(e);
            console.error('Ошибка проверки токена');
            return false;
        }
    }

    generate(user, refresh = false) {
        let token, refreshToken;
        let data = {
            iss: this.DOMAIN,
            gen: Date.now(),
            exp: Date.now() + ((3600 * 1000) * 24 * this.LTT),
            data: {
                userId: user.userId,
                userName: user.userName,
                userSurname: user.userSurname,
                email: user.userEmail,
                userRole: user.userRole,
            }
        };
        token = this.encode(data, user.userKey);
        if (token == false) throw new Error('В объекте user отсутствует ключ для генерации access_token');
        if (refresh) {
            let dateAccess = data.exp;
            data.exp = Date.now() + ((3600 * 1000) * 24 * this.LTRT);
            let dateRefresh = data.exp;
            refreshToken = this.encode(data, user.userRkey, true);
            if (refreshToken == false) throw new Error('В объекте user отсутствует ключ для генерации refresh_token');
            return { success: 1, accessToken: token, refreshToken: refreshToken, dateAccess: dateAccess, dateRefresh: dateRefresh };
        } else {
            return { success: 1, accessToken: token, dateAccess: data.exp };
        }
    }

}