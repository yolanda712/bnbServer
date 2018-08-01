var TDMap = require('./tdMap')
var Role = require('./tdRole')
var constants = require('./tdConst')
var Rooms = require('./tdRoom')
var TDMonster = require('./tdMonster')
var TDRoom = Rooms.TDRoom;

// 根据FPS向客户端发送人物角色信息的回调
var clientCallback = function(game){
    if(game){
        var msg = [];
        for(index in game.roleArr){
            role = game.roleArr[index];
            msg.push(
                {
                    roleIndex: role.roleIndex,
                    // name: role.name,
                    guid: role.guid,
                    nickName: role.nickName,
                    // avatarUrl: role.avatarUrl,
                    position:{
                        x:role.position.x,
                        y:role.position.y
                    },
                    gameTime:game.gameTime,
                    score:role.score
                })
        }
        game.broadcastMsg("roleInfo",msg);
        console.log(msg);
    }
};

//根据FPS向客户端发送monster信息的回调
var monsterCallback = function(game){
    if(game){
        var monsterMsg = [];
        for(index in game.monsterArr){
            monster = game.monsterArr[index];
            monsterMsg.push(
                {
                    monsterIndex: monster.monsterIndex,
                    name:monster.name,
                    position:{
                        x:monster.position.x,
                        y:monster.position.y
                    },
                   
                })
        }
        game.broadcastMsg("monsterInfo",monsterMsg);
        // console.log(monsterMsg);
    }
};

//主游戏入口
var TDGame = function (serverSocketIO, roomName) {
    this.io = serverSocketIO;
    this.roomName = roomName;
    this.userInfos = [];
    this.tdMap = new TDMap();
    this.roleArr = [];
    this.guidRoleIndexMap = {};
    this.paopaoArr = [];
    this.itemArr = [];
    this.monsterArr = [];

    this.FPS = 30;
    this.playerCount = 0;
    this.winner = null;
    this.gameTime = constants.GAME_TIME;
    this.monsterCount = this.tdMap.monsterStartPointArr.length;

    this.gameInfoInterval = null;
    this.timer = null;

    // this.tdMonster = null;
}

TDGame.prototype.addPlayer = function(userInfo){
    this.userInfos.push(userInfo);
    this.playerCount++;
}

TDGame.prototype.createANewRole = function(userInfo){
    var existedRoleNum = this.roleArr.length;
    if(this.tdMap.roleStartPointArr.length > existedRoleNum){
       var startPosition = this.tdMap.roleStartPointArr[existedRoleNum];
       var cocosPosition = this.tdMap.convertMapIndexToCocosAxis(this.tdMap.getYLen(), startPosition.x, startPosition.y);
     
       var newRole = new Role(existedRoleNum,userInfo.guid,this,userInfo);
       newRole.setPosition(cocosPosition.x, cocosPosition.y);
       newRole.setMap(this.tdMap);
       this.roleArr.push(newRole);

       this.guidRoleIndexMap[userInfo.guid] = this.roleArr.length-1;
    }
    
}

TDGame.prototype.createMonster = function(){
    //小怪物从monster0开始命名
    var monsterIndex = this.monsterArr.length;
    var monsterName = "monster"+this.monsterArr.length;
    var newMonster = new TDMonster(monsterIndex,monsterName,this);
    newMonster.setMap(this.tdMap);
    var startPosition = this.tdMap.monsterStartPointArr[monsterIndex];
    var cocosPosition = this.tdMap.convertMapIndexToCocosAxis(this.tdMap.getYLen(), startPosition.x, startPosition.y);
    newMonster.setPosition(cocosPosition.x, cocosPosition.y);
    this.monsterArr.push(newMonster);
}

TDGame.prototype.startGame = function(){
    //create player roles
    for(var i=0; i<this.playerCount; i++){
        this.createANewRole(this.userInfos[i]);
    }

    for(var j=0; j<this.monsterCount; j++){
        this.createMonster();
    }

    var mapInfo = {
        mapName:'basicMap',
        arr: this.tdMap.map
    };
    this.broadcastMsg('start',{
        FPS: this.FPS,
        mapInfo: mapInfo,
        userInfos: this.userInfos
    });
    console.log(mapInfo);

    var self = this;
    this.timer = setInterval(function(){
        self.countTime();
    }, 1000); 

    this.gameInfoInterval = setInterval(function(){
        clientCallback(self);
        monsterCallback(self);
    },1000/this.FPS);

    for(var k=0; k<this.monsterArr.length; k++){
        this.monsterArr[k].currentDirection = this.monsterArr[k].findDirection();
        this.monsterArr[k].move();
    }
    // this.monsterArr[0].move();
}

TDGame.prototype.stopGameIntervals = function(){
    clearInterval(this.timer);
    clearInterval(this.gameInfoInterval);
    // for(var i=0; i<this.monsterArr.length; i++){
    //     clearInterval(this.monsterArr[i].moveInterval)
    // }
}

TDGame.prototype.stopGame = function(){
    console.log('end');
    //客户端结束
    var winner = null;
    // var masterRole = this.roleArr[0];
    // var challengerRole = this.roleArr[1];
    // if((masterRole.isDead && challengerRole.isDead) || 
    // (!masterRole.isDead && !challengerRole.isDead)){
    //     if(masterRole.score > challengerRole.score){
    //         winner = masterRole.nickName + ' 获胜!';
    //     }else if(masterRole.score == challengerRole.score){
    //         winner = '平局!';
    //     }else{
    //         winner = challengerRole.nickName + ' 获胜!';
    //     }
    // }else if(!masterRole.isDead && challengerRole.isDead){
    //     winner = masterRole.nickName + ' 获胜!';
    // }else if(masterRole.isDead && !challengerRole.isDead){
    //     winner = challengerRole.nickName + ' 获胜!';
    // }
    // console.log("!!!!!!!!!!"+winner);
    this.broadcastMsg('end',winner);

    try{
        var socketRoom = this.io.sockets.adapter.rooms[this.roomName];
        var sockets = socketRoom.sockets;
        var socketIds = Object.keys(sockets);
    
        // TODO socket退出房间，之后要换位置
        for(var i=0;i<socketIds.length;i++){
            var socket = this.io.sockets.sockets[socketIds[i]];
            socket.leave(this.roomName);
        }
    }catch(error){
        console.log(error);
    }
    

    TDRoom.deleteRoom(this.roomName);
}

TDGame.prototype.broadcastMsg = function(msg, data){
    this.io.to(this.roomName).emit(msg,data);
}

TDGame.prototype.countTime = function(){
    if(this.gameTime > 0){
        console.log(this.gameTime);
        this.gameTime--;
    }else{
        this.stopGame();
    }
}

TDGame.prototype.moveARoleByAngle = function(angle,role){
    role.mobileMove(angle);
}

TDGame.prototype.moveARoleByKeyCode = function(key, role){
    switch (key) {
        //W键,向上移动     
        case constants.KEY_CODE.W:
            // role.move(Direction.Up);
            role.mobileMove(90);
            break;
        //A键,向左移动
        case constants.KEY_CODE.A:
            // role.move(Direction.Left);
            role.mobileMove(180);
            break;
            //S键,向下移动
        case constants.KEY_CODE.S:
            // role.move(Direction.Down);
            role.mobileMove(-90);
            break;
        //D键,向右移动
        case constants.KEY_CODE.D:
            // role.move(Direction.Right);
            role.mobileMove(0);
            break;
        case constants.KEY_CODE.J:
            role.createPaopao();
            break;
    }
}

TDGame.prototype.stopARoleByKeyCode = function(key, role){
    role.mobileStop();
    switch (key) {  
        case constants.KEY_CODE.W:
            // role.stop(Direction.Up);
            break;
        case constants.KEY_CODE.A:
            // role.stop(Direction.Left);
            break;
        case constants.KEY_CODE.S:
            // role.stop(Direction.Down);
            break;
        case constants.KEY_CODE.D:
            // role.stop(Direction.Right);
            break;
    }
}

TDGame.prototype.monsterMeetRole = function(){
    for(var i=0; i<this.monsterArr.length ;i++){
        for(var j=0; j<this.roleArr.length ;j++){
            var monsterPos = this.monsterArr[i].getMapLocation(this.monsterArr[i].position.x,this.monsterArr[i].position.y);
            var rolePos = this.roleArr[i].getMapLocation(this.roleArr[j].position.x,this.roleArr[j].position.y);
            if(!this.monsterArr[i].isDead && monsterPos.equals(rolePos)){
                 for(var k=0; k<this.monsterArr.length; k++){
                        clearInterval(this.monsterArr[k].moveInterval)
                    }
                this.roleArr[j].roleBoom();
            }
        }
    }
}

TDGame.prototype.isGameFullOfPlayers = function(){
    return this.playerCount>=this.tdMap.roleStartPointArr.length;
}

module.exports = TDGame;
