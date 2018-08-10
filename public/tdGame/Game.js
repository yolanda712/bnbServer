var Map = require('./Map');
var Role = require('./Role');
var constants = require('./Const')
var Direction = constants.Direction;
var Rooms = require('./Room');
var Monster = require('./Monster');
var Box = require('./Box');
var Point = require('./Point')
var Room = Rooms.Room;
var utils = require('../utils');

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

    this.FPS = constants.FPS.GAME_FPS;
    this.playerCount = 0;
    this.winner = null;
    this.dieSequenceArr = [];
    this.gameTime = constants.GAME_TIME;
    this.monsterCount = this.map.monsterStartPointArr.length;

    this.gameInfoInterval = null;
    this.timer = null;
    this.isRunning = false;
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
}

/**
 * 结束游戏方法，若有玩家断线会有loser参数，否则根据死亡状态和积分判断胜负
 *
 * @param {string} loser
 */
Game.prototype.stopGame = function(){
    // if(!this.isRunning) return;
    console.log('end');
    //客户端结束
    var msg = {winner:0, isTied:true};

    var gameOverNum = 1;
    if(this.playerCount > 1) gameOverNum = this.playerCount - 1;

    var playGuidArr = Object.keys(this.userGuidRoleIndexMap);
    if(this.dieSequenceArr.length >= gameOverNum){

    }

    this.broadcastMsg('end',msg);

    utils.clearSocketsByRoomName(this.io, this.roomName);
    Room.deleteRoom(this.roomName);
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

module.exports = Game;
