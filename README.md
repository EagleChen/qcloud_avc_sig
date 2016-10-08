# qcloud_avc_sig

腾讯云中[云通讯](https://console.qcloud.com/avc)的sig生成器。本项目提供docker镜像，在运行之后，直接用curl命令即可获取sig。
本项目核心代码来自[腾讯云官方论坛](http://bbs.qcloud.com/thread-17311-1-1.html)。

###如何启动
```
docker run -d -p 13001:13001 -v /tmp/private_key:/app/private_key:ro -v /tmp/public_key:/app/public_key:ro eaglechen/qcloud_avc_sig
```

###如何调用
```
curl 'localhost:13001/sig?appid=1400014111&userid=uuu'
```

###为什么要做这个镜像？
因为我用Golang开发了后端，但是坑爹的云通讯生成的private_key和public_key所用的curve(secp256k1)是golang原生不支持的。
问客服，客服不提供其他解决办法，现在甚至也不能自己上传public_key了。
