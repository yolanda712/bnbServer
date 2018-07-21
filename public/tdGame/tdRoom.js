// Singleton TDRoom
var INSTANCE = null;

var TDRoom = function(){
    this.rooms = {};
}

TDRoom.prototype.getRooms = function(){
    return Object.keys(this.rooms);
}

TDRoom.prototype.getRoom = function(roomName){
    return this.rooms[roomName];
}

TDRoom.prototype.createRoom = function(roomName,game){
    if(!this.isRoomExisted(roomName)){
        this.rooms[roomName] = game;
        return this.returnMsg(1,'success');
    }
    return this.returnMsg(0,'existed');
}

TDRoom.prototype.deleteRoom = function(roomName){
    var existGame = this.rooms[roomName];
    if(existGame){
        this.rooms[roomName] = null;
        delete this.rooms[roomName];
        existGame.stopGameIntervals();
        existGame = null;
        return this.returnMsg(1,'success');
    }else{
        return this.returnMsg(0,'not existed');
    }
}

TDRoom.prototype.isRoomExisted = function(roomName){
    var existGame = this.rooms[roomName];
    if(!existGame){
        return false;
    }
    return true;
}

TDRoom.prototype.returnMsg = function(code,msg){
    return {code:code,msg:msg};
}

TDRoom.prototype.getInstance = function(){
    if(INSTANCE === null){
        INSTANCE = new TDRoom();
    }
    return INSTANCE;
}


module.exports = {
    TDRoom: new TDRoom().getInstance()
}