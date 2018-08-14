var Map = require('./Map');
var Role = require('./Role');
var constants = require('./Const/GameConst')
var Direction = constants.Direction;
var Rooms = require('./Room');
var Monster = require('./Monster');
var Box = require('./Box');
var Point = require('./Point')
var Room = Rooms.Room;
var utils = require('../utils');
var ObjectPool = require('./ObjectPool');

/**
 * Game类，主游戏入口，所有的游戏逻辑都涵盖于此
 *
 * @param {ServerIO} serverSocketIO
 * @param {string} roomName
 */
var Game = function (serverSocketIO, roomName) {
    this.io = serverSocketIO;
    this.roomName = roomName;
    this.userInfos = [];
    this.userGuidRoleIndexMap = {};
    this.map = new Map();
    this.roleArr = [];
    this.paopaoArr = [];
    this.itemArr = [];
    this.monsterArr = [];
    this.boxArr = [];

    this.FPS = constants.GAME_FPS;
    this.playerCount = 0;
    // 处理断线玩家计数
    this.playingPlayerCount = 0;
    this.winner = null;
    this.dieSequenceArr = [];
    this.gameTime = constants.GAME_TIME;
    this.monsterCount = this.map.monsterStartPointArr.length;

    this.gameInfoInterval = null;
    this.timer = null;
    this.isRunning = false;
    this.isRoomValidInterval  = null;
    
    //泡泡对象池
    this.paopaoPool = null;
    //删除失效的房间
    this.isRoomValid(roomName);
}

/**
 * 开始游戏，包括初始化角色，向前台emit开始消息等
 *
 */
Game.prototype.startGame = function(){ 
    if(this.isRunning) return;
    this.isRunning = true;   
    this.initRolesAndMonsters();
    this.broadcastGameStartMsg();
    this.generateBox();

    var self = this;
    this.timer = setInterval(function(){
        self.countTime();
    }, 1000); 

    this.gameInfoInterval = setInterval(function(){
        clientCallback(self);
        monsterCallback(self);
    },1000/this.FPS);

    for(var k=0; k<this.monsterArr.length; k++){
        this.monsterArr[k].currentDirection = this.monsterArr[k].findRandomDirection();
        this.monsterArr[k].move();
    }

    //初始化泡泡对象池
    this.paopaoPool = new ObjectPool();
}

/**
 * 结束游戏方法，若有玩家断线会有loser参数，否则根据死亡状态和积分判断胜负
 *
 * @param {string} loser
 */
Game.prototype.stopGame = function(){
    // if(!this.isRunning) return;
    console.log('end');
    this.stopGameIntervals();
    //客户端结束
    var winnerArr = [];
    var loserArr = [];
    var tiedArr = [];

    var playGuidArr = Object.keys(this.userGuidRoleIndexMap);
    var aliveArr = diffTwoArray(playGuidArr, this.dieSequenceArr);
    var msg = this.findWinner(aliveArr, this.dieSequenceArr);    

    this.broadcastMsg('end',msg);
    this.paopaoPool.destroy();
    utils.clearSocketsByRoomName(this.io, this.roomName);
    Room.deleteRoom(this.roomName);
}

/**
 * arr1包含arr2所有对象，获取arr1中多于arr2的元素
 *
 * @param {Array[String]} arr1
 * @param {Array[String]} arr2
 * @returns Array[String]
 */
var diffTwoArray = function(arr1, arr2){
    var diffArr = [];
    for(var i=0; i<arr1.length; i++){
        if(arr2.indexOf(arr1[i]) === -1){
            diffArr.push(arr1[i]);
        }
    }
    return diffArr;
}

Game.prototype.addPlayer = function(userInfo){
    if(!this.isGameFullOfPlayers()){
        if(this.userInfos.length < this.map.roleStartPointArr.length){
            this.userInfos.push(userInfo);
        }else{
            for(var i = 0; i < this.userInfos.length; i++){
                if(this.userInfos[i] === null){
                    this.userInfos[i] = userInfo;
                    break;
                }
            }
        }
        this.playerCount++;
        return true;
    }   
    return false;
}

Game.prototype.removePlayer = function(userInfo){
    var guid = userInfo.guid;
    for(var i = 0; i < this.userInfos.length; i++){
        if(!this.userInfos[i]) continue;
        if(this.userInfos[i].guid === guid){
            this.userInfos[i] = null;
            this.playerCount--;
            return true;
        }
    }
    return false;
}

Game.prototype.createANewRole = function(userInfo){
    if(!userInfo){
        return;
    }
    var existedRoleNum = this.roleArr.length;
    if(this.map.roleStartPointArr.length > existedRoleNum){
       var startPosition = this.map.roleStartPointArr[existedRoleNum];
       var cocosPosition = this.map.convertMapIndexToCocosAxis(this.map.getYLen(), startPosition.x, startPosition.y);
       var newRole = new Role(this,userInfo);
       newRole.setPosition(cocosPosition.x, cocosPosition.y);
       newRole.setMap(this.map);
       this.roleArr.push(newRole);
       this.userGuidRoleIndexMap[userInfo.guid] = existedRoleNum;
       userInfo.roleIndex = existedRoleNum;
       this.playingPlayerCount++;
    }
}

Game.prototype.createMonster = function(){
    //小怪物从monster0开始命名
    var monsterIndex = this.monsterArr.length;
    var monsterName = "monster"+this.monsterArr.length;
    var newMonster = new Monster(monsterIndex,monsterName,this);
    newMonster.setMap(this.map);
    var startPosition = this.map.monsterStartPointArr[monsterIndex];
    var cocosPosition = this.map.convertMapIndexToCocosAxis(this.map.getYLen(), startPosition.x, startPosition.y);
    newMonster.setPosition(cocosPosition.x, cocosPosition.y);
    this.monsterArr.push(newMonster);
    console.log("monster created at"+cocosPosition);
}

Game.prototype.generateBox = function(){
    for(var i=0; i<this.map.map.length; i++){
        for(var j=0; j<this.map.map[i].length; j++){
            var mapValue = this.map.getValue(i,j);
            if(!this.boxArr[i])
                this.boxArr[i]=[];
            if(0 < mapValue && mapValue < 4){
                var newBox = new Box(mapValue,new Point(i,j),this.map);
                this.boxArr[i][j] = newBox;
            }
        }
    }
}

/**
 * 初始化游戏角色和怪物
 *
 */
Game.prototype.initRolesAndMonsters = function(){
    //create player roles
    for(var i=0; i<this.userInfos.length; i++){
        this.createANewRole(this.userInfos[i]);
    }

    this.monsterArr = [];
    for(var j=0; j<this.monsterCount; j++){
        this.createMonster();
    }
}

Game.prototype.broadcastGameStartMsg = function(){
    var self = this;
    var roleStartPointArr = this.map.roleStartPointArr.map(function (point) {  
        var newPoint = self.map.convertMapIndexToCocosAxis(self.map.getYLen(),point.x,point.y);
        return newPoint;  
    });
    var monsterStartPointArr = this.map.monsterStartPointArr.map(function (point) {  
        var newPoint = self.map.convertMapIndexToCocosAxis(self.map.getYLen(),point.x,point.y);
        return newPoint;  
    });

    var mapInfo = {
        mapName:'basicMap',
        arr: this.map.map,
        roleStartPointArr: roleStartPointArr,
        monsterStartPointArr: monsterStartPointArr
    };
    this.broadcastMsg('start',{
        FPS: this.FPS,
        mapInfo: mapInfo,
        userInfos: this.userInfos
    });
    console.log(mapInfo);
}

Game.prototype.stopGameIntervals = function(){
    clearInterval(this.timer);
    clearInterval(this.gameInfoInterval);
    clearInterval(this.isRoomValidInterval);
}

Game.prototype.broadcastMsg = function(msg, data){
    this.io.to(this.roomName).emit(msg,data);
}

Game.prototype.countTime = function(){
    if(this.gameTime > 0){
        console.log(this.gameTime);
        this.gameTime--;
        this.checkGameOver();
    }else{
        this.stopGame();
    }
}

Game.prototype.checkGameOver = function(){
    var gameOverNum = 1;
    if(this.playingPlayerCount < 1){
        this.stopGame();
        return;
    }
    if(this.playerCount > 1) gameOverNum = this.playerCount - 1;
    if(this.dieSequenceArr.length >= gameOverNum){
        this.stopGame();
    }
}

Game.prototype.moveARoleByAngle = function(angle,role){
    role.mobileMove(angle);
}

Game.prototype.moveARoleByKeyCode = function(key, role){
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

Game.prototype.stopAMobileRole = function(role){
    role.mobileStop();
}

Game.prototype.removeAPlayingPlayer = function(){
    if(this.playingPlayerCount > 0){
        this.playingPlayerCount--;
    }
}

Game.prototype.stopARoleByKeyCode = function(key, role){
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

Game.prototype.monsterMeetRole = function(){
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

Game.prototype.isGameFullOfPlayers = function(){
    return this.isRunning || (this.playerCount >= this.map.roleStartPointArr.length);
}

// 根据FPS向客户端发送人物角色信息的回调
var clientCallback = function(game){
    if(game){
        var msg = [];
        for(index in game.roleArr){
            role = game.roleArr[index];
            msg.push(
                {
                    roleGuid: role.guid,
                    position:{
                        x:role.position.x,
                        y:role.position.y
                    },
                    gameTime:game.gameTime,
                    score:role.score
                })
        }
        game.broadcastMsg("roleInfo",msg);
        // console.log(msg);
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
        if(this.monsterCount!=0){
            game.broadcastMsg("monsterInfo",monsterMsg);
        }
    }
};

Game.prototype.findWinner = function(aliveArr, diedArr){
    var winnerArr = [];
    var loserArr = [];
    var tiedArr = [];
    var msg = {
        winnerArr:winnerArr,
        loserArr:loserArr,
        tiedArr:tiedArr
    }
    if(this.playerCount === 1){
        msg.tiedArr.push(this.roleArr[0].guid);
    }else if(aliveArr.length !== 0 && diedArr.length !== 0){
        msg.loserArr = msg.loserArr.concat(diedArr);
        var scoreMsg = this.findWinnerByScore(aliveArr);
        msg.loserArr = msg.loserArr.concat(scoreMsg.loserArr);
        msg.winnerArr = msg.winnerArr.concat(scoreMsg.winnerArr);
    }else if(diedArr.length === 0){
        msg = this.findWinnerByScore(aliveArr);
        if(msg.winnerArr.length === this.playerCount){
            msg.tiedArr = [].concat(msg.winnerArr);
            msg.winnerArr = [];
        }
    }else if(aliveArr.length === 0){
        msg.winnerArr.push(diedArr[diedArr.length-1]);
        for(var i = 0; i<diedArr.length - 1; i++){
            msg.loserArr.push(diedArr[i]);
        }
    }
    return msg;
}

Game.prototype.findWinnerByScore = function(aliveArr){
    var winnerArr = [];
    var loserArr = [];
    var tiedArr = [];
    var msg = {
        winnerArr:winnerArr,
        loserArr:loserArr,
        tiedArr:tiedArr
    }
    if(aliveArr.length === 1){
        msg.winnerArr = msg.winnerArr.concat(aliveArr);
        return msg;
    }else{
        var maxScore = -1;
        for(var i=0; i<aliveArr.length; i++){
            var guid = aliveArr[i];
            var roleIndex = this.userGuidRoleIndexMap[guid];
            var score = this.roleArr[roleIndex].score;
            if(score > maxScore){
                maxScore = score;
                msg.loserArr = msg.loserArr.concat(msg.winnerArr);
                msg.winnerArr = [];
                msg.winnerArr.push(guid);
            }else if(score === maxScore){
                msg.winnerArr = msg.winnerArr.concat(guid);
            }else{
                msg.loserArr = msg.loserArr.concat(guid);
            }
        }
        return msg;
    }
}

/**
 * 删除失效的房间
 * @param {String} roomName 
 */
Game.prototype.isRoomValid = function(roomName){
    var self = this;
    this.isRoomValidInterval = setInterval(function(){
        try{
            var socketRoom = self.io.sockets.adapter.rooms[roomName];
            if(!socketRoom || Object.keys(socketRoom.sockets).length == 0){
                Room.deleteRoom(roomName);
            }
        }catch(error){
            console.log(error);
        }
        
    },constants.DELET_INVALID_ROOM);
}

module.exports = Game;