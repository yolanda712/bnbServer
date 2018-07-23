var TDMap = require('./tdMap')
var Role = require('./tdRole')
var constants = require('./tdConst')
var Rooms = require('./tdRoom')
var TDMonster = require('./tdMonster')
var TDRoom = Rooms.TDRoom;
var Direction = constants.Direction;

// 根据FPS向客户端发送人物角色信息的回调
var clientCallback = function(game){
    if(game){
        var msg = [];
        for(index in game.roleArr){
            role = game.roleArr[index];
            msg.push(
                {
                    name:role.name,
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

//主游戏入口
var TDGame = function (serverIO, roomName) {
    this.io = serverIO;
    this.roomName = roomName;
    this.tdMap = new TDMap();
    this.roleArr = [];
    this.paopaoArr = [];
    this.itemArr = [];

    this.FPS = 90;
    this.palyerCount=0;
    this.winner=null;
    this.gameTime = constants.GAME_TIME;

    this.gameInfoInterval = null;
    this.timer = null;

    this.tdMonster = null;
}

TDGame.prototype.addPlayerNum = function(){
    this.palyerCount++;
}

TDGame.prototype.createANewRole = function(){
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
       var newRole = new Role(role,this);
       newRole.setPosition(cocosPosition.x, cocosPosition.y);
       newRole.setMap(this.tdMap);
       this.roleArr.push(newRole);
    }
    
}

TDGame.prototype.createMonster = function(){
    this.tdMonster = new TDMonster();
    this.tdMonster.setMap(this.tdMap);
    var cocosPosition =  this.tdMonster.startCocosPosition();
    this.tdMonster.setPosition(cocosPosition.x, cocosPosition.y);
}

TDGame.prototype.startGame = function(){
    //create player roles
    for(var i=0; i<this.palyerCount; i++){
        this.createANewRole();
    }

    this.createMonster();

    var mapInfo = {
        mapName:'basicMap',
        arr: this.tdMap.map
    };
    this.broadcastMsg('start',mapInfo);
    console.log(mapInfo);

    var self = this;
    this.timer = setInterval(function(){
        self.countTime();
    }, 1000); 

    this.gameInfoInterval = setInterval(function(){
        clientCallback(self);
    },1000/this.FPS);

    this.monstereInfoInterval = setInterval(function(){
        self.broadcastMsg('monsterInfo',{x:self.tdMonster.position.x,y:self.tdMonster.position.y});
        // console.log("!!!!!!!!"+self.tdMonster.position.x+"!!!!!"+self.tdMonster.position.y);
    },200);
}

TDGame.prototype.stopGameIntervals = function(){
    clearInterval(this.timer);
    clearInterval(this.gameInfoInterval);
    clearInterval(this.monstereInfoInterval);
}

TDGame.prototype.stopGame = function(data){
    console.log('end');
    //客户端结束
    this.broadcastMsg('end');

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
        var winner = null;
        var masterRole = this.roleArr[0];
        var challengerRole = this.roleArr[1];
        if(masterRole.score > challengerRole.score){
            winner = '房主获胜';
        }else if(masterRole.score == challengerRole.score){
            winner = '平局';
        }else{
            winner = '挑战者获胜';
        }
        this.stopGame(winner);
    }

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

module.exports = TDGame;
