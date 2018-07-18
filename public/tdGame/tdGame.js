var TDMap = require('./tdMap')
var Role = require('./tdRole')
var TDPaoPao = require('./tdPaopao')
var constants = require('./tdConst')

//主游戏入口
var TDGame = function (serverIO, roomName) {
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
        // this.challengerRole.createPaopaoAtPos(x,y);
        // this.challengerRole.createPaopaoAtPos(x,y-32);
    }

    this.startGame = function(){
        this.io.to(this.roomName).emit('start',{});
        var self = this;
        this.timer = setInterval(function(){
            self.countTime();
        }, 1000); 
    }

    this.stopGame = function(data){
        console.log('end');
        // console.log(data);
        clearInterval(this.timer);
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

    return this;


    
}




module.exports = {
    TDGame:TDGame,

}
