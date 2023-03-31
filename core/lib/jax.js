class jax{

    static isServer = typeof window ==='undefined'
    /**
     * 
     * @param {string} url 
     * @param {object} params 
     * @param {Map<string,string>|undefined} params.headers 
     * Коллекция для дополнительных заголовков. Content-Type устанавливать не нужно.
     * @param {object|FormData|Map|undefined} params.data
     * Объект, FormData, либо коллекция с данными для отправки на сервер. C responseType='json' поддерживает отправку объектов с глубокой вложенностью и Map-коллекциями
     * @param {string|undefined} params.responseType 
     * Тип ответа от сервера:
     * 
     * json - (По умолчанию) JSON-объект
     * 
     * text - Обычный текст
     * 
     * arraybuffer - Данные в ArrayBuffer
     * 
     * blob - Данные в Blob
     * 
     * document - Данные как XML/HTTP документ
     * 
     * @param {string|undefined} params.sendType
     * Тип отправки данных, устанавливает ContentType заголовок, поэтому его не нужно передавать в headers, типы отправки:
     * 
     * url - (По умолчанию) Отправляет данные как URL-строку
     * 
     * json - Отправляет данные в JSON формате с заголовком application/json
     * 
     * form - Отправляет данные с помощью FormData и заголовком multipart/form-data
     * 
     * @param {boolean|undefined} params.credentials 
     * Устанавливает WithCredentials для кросс-доменных запросов
     * 
     * @param {function} params.progress
     * Callback-функция для получения текущего прогресса (не работает для отправки с сервера)
     * @returns {Promise<object|string>} Возвращает Promise c результатом в случае успешного выполнения 
     * @desc Метод для отправки POST-запроса
     */

    static async post(url,params){
        let request = new JaxRequest('POST')
        return request.executeRequest(url,params);
    }
    /**
     * 
     * @param {string} url 
     * @param {object} params 
     * @param {Map<string,string>|undefined} params.headers 
     * Коллекция для дополнительных заголовков. Content-Type устанавливать не нужно.
     * @param {object|FormData|Map|undefined} params.data
     * Объект, FormData, либо коллекция с данными для отправки на сервер. C responseType='json' поддерживает отправку объектов с глубокой вложенностью и Map-коллекциями
     * @param {string|undefined} params.responseType 
     * Тип ответа от сервера:
     * 
     * json - (По умолчанию) JSON-объект
     * 
     * text - Обычный текст
     * 
     * arraybuffer - Данные в ArrayBuffer
     * 
     * blob - Данные в Blob
     * 
     * document - Данные как XML/HTTP документ
     * 
     * @param {boolean|undefined} params.credentials 
     * Устанавливает WithCredentials для кросс-доменных запросов
     * @param {function} params.progress
     * Callback-функция для получения текущего прогресса (не работает для отправки с сервера)
     * @returns {Promise<object|string>} Возвращает Promise c результатом в случае успешного выполнения 
     * @desc Метод для отправки GET-запроса
     */
    static async get(url,params){
        let request = new JaxRequest('GET')
        return request.executeRequest(url,params);
    }
   /**
     * 
     * @param {string} url 
     * @param {object} params 
     * @param {Map<string,string>|undefined} params.headers 
     * Коллекция для дополнительных заголовков. Content-Type устанавливать не нужно.
     * @param {object|FormData|Map|undefined} params.data
     * Объект, FormData, либо коллекция с данными для отправки на сервер. C responseType='json' поддерживает отправку объектов с глубокой вложенностью и Map-коллекциями
     * @param {string|undefined} params.responseType 
     * Тип ответа от сервера:
     * 
     * json - (По умолчанию) JSON-объект
     * 
     * text - Обычный текст
     * 
     * arraybuffer - Данные в ArrayBuffer
     * 
     * blob - Данные в Blob
     * 
     * document - Данные как XML/HTTP документ
     * 
     * @param {string|undefined} params.sendType
     * Тип отправки данных, устанавливает ContentType заголовок, поэтому его не нужно передавать в headers, типы отправки:
     * 
     * url - (По умолчанию) Отправляет данные как URL-строку
     * 
     * json - Отправляет данные в JSON формате с заголовком application/json
     * 
     * form - Отправляет данные с помощью FormData и заголовком multipart/form-data
     * 
     * @param {boolean|undefined} params.credentials 
     * Устанавливает WithCredentials для кросс-доменных запросов
     * 
     * @param {function} params.progress
     * Callback-функция для получения текущего прогресса (не работает для отправки с сервера)
     * @returns {Promise<object|string>} Возвращает Promise c результатом в случае успешного выполнения 
     * @desc Метод для отправки PUT-запроса
     */
    static async put(url,params){
        let request = new JaxRequest('PUT')
        return request.executeRequest(url,params);
    }
    /**
     * 
     * @param {string} url 
     * @param {object} params 
     * @param {Map<string,string>|undefined} params.headers 
     * Коллекция для дополнительных заголовков. Content-Type устанавливать не нужно.
     * @param {object|FormData|Map|undefined} params.data
     * Объект, FormData, либо коллекция с данными для отправки на сервер. C responseType='json' поддерживает отправку объектов с глубокой вложенностью и Map-коллекциями
     * @param {string|undefined} params.responseType 
     * Тип ответа от сервера:
     * 
     * json - (По умолчанию) JSON-объект
     * 
     * text - Обычный текст
     * 
     * arraybuffer - Данные в ArrayBuffer
     * 
     * blob - Данные в Blob
     * 
     * document - Данные как XML/HTTP документ
     * 
     * @param {boolean|undefined} params.credentials 
     * Устанавливает WithCredentials для кросс-доменных запросов
     * 
     * @param {function} params.progress
     * Callback-функция для получения текущего прогресса (не работает для отправки с сервера)
     * @returns {Promise<object|string>} Возвращает Promise c результатом в случае успешного выполнения 
     * @desc Метод для отправки DELETE-запроса
     */
    static async delete(url,params){
        let request = new JaxRequest('DELETE')
        return request.executeRequest(url,params);
    } 
    

    /**
     * 
     * @param {string} url 
     * @param {object} params 
     * @param {Map<string,string>|undefined} params.headers 
     * Коллекция для дополнительных заголовков. Content-Type устанавливать не нужно.
     * @param {string|undefined} params.responseType 
     * Тип ответа от сервера:
     * 
     * json - (По умолчанию) JSON-объект
     * 
     * text - Обычный текст
     * 
     * arraybuffer - Данные в ArrayBuffer
     * 
     * blob - Данные в Blob
     * 
     * document - Данные как XML/HTTP документ
     * 
     * @param {File|FileList} params.files
     * Коллекция отправляемых файлов (Обязательный параметр)
     * 
     * @param {boolean|undefined} params.credentials 
     * Устанавливает WithCredentials для кросс-доменных запросов
     * 
     * @param {function} params.progress
     * Callback-функция для получения текущего прогресса (не работает для отправки с сервера)
     * @returns {Promise<object|string>} Возвращает Promise c результатом в случае успешного выполнения 
     * @desc Метод для отправки DELETE-запроса
     */
    static async file(url,params){
        let request = new JaxRequest('POST')
        return request.executeRequest(url,params,true);
    }
}

class JaxRequest{
    #req = null;
    #params = null;
    #method = null;
    #headers=new Map();
    #body=null;
    #url=null;
    #responseType=null;
    #isServer = jax.isServer;
    #protocol ='https';
    #responseTypes =['text','arraybuffer','json','blob','document'];

    constructor(method){
        this.#method=method
    }

    async executeRequest(url,params,file=false){
        this.#params=params;
        this.#url=url;
        if(this.#isServer){
            if(this.#convertParams(file)) return this.#sendServer();
        }else{
            this.#create(); 
            if(this.#convertParams(file)) return this.#send();
        }
    }

	#create(){
		let request = false;
		if (window.XMLHttpRequest)
		{
			request = new XMLHttpRequest();
		}
		else if (window.ActiveXObject)
		{
			try
			{
				request = new ActiveXObject("Microsoft.XMLHTTP");
			}    
			catch (CatchException)
			{
				request = new ActiveXObject("Msxml2.XMLHTTP");
			}
		}
		if (!request)
		{
			console.error("Unable create XMLHttpRequest");
            return false;
		}
        this.#req=request;
        return true;
	}

    setSSL(isSet=true){
        this.#protocol = isSet?'https':'http'
    } 

    #jsonMapReplacer(key, value){
        if (value instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries()), 
            };
        } else {
            return value;
        }
    }

    #jsonMapReviewer(key, value) {
        if(typeof value === 'object' && value !== null) {
            if (value.dataType === 'Map') {
                return new Map(value.value);
            }
        }
        return value;
    }

    #checkInputTypeFile(el){
        let inputs = el.getElementsByTagName('input');
        for(let item of inputs){
            if(item.type=='file') return true;
        }
        return false;
    }

    #convertObjToUrlOrData(data,formData=false){
        let result = formData?new FormData():[];
        try{
            if(data instanceof Map) data = Object.fromEntries(data);
            if(data instanceof Object){
                for(let key in data){
                    let item = data[key];
                    if(item instanceof Object||item instanceof Map){
                        item=item instanceof Object?Object.entries(item):item;
                        for(let [el,value] of item){
                            if(formData) result.append(key+`[${el}]`,value.toString());
                            else result.push(key+`[${el}]=`+encodeURIComponent(value.toString()));
                        }
                    }else if(Array.isArray(item)){
                        for(let el of item){
                            if(formData) result.append(key+`[]`,el.toString());
                            else result.push(key+'[]='+encodeURIComponent(el.toString()));
                        }
                    }else{
                        if(formData) result.append(key,item.toString());
                        else result.push(key+'='+encodeURIComponent(item.toString()));
                    }
                }
            }else{
                return false;
            }
            if(!formData) result = result.join('&');
            return result;
        }catch(err){
            console.error(err);
            return false;
        }
    }

    #convertDataToUrlOrObject(data,toObj=false){
        try{
            if(data instanceof FormData){
                let url;
                if(toObj){
                    url={}
                    let index=0;
                    for(let [key,value] of data.entries()){
                        if(/[\[\]]/gm.test(key)){
                            let prop = key.match(/[\[]([\w]+)[\]]/);
                            if(prop!=null&&prop.length>1){ 
                                let name = key.replace(/[\[]([\w]+)[\]]/g,'');
                                if(url[name]==undefined) url[name]={};
                                url[name][prop[1]]=value;
                            }else {
                                let name = key.replace(/[\[\]]/g,'');
                                if(url[name]==undefined) url[name]={};
                                url[name][index.toString()]=value;
                            }
                            index++;
                        }else{
                            url[key]=value;
                        }
                    }
                    return url;
                }else{
                    url=[];
                    for(let [key,value] of data.entries()){
                        url.push(encodeURIComponent(key)+'='+encodeURIComponent(value));
                    }
                    url=url.join('&');
                }
                return url;
            }else{
                return false;
            }
        }catch(err){
            console.error(err);
            return false;
        }
    }

    #convertParams(file=false){
        try {
            if (typeof this.#params?.credentials === 'boolean' && !this.#isServer) {
                this.#req.withCredentials = this.#params.credentials;
            }
            
            if (this.#params?.headers != undefined && this.#params?.headers != undefined) {
                for (let [key,value] of this.#params.headers) {
                    if (key.toLowerCase() != 'content-type') {
                        this.#headers.set(key, value);
                    }
                }
            }
            if (this.#method == 'GET' || this.#method == 'DELETE') {  
                this.#headers.set('Content-type','application/x-www-form-urlencoded');
                if(this.#params?.data != undefined && this.#params?.data != null){
                    if (!this.#isServer&&this.#params.data instanceof FormData) {
                        this.#url+='?'+this.#convertDataToUrlOrObject(this.#params.data);
                    } else if (this.#params.data instanceof Map) {
                        this.#url+='?'+this.#convertObjToUrlOrData(this.#params.data).bind(this);
                    } else if (this.#params.data instanceof Object) {
                        this.#url+='?'+this.#convertObjToUrlOrData(this.#params.data);
                    } else if (this.#params.data instanceof HTMLElement||typeof this.#params.data === 'string') {
                        let container = this.#params.data instanceof HTMLElement?this.#params.data:document.getElementById(this.#params.data);
                        if(!this.#checkInputTypeFile(container)){
                            let data = new FormData(container);
                            this.#url+='?'+this.#convertDataToUrlOrObject(data);
                        }else{
                            console.error('File cannot be sent by the GET method');
                        }
                    } 
                }
            }else if(file && this.#params?.files!=undefined && this.#params?.files!=null){
                if(!this.#isServer){
                    this.#headers.delete('Content-type');
                    let form = new FormData();
                    if (this.#params.files instanceof File) {
                        form.append('files[]', this.#params.files);
                    } else if (this.#params.files instanceof FileList) {
                        for (let file of this.#params.files) {
                            form.append('files[]', file);
                        }
                    }
                    this.#body = form;
                }else{
                    //Дописать метод для отправки файла
                }
            }else{
                let sendType='url';
                this.#headers.set('Content-type','application/x-www-form-urlencoded'); 
                if (typeof this.#params?.sendType === 'string') {
                    switch (this.#params.sendType) {
                        case 'json': sendType='json'; this.#headers.set('Content-type','application/json; charset=utf-8'); break;
                        case 'form': sendType='form'; this.#headers.set('Content-type','multipart/form-data') ; break;
                        default: sendType='url'; this.#headers.set('Content-type','application/x-www-form-urlencoded') ;
                    }
                }
                
                if (this.#params?.data != undefined && this.#params?.data != null) {
                    if (!this.#isServer&&this.#params.data instanceof FormData) {
                        switch (sendType) {
                            case 'json': this.#body=JSON.stringify(this.#convertDataToUrlOrObject(this.#params.data,true)); break;
                            case 'form': this.#body=this.#params.data; break;
                            case 'url': this.#body=this.#convertDataToUrlOrObject(this.#params.data); break;
                        }
                    } else if (this.#params.data instanceof Map) {
                        switch (sendType) {
                            case 'json': this.#body=JSON.stringify(this.#params.data,this.#jsonMapReplacer); break;
                            case 'form': this.#body=this.#convertObjToUrlOrData(this.#params.data,true); break;
                            case 'url': this.#body=this.#convertObjToUrlOrData(this.#params.data); break;
                        }
                    } else if (this.#params.data instanceof Object) {
                        switch (sendType) {
                            case 'json': this.#body=JSON.stringify(this.#params.data,this.#jsonMapReplacer); break;
                            case 'form': this.#body=this.#convertObjToUrlOrData(this.#params.data,true); break;
                            case 'url': this.#body=this.#convertObjToUrlOrData(this.#params.data); break;
                        }  
                    } else if (this.#params.data instanceof HTMLElement&&!this.#isServer||typeof this.#params.data === 'string'&&!this.#isServer) {
                        let container = this.#params.data instanceof HTMLElement?this.#params.data:document.getElementById(this.#params.data);
                        let data = new FormData(container);
                        switch (sendType) {
                            case 'json': this.#body=JSON.stringify(this.#convertDataToUrlOrObject(data,true)); break;
                            case 'form': this.#body = data; break;
                            case 'url': this.#body=this.#convertDataToUrlOrObject(data); break;
                        } 
                    } 
                }else{
                    return false;
                }
            }
           
            if(typeof this.#params?.responseType ==='string'){
                for(let item of this.#responseTypes){
                    if(this.#params.responseType==item){
                        if(this.#isServer) this.#responseType=item;
                        else this.#req.responseType=item;
                        break;
                    }
                }
            }
            if(this.#req!=null&&this.#req.responseType==''&&!this.#isServer) this.#req.responseType='json';
            if(this.#responseType==null&&this.#isServer) this.#responseType='json';
            if(typeof this.#params?.progress === 'function'&&!this.#isServer) this.#req.upload.onprogress=this.#params.progress;
            return true;
        } catch(err) {
            console.error(err);
            return false;
        }
    }

    async #sendServer(){
        return new Promise((resolve, reject) => {
            let options, http, data = [];
            try {
                let str = this.#url.replace(/^(http:\/\/|https:\/\/)/,'');
                if(this.#method=='POST'||this.#method=='PUT') this.#headers.set('Content-Length',Buffer.byteLength(this.#body));
                http = require(this.#protocol);
                str = str.split('/');
                let host = str.shift();
                let url = str.join('/')
                options = {
                    hostname: host,
                    port: this.#protocol == 'http' ? 80 : 443,
                    path: `/${url}`,
                    method: this.#method,
                    headers: Object.fromEntries(this.#headers)
                }
                const req = http.request(options, (res) => {
                    res.on('data', (chunk) => {
                        data.push(chunk);
                    })
                    res.on('end', () => {
                        let result;
                        this.#params = null;
                        this.#method = null;
                        this.#headers.clear();
                        this.#body = null;
                        this.#url = null;
                        if(data.length){
                            switch (this.#responseType) {
                                case 'text': {
                                    if(data.length==1) { result=data[0].toString('utf8') }
                                    else { result = data.reduce((pValue, cValue) => pValue + cValue.toString('utf8')) }
                                    break
                                }
                                case 'blob':
                                case 'arraybuffer': {
                                    if(data.length==1) {result=data[0]}
                                    else {
                                        let totalLength=0
                                        for(let item of data){
                                            totalLength+=item.length
                                        }
                                        result = Buffer.concat(data,totalLength)
                                    }
                                    break
                                }
                                case 'json': {
                                    if(data.length==1) { result=data[0].toString('utf8') }
                                    else { result = data.reduce((pValue, cValue) => pValue + cValue.toString('utf8')) }
                                    result = JSON.parse(result);
                                    break
                                }
                                case 'document': {
                                    if(data.length==1) { result=data[0].toString('utf8') }
                                    else { result = data.reduce((pValue, cValue) => pValue + cValue.toString('utf8')) }
                                    break
                                }
                                default: {
                                    if(data.length==1) { result=data[0].toString('utf8') }
                                    else { result = data.reduce((pValue, cValue) => pValue + cValue.toString('utf8')) }
                                    break
                                }
                            }
                            resolve({data:result,success:true})
                        }else{
                            resolve({success:true})
                        }
                        this.#responseType=null;
                    });
                })
                req.on('error', (e) => {
                    console.error(e);
                    reject({success:false, err:e});
                })
                if(this.#method=='POST'||this.#method=='PUT') req.write(this.#body);
                req.end();
            } catch (e) {
                console.error('Unable send request, URL error')
                reject({success:false, err:e})
            }
        })
    }

    async #send(){
        return new Promise((resolve,reject)=>{
            this.#req.addEventListener('load',function(Request){
                this.#params = null;
                this.#method = null;
                this.#headers.clear();
                this.#body=null;
                this.#url=null;
                resolve(Request.target.response);
            }.bind(this));
            this.#req.addEventListener('error',function(err){
                reject("Error: send failed");
            }.bind(this));
            this.#req.open(this.#method,this.#url,true);
            for(let [key,value] of this.#headers){
                this.#req.setRequestHeader(key,value);
            }
            try{
                if(this.#method=='POST'||this.#method=='PUT') this.#req.send(this.#body);
                else this.#req.send(null);
            }catch(err){
                reject(err);
            }
        });
    }
}


if(typeof window ==='undefined'){
    module.exports=jax
}
export default jax


