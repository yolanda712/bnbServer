# 天帝泡泡堂 —— 设计文档

## 项目需求

1. 微信小游戏
2. 双人对战（开房间，分享点击进入，房间号进入）
3. 炸死立即结束，没死定时60s结束，计分判定胜利（得分：炸墙，吃道具）
4. 没有闯关
5. 道具有： 增加炸弹威力、增加炸弹个数、移动加速5s
6. 出生点为地图对角线
7. 实时显示双方分数和道具状态
8. 战绩炫耀、再来一局、好友战绩排行
9. 可选需求：增加野怪

## 游戏成果概览

## 架构概要设计

经过一周的调研及POC验证，我们最终采用 CocosCreator + NodeJS + SocketIO 作为技术栈来实现游戏需求。前端页面渲染及用户操作捕捉通过CocosCreator实现，而所有游戏运行逻辑及游戏房间管理由NodeJS后端完成。前后端各自独立并通过基于Websocket协议(WS)的SocketIO库进行实时数据通信，WS协议允许服务端主动地向客户端推送数据请求。

CocosCreator是Cocos游戏团队与微信团队合作推出的一款微信小游戏引擎，通过它可以快速的搭建游戏前端页面逻辑，并可快速打包发布到微信小游戏平台。通过CocosCreator，我们实现了基本的游戏界面显示及跳转逻辑，并通过设计摇杆等控件捕捉到了用户的实时操作并将其传输给后台Node服务器，Node服务器处理后再返回实时游戏信息给前台进行渲染。

NodeJS作为后端，实现了所有的游戏业务逻辑，如游戏角色的移动、泡泡的放置与爆炸、地图及道具信息管理等。后端接收到前台用户传来的上、下、左、右及泡泡按键信息后，实时地运算最新游戏数据，并返回给前台渲染。游戏过程如下图所示。

![avatar](/doc/createRoom.png)
![avatar](/doc/userControl.png)

### 时序图

用户创建房间、加入房间时序图：
![avatar](/doc/room_sq.png)

后台响应开始游戏请求时序图：
![avatar](/doc/start_sq.png)

### 活动图

后台响应前端操作过程如下图所示：
![avatar](/doc/key_activity.png)

游戏角色放置泡泡炸弹过程如下图所示：
![avatar](/doc/paopao_activity.png)

### 微信API
除此之外，我们还接入了微信官方提供的API来获得用户信息，如昵称、头像、性别等信息。调用微信的开放数据域接口来存储用户的胜场信息并以此来计算排行榜。用户在游戏中可以看到自己在所有好友中的游戏排名。

1. 微信授权

    [https://developers.weixin.qq.com/minigame/dev/document/open-api/authorize/wx.authorize.html](https://developers.weixin.qq.com/minigame/dev/document/open-api/authorize/wx.authorize.html)  

    `wx.authorize(Object object)`

    提前向用户发起授权请求。调用后会立刻弹窗询问用户是否同意授权小程序使用某项功能或获取用户的某些数据。

2. 微信登陆

    [https://developers.weixin.qq.com/minigame/dev/document/open-api/login/wx.login.html](https://developers.weixin.qq.com/minigame/dev/document/open-api/login/wx.login.html)  

    `wx.login(Object object)`

    调用接口获取登录凭证（code）进而换取用户登录态信息

3. 通过微信开放域获得好友数据

    [https://developers.weixin.qq.com/minigame/dev/tutorial/open-ability/open-data.html](https://developers.weixin.qq.com/minigame/dev/tutorial/open-ability/open-data.html)

    `wx.getFriendCloudStorage()`

    获取当前用户也玩该小游戏的好友的用户数据

## 原型部署

Front-end using cocos-creator: [https://github.com/leviscar/bnb](https://github.com/leviscar/bnb)

Back-end using nodejs & socket.io: [https://github.com/yolanda712/bnbServer](https://github.com/yolanda712/bnbServer)

原型实现后，我们将前端游戏界面发布到了微信公众平台和Web端上，用户可以扫码进行试玩（暂时需要管理员设置体验者权限，微信号：xietiandi93），也可以直接登录 https://www.x-lab.ac 进行体验，网页版和微信端可以一起进行对战。

![avatar](/doc/deploy.png)

NodeJS后端被打包成了Docker镜像，部署在了远程腾讯云服务器上（1核，1M带宽，2G内存）。通过域名访问，我们的微信端和网页端均可成功连接到后台服务器。为了监控后台服务器的实时性能消耗，我们还搭建了一套开源Docker性能监控工具（cAdvisor + Prometheus + Grafana），可以通过 https://www.x-lab.ac/monitor 进行访问，首次进入较慢，用户名密码 admin/admin。整体部署图如下所示：

![avatar](/doc/grafana.png)