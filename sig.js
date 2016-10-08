var crypto = require('crypto');
var zlib = require('zlib');

var base64url = {};

base64url.unescape = function unescape (str) {
    return (str + new Array(5 - str.length % 4))
        .replace(/_/g, '=')
        .replace(/\-/g, '/')
        .replace(/\*/g, '+');
};

base64url.escape = function escape (str) {
    return str.replace(/\+/g, '*')
        .replace(/\//g, '-')
        .replace(/=/g, '_');
};

base64url.encode = function encode (str) {
    return this.escape(new Buffer(str).toString('base64'));
};

base64url.decode = function decode (str) {
    //modified by nate
    return new Buffer(this.unescape(str), 'base64');
};

/**
* 下列接口提供了初始化，生成 sig 和校验 sig 的功能，可以直接使用
*/
var Sig = function(config){
    this.sdk_appid  = config.sdk_appid;
    this.account_type = config.account_type;
    this.appid_at_3rd= config.appid_at_3rd || config.sdk_appid;
    this.expire_after = (config.expire_after || 30 * 24 * 3600).toString();
    this.version = config.version || '201604290000';
    this.private_key = config.private_key;
    this.public_key = config.public_key;
};


Sig.prototype.setAppid = function(appid){
    this.sdk_appid = appid;
};

Sig.prototype.setPrivateKey = function(private_key){
    this.private_key = private_key;
};

Sig.prototype.setPublicKey = function(public_key){
    this.public_key = public_key;
};

/**
* ECDSA-SHA256签名
* @param string $data 需要签名的数据
* @return string 返回签名 失败时返回false
*/
Sig.prototype._sign = function(str){
    //modified by nate
    var signer = crypto.createSign('sha256');
    signer.update(str);
    return signer.sign(this.private_key);
};

/**
* 验证ECDSA-SHA256签名
* @param string $data 需要验证的数据原文
* @param string $sig 需要验证的签名
* @return int 1验证成功 0验证失败
*/
Sig.prototype._verify = function(str, signture){
    //modified by nate
    var verify = crypto.createVerify('sha256');
    verify.update(str);
    var result = verify.verify(this.public_key, signture);
    return result;
};

/**
* 根据json内容生成需要签名的buf串
* @param array $json 票据json对象
* @return string 按标准格式生成的用于签名的字符串
* 失败时返回false
*/
Sig.prototype._genSignContent = function(obj){
    var arr = [
        'TLS.appid_at_3rd',
        'TLS.account_type',
        'TLS.identifier',
        'TLS.sdk_appid',
        'TLS.time',
        'TLS.expire_after'
    ];

    var ret = '';
    for (var i = 0; i < arr.length; i++) {
        ret += arr[i] + ':' + obj[arr[i]] + '\n';
    }

    return ret;
};

/**
* 生成 usersig
* @param string $identifier 用户名
* @return string 生成的失败时为false
*/
Sig.prototype.getSig = function(identifier){
    //modified by nate
    var obj = {
        'TLS.account_type': '0',
        'TLS.identifier': identifier,
        'TLS.appid_at_3rd': '0',
        'TLS.sdk_appid': this.sdk_appid,
        'TLS.expire_after': this.expire_after,
        'TLS.version': this.version,
        'TLS.time': (Math.floor(Date.now()/1000)).toString()
    };
    //modified by nate
    var content = this._genSignContent(obj);
    var signature = this._sign(content);
    obj['TLS.sig'] = new Buffer(signature).toString('base64');

    var text = JSON.stringify(obj);
    var compressed = zlib.deflateSync(new Buffer(text));
    return base64url.encode(compressed);
};

/**
* 验证usersig
* @param type $sig usersig
* @param type $identifier 需要验证用户名
* @return false 失败，true 成功
*/
Sig.prototype.verifySig = function(sig, identifier) {
    try {
        //modified by nate
        var compressed = base64url.decode(sig);
        var text = zlib.inflateSync(compressed).toString();
        var json = JSON.parse(text);
        if (json['TLS.identifier'] !== identifier) {
            return false;
        }
        var signature = new Buffer(json['TLS.sig'], 'base64');
        var content = this._genSignContent(json);
        return this._verify(content, signature);

    } catch (e) {
        return false;
    }
};

module.exports = Sig;
