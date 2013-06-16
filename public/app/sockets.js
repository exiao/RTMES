
var playersData = {};

var socket = io.connect(window.location.href);

var Comm = {};

Comm.isMaster = false;

Comm.id = '';

Comm.setup = function(){
	
};

Comm.setPosition = function(x, y){
	socket.emit('update', {x: x, y: y});
}

Comm.registerSelf = function(x, y, type){
	socket.emit('register', {x: x, y: y, type: type});
}

Comm.removePlayer = function(id){
	socket.emit('removeplayer', id);
}

Comm.increaseHealth = function(id, amount){
	console.log('increasehealth');
	socket.emit('increasehealth', {id: id, amount:amount});
}

socket.on('update', function(data){
	playersData = data;
	pjs.updateAll();
});

socket.on('setmaster', function(data){
	Comm.isMaster = true;
	console.log('isMaster');
});

socket.on('newplayer', function(data){
	playersData = data.players;
	pjs.addPlayer(data.id);
});

socket.on('removeplayer', function(data){
	pjs.removePlayer(data);
});

socket.on('increasehealth', function(data){
	console.log('increasehealth');
	pjs.increaseHealth(data);
});

socket.on('id', function(id){
	Comm.id = id;
 	pjs.setPlayerId(id);
});

Comm.setup();