// Singleton TDRoom
var INSTANCE = null;


/**
 * TDRoom类，用于查找具体游戏的单例类
 *
 */
var TDRoom = function(){
    this.rooms = {};
}

/**
 * 获得所有房间信息
 *
 * @returns obj{}, roomName playerCount isFull
 */
TDRoom.prototype.getRooms = function(){
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

/**
 * 获得某一房间内的游戏实例 
 *
 * @param {string} roomName
 * @returns tdGame
 */
TDRoom.prototype.getRoom = function(roomName){
    return this.rooms[roomName];
}

/**
 * 根据房间名和游戏实例创建房间
 *
 * @param {string} roomName
 * @param {tdGame} game
 * @returns msg
 */
TDRoom.prototype.createRoom = function(roomName,game){
    if(!this.isRoomExisted(roomName)){
        this.rooms[roomName] = game;
        return this.returnMsg(1,'success');
    }
    return this.returnMsg(0,'existed');
}

/**
 * 根据房间名删除房间
 *
 * @param {string} roomName
 * @returns msg
 */
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

/**
 * 判断房间是否存在
 *
 * @param {string} roomName
 * @returns bool
 */
TDRoom.prototype.isRoomExisted = function(roomName){
    var existGame = this.rooms[roomName];
    if(!existGame){
        return false;
    }
    return true;
}

/**
 * 返回固定格式消息
 *
 * @param {int} code
 * @param {string} msg
 * @returns msgObj
 */
TDRoom.prototype.returnMsg = function(code,msg){
    return {code:code,msg:msg};
}

/**
 * 获得当前Room实例
 *
 * @returns
 */
TDRoom.prototype.getInstance = function(){
    if(INSTANCE === null){
        INSTANCE = new TDRoom();
    }
    return INSTANCE;
}


module.exports = {
    TDRoom: new TDRoom().getInstance()
}