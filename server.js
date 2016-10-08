var express = require("express");
var fs = require('fs');
var path = require('path');
var Sig = require("./sig");

const privateKeyPath = process.env.PRIVATE_KEY || "/app/private_key";
const privateKey = fs.readFileSync(path.join(privateKeyPath)).toString();
const publicKeyPath = process.env.PUBLIC_KEY || "/app/public_key";
const publicKey = fs.readFileSync(path.join(publicKeyPath)).toString();
const app = express();

app.get("/ping", function(req, res) {
  res.send("pong");
});

app.get("/sig", function(req, res) {
  var appid = req.query.appid;
  var userid = req.query.userid;
  if (!appid || !userid) {
    res.send("");
    return;
  }

  var sigUtil = new Sig({
    sdk_appid: appid,
    account_type: '0',
    private_key: privateKey,
    public_key: publicKey
  });
  var sign = sigUtil.getSig(userid);
  res.send(sign);
});

var port = 13001;
var server = process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0';
app.listen(port, server, function(err) {
  if (err) {
    console.log(err);
    return;
  }
  console.log('Listening at http://' + server + ':' + port);
});
