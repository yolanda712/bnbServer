var Map = require('./Map');
var Role = require('./Role');
var constants = require('./Const')
var Direction = constants.Direction;
var Rooms = require('./Room');
var Monster = require('./Monster');
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
    this.Map = new Map();
    this.roleArr = [];
    this.paopaoArr = [];
    this.itemArr = [];
    this.monsterArr = [];

    this.FPS = constants.FPS.GAME_FPS;
    this.playerCount = 0;
    this.winner = null;
    this.gameTime = constants.GAME_TIME;
    this.monsterCount = this.Map.monsterStartPointArr.length;

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
Game.prototype.stopGame = function(loser){
    // if(!this.isRunning) return;
    console.log('end');
    //客户端结束
    var msg = {winner:0, isTied:true};
    var masterRole = this.roleArr[0];
    var challengerRole = this.roleArr[1];
    // TODO 角色不应该写死个数
    // 判断是否单人玩家
    if(challengerRole){
        // 判断是否传入失败玩家信息
        if(loser){
            msg.isTied = false;
            msg.winner = loser === 'master' ? this.roleArr[1].guid : this.roleArr[0].guid;
        }else{
            // 正常游戏逻辑判断失败者
            var winner = findWinner(masterRole,challengerRole);
            if(winner){
                msg = {winner:winner.guid, isTied:false};
            }
        }
    }
    console.log("game over" + msg);
    this.broadcastMsg('end',msg);

    utils.clearSocketsByRoomName(this.io, this.roomName);
    Room.deleteRoom(this.roomName);
}

Game.prototype.addPlayer = function(userInfo){
    if(!this.isGameFullOfPlayers()){
        this.userInfos.push(userInfo);
        this.playerCount++;
    }   
}

Game.prototype.createANewRole = function(userInfo){
    var existedRoleNum = this.roleArr.length;
    if(this.Map.roleStartPointArr.length > existedRoleNum){
       var startPosition = this.Map.roleStartPointArr[existedRoleNum];
       var cocosPosition = this.Map.convertMapIndexToCocosAxis(this.Map.getYLen(), startPosition.x, startPosition.y);
       var role = null;
       if(existedRoleNum == 0){
           role = 'master';
       }else{
           role = 'challenger';
       }
       var newRole = new Role(existedRoleNum,role,this,userInfo);
       newRole.setPosition(cocosPosition.x, cocosPosition.y);
       newRole.setMap(this.Map);
       this.roleArr.push(newRole);
    }
}

Game.prototype.createMonster = function(){
    //小怪物从monster0开始命名
    var monsterIndex = this.monsterArr.length;
    var monsterName = "monster"+this.monsterArr.length;
    var newMonster = new Monster(monsterIndex,monsterName,this);
    newMonster.setMap(this.Map);
    var startPosition = this.Map.monsterStartPointArr[monsterIndex];
    var cocosPosition = this.Map.convertMapIndexToCocosAxis(this.Map.getYLen(), startPosition.x, startPosition.y);
    newMonster.setPosition(cocosPosition.x, cocosPosition.y);
    this.monsterArr.push(newMonster);
}

/**
 * 初始化游戏角色和怪物
 *
 */
Game.prototype.initRolesAndMonsters = function(){
    //create player roles
    for(var i=0; i<this.playerCount; i++){
        this.createANewRole(this.userInfos[i]);
    }

    this.monsterArr = [];
    for(var j=0; j<this.monsterCount; j++){
        this.createMonster();
    }
}

Game.prototype.broadcastGameStartMsg = function(){
    var self = this;
    var roleStartPointArr = this.Map.roleStartPointArr.map(function (point) {  
        var newPoint = self.Map.convertMapIndexToCocosAxis(self.Map.getYLen(),point.x,point.y);
        return newPoint;  
    });
    var monsterStartPointArr = this.Map.monsterStartPointArr.map(function (point) {  
        var newPoint = self.Map.convertMapIndexToCocosAxis(self.Map.getYLen(),point.x,point.y);
        return newPoint;  
    });

    var mapInfo = {
        mapName:'basicMap',
        arr: this.Map.map,
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
    }else{
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
    return this.isRunning || (this.playerCount >= this.Map.roleStartPointArr.length);
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
