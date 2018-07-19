var rooms = {}

var TDRoom = function(){

    this.getRooms = function(){
        return Object.keys(rooms);
    }

    this.getRoom = function(roomName){
        return rooms[roomName];
    }

    this.createRoom = function(roomName,game){
        if(!this.isRoomExisted(roomName)){
            rooms[roomName] = game;
            return this.returnMsg(1,'success');
        }
        return this.returnMsg(0,'existed');
    }

    this.deleteRoom = function(roomName){
        var existGame = rooms[roomName];
        if(existGame){
            rooms[roomName] = null;
            delete rooms[roomName];
            existGame.stopGameIntervals();
            existGame = null;
            return this.returnMsg(1,'success');
        }else{
            return this.returnMsg(0,'not existed');
        }
    }

    this.isRoomExisted = function(roomName){
        var existGame = rooms[roomName];
        if(!existGame){
            return false;
        }
        return true;
    }

    this.returnMsg = function(code,msg){
        return {code:code,msg:msg};
    }

    return this;
}

module.exports = {
    TDRoom:TDRoom
}