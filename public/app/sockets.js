
var playersData = {};

var socket = io.connect(window.location.href);

var Comm = {};

Comm.isMaster = false;

Comm.id = '';

var predatorEl = document.getElementById('predator-count');
var preyEl = document.getElementById('prey-count');
var notifyEl = document.getElementById('notification');

var notifyRespawn = function(secs){
	var count = (secs)*1000;
	notify('You died.<br />Respawn in ' + (Math.floor(count/1000)) + ' seconds');
	var intv = setInterval(function(){
		count -= 1000;

		notify('You died.<br />Respawn in ' + (Math.floor(count/1000)) + ' seconds');
		if(count <= 0){
			clearInterval(intv);
			pjs.respawn();
			notify('');
		}
		
	},1000);
};

var notify = function(msg){
	notifyEl.innerHTML = msg;
}

var generateStats = function(){
	var ids = Object.keys(playersData);
	var pred = 0,
		prey = 0;

	for(var i=0; i<ids.length; i++){
		var id = ids[i];
		var curr = playersData[id];
		if(curr.type === 'Predator'){
			pred++;
		}else{
			prey++;
		}

	}

	predatorEl.innerHTML = pred;
	preyEl.innerHTML = prey;
}

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
	generateStats();
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