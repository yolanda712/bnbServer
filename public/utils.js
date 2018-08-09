/**
 * 将SocketIO下的某一房间下所有sockets清空
 *
 * @param {SeverIO} io
 * @param {string} roomName
 */
var clearSocketsByRoomName = function(io,roomName){
    try{
        var socketRoom = io.sockets.adapter.rooms[roomName];
        var sockets = socketRoom.sockets;
        var socketIds = Object.keys(sockets);
    
        for(var i=0;i<socketIds.length;i++){
            var socket = io.sockets.sockets[socketIds[i]];
            socket.roomName = null;
            socket.userInfo = null;
            socket.leave(roomName);
        }
    }catch(error){
        console.log('Already cleared Sockets by roomName');
    }
}

module.exports = {
    clearSocketsByRoomName: clearSocketsByRoomName
}