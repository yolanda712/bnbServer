// Singleton Room
var INSTANCE = null;

var Room = function(){
    this.rooms = {};
    this.roomMasters = {};
}

Room.prototype.getRooms = function(){
    result = [];
    for(roomName in this.rooms){
        result.push(
            {
                roomName:roomName,
                playerCount:this.rooms[roomName].playerCount,
                isFull: this.rooms[roomName].isGameFullOfPlayers()
            }
        );
    }
    console.log(result);
    return result;
}

Room.prototype.getRoom = function(roomName){
    return this.rooms[roomName];
}

Room.prototype.createRoom = function(roomName,game){
    if(!this.isRoomExisted(roomName)){
        this.rooms[roomName] = game;
        return this.returnMsg(1,'success');
    }
    return this.returnMsg(0,'existed');
}

Room.prototype.deleteRoom = function(roomName){
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

Room.prototype.isRoomExisted = function(roomName){
    var existGame = this.rooms[roomName];
    if(!existGame){
        return false;
    }
    return true;
}

Room.prototype.returnMsg = function(code,msg){
    return {code:code,msg:msg};
}

Room.prototype.getInstance = function(){
    if(INSTANCE === null){
        INSTANCE = new Room();
    }
    return INSTANCE;
}


module.exports = {
    Room: new Room().getInstance()
}