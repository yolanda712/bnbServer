var TDMap = require('./tdMap');
var Role = require('./tdRole');
var constants = require('./tdConst')
var Direction = constants.Direction;
var Rooms = require('./tdRoom');
var TDMonster = require('./tdMonster');
var TDRoom = Rooms.TDRoom;


//主游戏入口
var TDGame = function (serverSocketIO, roomName) {
    this.io = serverSocketIO;
    this.roomName = roomName;
    this.userInfos = [];
    this.tdMap = new TDMap();
    this.roleArr = [];
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
       var role = null;
       if(existedRoleNum == 0){
           role = 'master';
       }else{
           role = 'challenger';
       }
       var newRole = new Role(existedRoleNum,role,this,userInfo);
       newRole.setPosition(cocosPosition.x, cocosPosition.y);
       newRole.setMap(this.tdMap);
       this.roleArr.push(newRole);
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

    this.monsterArr = [];
    for(var j=0; j<this.monsterCount; j++){
        this.createMonster();
    }

    var mapInfo = {
        mapName:'basicMap',
        arr: this.tdMap.map,
        roleStartPointArr: this.tdMap.roleStartPointArr,
        monsterStartPointArr: this.tdMap.monsterStartPointArr
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
}

TDGame.prototype.stopGameIntervals = function(){
    clearInterval(this.timer);
    clearInterval(this.gameInfoInterval);
}

TDGame.prototype.stopGame = function(){
    console.log('end');
    //客户端结束
    var msg = {winner:0, isTied:true};
    var masterRole = this.roleArr[0];
    var challengerRole = this.roleArr[1];
    // TODO 角色不应该写死个数
    if(!challengerRole) challengerRole = masterRole;
    var winner = findWinner(masterRole,challengerRole);
    if(winner){
        msg = {winner:winner.guid, isTied:false};
    }
    console.log("game over" + msg);
    this.broadcastMsg('end',msg);

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
            role.move(Direction.Up);
            break;
        //A键,向左移动
        case constants.KEY_CODE.A:
            role.move(Direction.Left);
            break;
        //S键,向下移动
        case constants.KEY_CODE.S:
            role.move(Direction.Down);
            break;
        //D键,向右移动
        case constants.KEY_CODE.D:
            role.move(Direction.Right);
            break;
        case constants.KEY_CODE.J:
            role.createPaopao();
            break;
    }
}

TDGame.prototype.stopARoleByKeyCode = function(key, role){
    switch (key) {  
        case constants.KEY_CODE.W:
            role.stop(Direction.Up);
            break;
        case constants.KEY_CODE.A:
            role.stop(Direction.Left);
            break;
        case constants.KEY_CODE.S:
            role.stop(Direction.Down);
            break;
        case constants.KEY_CODE.D:
            role.stop(Direction.Right);
            break;
    }
}

TDGame.prototype.monsterMeetRole = function(){
    for(var i=0; i<this.monsterArr.length ;i++){
        for(var j=0; j<this.roleArr.length ;j++){
            var monsterPos = this.monsterArr[i].getMapLocation(this.monsterArr[i].position.x,this.monsterArr[i].position.y);
            var rolePos = this.roleArr[j].getMapLocation(this.roleArr[j].position.x,this.roleArr[j].position.y);
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

// 根据FPS向客户端发送人物角色信息的回调
var clientCallback = function(game){
    if(game){
        var msg = [];
        for(index in game.roleArr){
            role = game.roleArr[index];
            msg.push(
                {
                    roleIndex: role.roleIndex,
                    name: role.name,
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

var findWinner = function(masterRole, challengerRole){
    var winner = null;
    if((masterRole.isDead && challengerRole.isDead)
        || (!masterRole.isDead && !challengerRole.isDead)){
            winner = findWinnerByScore(masterRole,challengerRole);
    }else {
        winner = masterRole.isDead ? challengerRole : masterRole;
    }
    return winner;
}

var findWinnerByScore = function(masterRole, challengerRole){
    var winner = null;
    if(masterRole.score === challengerRole.score){
        return winner;
    }else{
        winner = masterRole.score > challengerRole.score? masterRole : challengerRole;
        return winner;
    }
}

module.exports = TDGame;
