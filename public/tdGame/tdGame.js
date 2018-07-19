var TDMap = require('./tdMap')
var Role = require('./tdRole')
var TDPaoPao = require('./tdPaopao')
var constants = require('./tdConst')
var Rooms = require('./tdRoom')
var Direction = require('./tdRole').Direction;

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
    }else{
        Rooms.TDRoom().deleteRoom(game.roomName);
        clearInterval(game.gameInfoInterval);
        game = null;
    }
};

//主游戏入口
var TDGame = function (serverIO, roomName) {
    var self = this;
    this.io = serverIO;
    this.roomName = roomName;
    this.tdMap = new TDMap.TDMap();
    this.roleArr = [];
    this.paopaoArr = [];
    this.itemArr = [];
    this.masterRole = null;
    this.challengerRole = null;
    this.winner=null;
    this.gameTime = constants.GAME_TIME;

    this.gameInfoInterval = null;
    this.timer = null;

    this.createMasterRole = function(x,y){
        this.masterRole = new Role.Role('master',this);
        this.masterRole.setPosition(x,y);
        this.masterRole.setMap(this.tdMap);
        this.roleArr.push(this.masterRole);
    }

    this.createChallengerRole = function(x,y){
        this.challengerRole = new Role.Role('challenger',this);
        this.challengerRole.setPosition(x,y);
        this.challengerRole.setMap(this.tdMap);
        this.roleArr.push(this.challengerRole);
    }
    
    this.createMasterRole(32,32);
    this.createChallengerRole(32*11,32*9);

    this.startGame = function(){
        this.gameInfoInterval = setInterval(function(){
            clientCallback(self);
        },20);

        var mapInfo = {
            mapName:'basicMap',
            arr: this.tdMap.map
        };
        this.io.to(this.roomName).emit('start',mapInfo);
        console.log(mapInfo);
        // this.broadcastMsg("mapInfo",mapInfo);
        var self = this;
        this.timer = setInterval(function(){
            self.countTime();
        }, 1000); 
    }

    this.stopGameIntervals = function(){
        clearInterval(this.timer);
        clearInterval(this.gameInfoInterval);
    }

    this.stopGame = function(data){
        console.log('end');
        // console.log(data);
        Rooms.TDRoom().deleteRoom(this.roomName);
        this.io.to(this.roomName).emit('end');
    }

    this.broadcastMsg = function(msg, data){
        this.io.to(this.roomName).emit(msg,data);
    }

    this.countTime = function(){
        if(this.gameTime >= 0){
            console.log(this.gameTime);
            this.gameTime--;
           
        }else{
            var tempData = null;
            if(this.masterRole.score > this.challengerRole.score){
                tempData = this.masterRole;
            }else if(this.masterRole.score == this.challengerRole.score){
                tempData = this.masterRole;
            }else{
                tempData = this.challengerRole;
            }
            this.stopGame(tempData);
        }

    }

    this.moveByKeyCode = function(key, role){
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
    
    this.stopByKeyCode = function(key, role){
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
    
    return this;
}




module.exports = {
    TDGame:TDGame,

}
