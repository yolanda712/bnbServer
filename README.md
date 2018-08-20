# bnbServer

## bnb backend using nodejs & socket.io
   Front-end using cocos-creator: [https://github.com/leviscar/bnb](https://github.com/leviscar/bnb)

## example

//统一通信接口
socket.on(msg,function(data){

});

```js
//服务端向客户端返回游戏开始信息
msg = "start"
data = {
        FPS: 30,
        mapInfo:  {
            mapName:'basicMap',
            arr: map[][],
            roleStartPointArr:  [
                new Point(18,1),
                new Point(1,22),
            ]
            monsterStartPointArr:  [
                new Point(18,22),
                new Point(1,1),
            ]
        }           
        userInfos: [
        {
            nickName:a,
            guid: 'adfafdfasdfaf',
            avatarUrl:'a',
            gender:1,
            roleIndex: 0
        }
    ]
}

//服务端向客户端返回游戏结束信息
msg = "end"
data = {
        winnerArr:['guid1','guid2'],
        loserArr:['guid3','guid4'],
        tiedArr:[]
}

// 删除房间，用户emit deleteRoom后，后端自动获得所在房间并删除所属房间 传入参数{userInfo: {guid:ssss, ...}}
msg = "deleteRoom"
//删除成功
data = {
    code:1,
    msg:'success'
}
//当前用户不属于任何房间，删除失败
data = {
    code:0,
    msg:'not existed'
}


//服务端向客户端返回房间列表信息
msg = "getRooms"
data = {
    ret: 1, 
    data:[11,21...]
}

//服务端向客户端返回所加入房间不存在，加入房间失败 传入{roomid, userInfo}
msg = "joinRoom"
data = {
    code:0,
    msg:'failed'
}

//服务端向客户端发送再来一局信息 传入{roomid, userInfo}
msg = "playAgain"
data = {
    code:1,
    msg:'success',
    userInfos: [
        {}
    ]
}

// 广播房间信息
msg = "roomInfo"
//建房成功
data = {
    code:1,
    userInfos:[
        {
            nickName:a,
            guid:'12312313',
            avatarUrl:'a',
            gender:1
        }
    ]
}
//建房失败 传入{name, userInfo}    name:roomName
data = {
    code:0,
    msg:'failed'
}

// 服务端按FPS向客户端发送游戏当前信息
msg = "roleInfo"
data = [{
            roleGuid: '123123123123',
            position:{
                x:32,
                y:32
            },
            gameTime:60,
            score:100
        },
        {
            roleGuid: '123123123123',
            position:{
                x:128,
                y:128
            },
            gameTime:60,
            score:100
        }] 

//服务端向客户端返回小怪物信息
msg = "monsterInfo"
data =  [{
            monsterIndex: 0,
            name:monster0,
            position:{
                x:64,
                y:64
            },
        },
        {
            monsterIndex: 1,
            name:monster1,
            position:{
                x:128,
                y:128
            },
        }]

// 服务端向客户端返回新放泡泡信息
msg = "paopaoCreated"
data = {
    roleGuid: 'asdfadsfasdfa',
    position:{
        x:32,
        y:32
    }
}

// 服务端向客户端返回泡泡爆炸信息，包括爆炸范围数组，爆炸箱子坐标数组，爆炸泡泡数组，生成的道具数组
msg = "boomInfo"
data = {
    boomXYArr:[
                {x:1,y:2},
                {x:1,y:3}
            ],
    boomBoxArr:[
                {x:1,y:1},
                {x:1,y:4}
            ],
    boomPaopaoArr:[
        {x:1,y:2}
    ],
    itemArr:[
        {x:1,y:1,itemCode:101},
        {x:1,y:4,itemCode:102}
    ]
}

// 服务端向客户端返回道具被吃信息
msg = "itemEaten"
data = {
    x:1,
    y:1,
    roleGuid:'adfadfasdfads',
    itemCode:101
}

//服务端向客户端返回人物被炸信息
msg = "roleBoom"
data = {
    x:1, 
    y:1, 
    roleGuid:'asdfkjads;fajldfj'
}

//服务端向客户端返回小怪物被炸信息
msg = "monsterBoom"
data = {
    x:64,
    y:64,
    name:monster0
}


```

## 概要设计

经过一周的调研及POC验证，我们最终采用 CocosCreator + NodeJS + SocketIO 作为我们的技术栈来实现游戏需求，前端页面渲染及用户操作捕捉通过CocosCreator实现，所有游戏运行逻辑及游戏房间管理由NodeJS后端实现。前后端各自独立并通过基于Websocket协议(WS)的SocketIO库实现实时数据通信，WS协议允许服务端主动地向客户端推送数据请求。

CocosCreator是Cocos游戏团队与微信团队合作推出的一款微信小游戏引擎，通过它可以快速的搭建游戏前端页面逻辑，并可快速打包发布到微信小游戏平台。通过CocosCreator，我们实现了基本的游戏界面显示及跳转逻辑，并通过设计摇杆等控件捕捉到了用户的实时操作并将其传输给后台Node服务器，Node服务器处理后再返回实时游戏信息给前台进行渲染。

NodeJS作为后端，实现了所有的游戏业务逻辑，如游戏角色的移动、泡泡的放置与爆炸、地图及道具信息管理等。后端接收到前台用户传来的上、下、左、右及泡泡按键信息后，实时地运算最新游戏数据，并返回给前台渲染。具体的游戏过程如图所示。

![avatar](/doc/createRoom.png)
![avatar](/doc/userControl.png)

除此之外，我们还接入了微信官方提供的API来获得用户信息，如昵称、头像、性别等信息。调用微信的开放数据域接口来存储用户的胜场信息并以此来计算排行榜。用户在游戏中可以看到自己在所有好友中的游戏排名。

## 原型部署

Front-end using cocos-creator: [https://github.com/leviscar/bnb](https://github.com/leviscar/bnb)

Back-end using nodejs & socket.io: [https://github.com/yolanda712/bnbServer](https://github.com/yolanda712/bnbServer)

原型实现后，我们将前端游戏界面发布到了微信公众平台和Web端上，用户可以扫码进行试玩（暂时需要管理员设置体验者权限，微信号：xietiandi93），也可以直接登录 https://www.x-lab.ac 进行体验，网页版和微信端可以一起进行对战。

NodeJS后端被打包成了Docker镜像，部署在了远程腾讯云服务器上（1核，1M带宽，2G内存）。通过域名访问，我们的微信端和网页端均可成功连接到后台服务器。为了监控后台服务器的实时性能消耗，我们还搭建了一套开源Docker性能监控工具（cAdvisor + Prometheus + Grafana），可以通过 https://www.x-lab.ac/monitor 进行访问，首次进入较慢，用户名密码 admin/admin。整体部署图如下所示：

![avatar](/doc/deploy.png)
![avatar](/doc/grafana.png)