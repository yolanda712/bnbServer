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