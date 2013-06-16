
var play = function(pjs) {

	var bkg = pjs.color(245,255,245);
	var gray = pjs.color(100,30);

	var players = {};

	var playerRad = 30;
	var algaeRad = 20;
	var numAlgae = 4;
	var playerFinSize = new pjs.PVector(10,20);

	var playerSpeed = 1.2;
	var decay = .0005;

	var predatorCol = pjs.color(255,156,91);
	var preyCol = pjs.color(135,189,177);
	var algaeCol = pjs.color(136,166,94,120);

	var player, players, algae, zombies;

	var algaeCount = 0;

	pjs.setupScreen = function(){
		pjs.size(pjs.screenWidth,pjs.screenHeight);
	};

	pjs.setup = function(){
		pjs.setupScreen();
		pjs.noStroke();
		pjs.smooth();
		pjs.textAlign(pjs.LEFT);

		players = [];
		algae = [];
		zombies = [];

		pjs.respawn();
	};

	pjs.mousePressed = function(){
		var mouse = new pjs.PVector(pjs.mouseX, pjs.mouseY);

		var diff = pjs.PVector.sub(mouse, player.pos);
		diff.normalize();
		diff.mult(playerSpeed);

		player.v = diff;
	}

	pjs.mouseDragged = function(){
		pjs.mousePressed();
	}

	pjs.draw = function(){
		pjs.background(bkg);
		
		for(var i=0; i<algae.length; i++){
			algae[i].render();
		}

		for(var i=0; i<zombies.length; i++){
			zombies[i].render();
		}

		for(var i=0; i<players.length; i++){
			if(players[i].remove){
				if(players[i] == player){
					notifyRespawn(10);
				}
				players.splice(i, 1);
				i--;
				console.log(players);
			}else{
				players[i].render();
			}
		}

		displayHealth();

		player.tickAlways();
	};

	pjs.setPlayerId = function(id){
		player.id = id;
	};

	pjs.updateAll = function(){

		var ids = Object.keys(playersData);

		for(var i=0; i<ids.length; i++){

			var id = ids[i];
			var p = _.find(players, function(el){
				return el.id === id;
			});

			if(!p){ //new player
				players.push(new constructors[playersData[id].type](0,0, id));
			}
		}
	};

	pjs.makeAlgae = function(){
		if(algae.length == 0){
			for(var i=0; i<numAlgae; i++){
				var pos = new pjs.PVector(pjs.random(pjs.width/5, pjs.width*4/5), pjs.random(pjs.height/5, pjs.height*4/5));
				var nA = new Algae(pos.x, pos.y);
				algae.push(nA);
			}
			Comm.setAlgae(algae);
		}
	}

	pjs.setAlgae = function(arr){
		algae = [];
		for(var i=0; i<arr.length; i++){
			var nA = new Algae(arr[i].x, arr[i].y, arr[i].id);
			algae.push(nA);
		}
	}


	pjs.addPlayer = function(id){
		console.log('addPlayer');
		players.push(new constructors[playersData[id].type](0,0, id));
		console.log(players);
	};

	pjs.removePlayer = function(data){
		console.log('removePlayer');
		players = players.filter(function(el){
			return el.id !== data.id;
		});

		console.log(data.id);
		console.log(player.id);

		if(data.id === player.id){
			notifyRespawn(10);
			console.log("I got removed");
		}

		console.log(players);
	};

	pjs.increaseHealth = function(amount){
		player.health = 1;
	}

	pjs.respawn = function(){
		var pos = new pjs.PVector(pjs.random(pjs.width/5, pjs.width*4/5), pjs.random(pjs.height/5, pjs.height*4/5));

		if(Math.random() < .5)
			player = new Predator(pos.x, pos.y, '');
		else
			player = new Prey(pos.x, pos.y, '');

		Comm.registerSelf(player.pos.x, player.pos.y, player.type);
		players.push(player);
	};

	var displayHealth = function(){
		if(player.health > 0){
			pjs.fill(gray);
			pjs.rect(10,10,pjs.width/4+10, 50+10);
			pjs.fill(player.col);
			pjs.rect(15,15,player.health*pjs.width/4, 50);		
		}
			
	}

	var Player = Class.create({
		initialize: function(x, y, id){
			this.pos = new pjs.PVector(x, y);
			this.v = new pjs.PVector();
			this.a = new pjs.PVector();
			this.remove = false;
			this.id = id;
			this.health = 1;

			this.timeToReproduce = 0;

			this.rot = 0;
			this.tailRot = 0;
			this.lastAngle = 0;
		},

		sync: function(){
			if(this != player && playersData[this.id]){
				var pos = playersData[this.id];
				this.pos.x = pos.x;
				this.pos.y = pos.y;
			}else{

				this.pos.add(this.v);

				Comm.setPosition(this.pos.x, this.pos.y);
			}

			if(this.pos.x - playerRad < 0){
				this.pos.x = playerRad;
			}

			if(this.pos.x + playerRad > pjs.width){
				this.pos.x = pjs.width - playerRad;
			}

			if(this.pos.y - playerRad < 0){
				this.pos.y = playerRad;
			}

			if(this.pos.y + playerRad > pjs.height){
				this.pos.y = pjs.height - playerRad;
			}
		},

		tick: function(){
			
		},

		render: function(){
			var lastPos = new pjs.PVector(this.pos.x, this.pos.y);

			if(!this.isZombie){
				this.sync();
				if(Comm.isMaster){
					this.tick();
				}	
			}
			

			

			var diff = pjs.PVector.sub(this.pos, lastPos);
			var angle = Math.atan(diff.y / diff.x);

			angle += Math.PI/2;

			if(diff.x > 0){
				angle += Math.PI;
			}

			if(angle){
				var rem = angle % 2*Math.PI;
				var lastRem = this.lastAngle % 2*Math.PI;

				var diff = Math.atan2(Math.sin(angle-this.lastAngle), Math.cos(angle-this.lastAngle));

				angle = this.lastAngle + diff;

				this.lastAngle = angle;
				this.rot += (angle - this.rot)*.1;
				this.tailRot += (angle - this.tailRot)*.07;
			}
			
			pjs.pushMatrix();
			pjs.translate(this.pos.x, this.pos.y);
			pjs.rotate(this.rot);

			if(this == player){
				pjs.fill(gray);
				var add = 15 + this.timeToReproduce*100;
				pjs.ellipse(0, 0, playerRad*2 + add, playerRad*2 + add);
			}
			pjs.fill(this.col);

			pjs.triangle(0 - playerRad, 0, 
				0 - playerFinSize.x - playerRad, 0 - playerFinSize.y,
				0 + playerFinSize.x - playerRad, 0 - playerFinSize.y);

			pjs.triangle(0 + playerRad, 0, 
				0 - playerFinSize.x + playerRad, 0 -playerFinSize.y,
				0 + playerFinSize.x + playerRad, 0 - playerFinSize.y);

			pjs.rotate(this.tailRot - this.rot);

			pjs.triangle(0, 0 - playerRad + playerFinSize.y, 
				0 - playerFinSize.x*3/2, 0 - playerRad - playerFinSize.y/2,
				0 + playerFinSize.x*3/2, 0 - playerRad - playerFinSize.y/2);

			pjs.ellipse(0, 0, playerRad*2, playerRad*2);

			pjs.popMatrix();
		},

		reproduce: function(other){
			console.log('reproduce');
			var p = new constructors[this.type](this.pos.x, this.pos.y, this.id);
			this.timeToReproduce = 0;
			p.timeToReproduce = 0;
			other.timeToReproduce = 0;
			p.isZombie = true;
			zombies.push(p);
		},

		tryReproduce: function(){
			if(this.timeToReproduce <= 0){
				return;
			}

			this.timeToReproduce -= .005;

			for(var i=0; i<players.length; i++){
				var curr = players[i];
				if(curr != this && curr.type === this.type){
					var dist = pjs.PVector.dist(this.pos, curr.pos);
					if(dist < playerRad*2){
						this.reproduce(curr);
						break;
					}
				}
			}

		}
	});

	var Predator = Class.create(Player, {
		initialize: function($super, x, y, id){
			$super(x, y, id);
			this.type = 'Predator';
			this.col = predatorCol;
		},

		eat: function(prey){
			prey.remove = true;
			Comm.removePlayer(prey.id);
			
			if(this == player){
				this.health = 1;
			}else{
				Comm.increaseHealth(this.id);
			}

			//this.timeToReproduce = 1;
			

		},

		tick: function(){

			//this.tryReproduce();
			
			var len = players.length;
			for(var i=0; i<len; i++){
				var curr = players[i];
				if(curr != this){
					var dist = pjs.PVector.dist(this.pos, curr.pos);
					if(dist < playerRad*2 && curr.type === 'Prey'){
						console.log('eat');
						this.eat(curr);
						break;
					}
				}
			}
		},

		tickAlways: function(){
			this.health -= decay;

			if(this.health <= 0 && !this.remove){
				Comm.removePlayer(this.id);
				this.remove = true;
			}	
		}
	});


	var Prey = Class.create(Player, {
		initialize: function($super, x, y, id){
			$super(x, y, id);
			this.type = 'Prey';
			this.col = preyCol;
		},

		tick: function(){

			this.tryReproduce();

			var len = algae.length;
			for(var i=0; i<len; i++){
				var curr = algae[i];
				var dist = pjs.PVector.dist(this.pos, curr.pos);
				if(dist < playerRad + algaeRad){
					console.log('eat algae');
					algae = algae.filter(function(el){
						return el != curr;
					});

					if(this == player){
						this.health = 1;
					}else{
						Comm.increaseHealth(this.id);
					}

					//this.timeToReproduce = 1;

					setTimeout(function(){
						var pos = new pjs.PVector(pjs.random(pjs.width/5, pjs.width*4/5), pjs.random(pjs.height/5, pjs.height*4/5));
						var nA = new Algae(pos.x, pos.y);
						algae.push(nA);
						Comm.setAlgae(algae);
					},1000*10);

					Comm.setAlgae(algae);
					
					break;
				}
			}
		},

		tickAlways: function(){
			this.health -= decay;

			if(this.health <= 0 && !this.remove){
				Comm.removePlayer(this.id);
				this.remove = true;
			}
		}
	});

	var constructors = {
		'Predator': Predator,
		'Prey': Prey
	};

	var Algae = Class.create(Player, {
		initialize: function($super, x, y){
			var id = '' + algaeCount;
			algaeCount++;
			$super(x, y, id);
			this.type = 'Prey';
			this.col = algaeCol;
		},

		tick: function(){

		},

		tickAlways: function(){
			
		},

		render: function(){
			pjs.fill(this.col);
			pjs.ellipse(this.pos.x, this.pos.y, algaeRad*2, algaeRad*2);
		}
	});

	var constructors = {
		'Predator': Predator,
		'Prey': Prey
	};

};

var canvas = document.getElementById("pcanvas");
var pjs = new Processing(canvas, play);

//set up resize event
window.onresize = function(event) {
   pjs.setupScreen();
}
