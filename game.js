/*
==== TODO LIST ====

- Implement options attribute - DONE
- Implement event attributes
- Implement Color class
- Implement game focusing(prevents events from affecting more than one game) - DONE

===================
*/

const DEFAULT_DIMENSION = 450;
const DEFAULT_COLOR = "rgb(128, 125, 128)";
const DEFAULT_STROKE_WIDTH = 0;

const UP = "ArrowUp";
const LEFT = "ArrowLeft";
const RIGHT = "ArrowRight";

const mouse = {
    x : 0, y : 0,  // coordinates
}

function clamp(min, max, variable) {
    if (variable < min) return min;
    if (variable > max) return max;
    return variable;
}

/*
 * Used as an alternative to the double pipe operator
 */
function verify(variable, defaultValue) {
	if(typeof variable == "undefined" || !variable) {
		return defaultValue;
	}
	return variable;
}

/*
 * https://stackoverflow.com/questions/1484506/random-color-generator
 */
function genColor() {
	return "#"+((1<<24)*Math.random()|0).toString(16);
}

Element.prototype.getAttributes = function() {
	let attributes = {};
	for(let i = 0; i < this.attributes.length; i++) {
		let attribute = this.attributes[i];
		attributes[attribute.nodeName] = attribute.value;
	}
	console.log(attributes);
	return attributes;
}

CanvasRenderingContext2D.prototype.fillOval = function(x, y, width, height) {
	this.beginPath();
	this.ellipse(x, y, width, height, 0, 0, 2 * Math.PI);
	this.fill();
	this.closePath();
}

class Game {

    constructor(attributes) {
		this.attributes = attributes;
		this.focused = false;
        this.setupCanvas();
    }

    getWidth() {
        return this.canvas.width;
    }

    getHeight() {
        return this.canvas.height;
    }

    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.context;
    }

    getColor() {
        return this.color;
    }
    
    getStroke() {
    	return this.stroke;
    }
	
	isFocused() {
		return this.focused;
	}
	
	setFocused(boolean) {
		this.focused = verify(boolean, true);
	}

    setWidth(width) {
        this.getCanvas().width = width;
    }

    setHeight(height) {
        this.getCanvas().height = height;
    }

    setupCanvas() {
        if (!this.canvas) {
		    this.canvas = document.createElement("canvas");
			this.color = verify(this.attributes.color, DEFAULT_COLOR);
			this.strokeColor = verify(this.attributes.strokeColor, DEFAULT_COLOR);
			this.strokeWidth = verify(this.attributes.strokeWidth, null);
            this.canvas.width = verify(this.attributes.width, DEFAULT_DIMENSION);
            this.canvas.height = verify(this.attributes.height, DEFAULT_DIMENSION);
            this.context = this.canvas.getContext("2d");
			document.body.appendChild(this.canvas);
        }
    }

    clear() {
        this.getContext().clearRect(0, 0, this.getWidth(), this.getHeight());
    }

    update() {

    }
	
	render() {
		this.getContext().save();
		if(this.color !== this.getContext().fillStyle) {
			this.getContext().fillStyle = this.color;
		}
		if(this.stroke !== null && this.stroke !== this.getContext().strokeStyle) {
			this.getContext().strokeStyle = this.stroke;
		}
		this.draw();
		this.getContext().restore();
	}

    draw() {
        this.getContext().fillRect(0, 0, this.getWidth(), this.getHeight());
		this.getContext().strokeRect(0, 0, this.getWidth(), this.getHeight());
    }

}

class Player {

    constructor(game, x, y, width, height, color) {
        this.game = game;
		this.canvas = game.canvas;
		this.context = this.canvas.getContext("2d");
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
		this.setupMovement();
		this.color = color;

    }
	
	setupMovement() {
		this.friction = 0.9;
		this.gravity = 0.2;
		this.tolerance = 1.5;
		this.velX = this.velY = 0;
		this.jumped = false;
		this.jumpHeight = 5;
		this.speed = 3.5;
	}

	
	teleport(x, y) {
		this.x = verify(x, this.x);
		this.y = verify(y, this.y);
		this.velX = 0;
		this.velY = 0;
	}

    update() {
		this.x += this.velX;
        this.y -= this.velY;
        this.testSides();
    }
	
	isOnGround() {
		return this.y >= this.canvas.height - this.height;
	}

    testSides() {
        this.x = clamp(0, this.canvas.width - this.width, this.x);
		this.y = clamp(0, this.canvas.height - this.height, this.y);
    }

    draw() {
		this.context.fillStyle = this.color;
        this.context.fillOval(this.x, this.y, this.width, this.height, 0);
	}

}

class MovablePlayer extends Player {

	
    constructor(game, x, y, width, height, color, bounces) {
		super(game, x, y, width, height, color);
		this.keys = [
            UP => false,
            LEFT => false,
            RIGHT => false
        ];
		this.bounces = verify(bounces, true);
		this.setupListeners();
	}

	
	testKeys() {
		if(this.keys[UP] && !this.jumped && this.isOnGround()) {
			this.jump();
			this.jumped = true;
		}
	
		let vel = 0;
        if (this.keys[LEFT]) {
            vel = -this.speed;
        } else if (this.keys[RIGHT]) {
            vel = this.speed;
        } else {
			vel = 0;
        }
		this.velX = vel;
    }

    jump() {
        this.velY = this.jumpHeight;
    }
	
	setupListeners() {
		let instance = this;
        this.game.onkeydown = function(e) {
        	switch(e.key) {
        		case UP:
        		case LEFT:
        		case RIGHT:
        			instance.keys[e.key] = true;
        		
        	}
        };
        this.game.onkeyup = function(e) {
        	switch(e.key) {
        		case UP:
        		case LEFT:
        		case RIGHT:
        			instance.keys[e.key] = false;
        	}
		};
    }
	
	update() {
		super.update();
		if(this.isOnGround()) {
			if(this.bounces) {
				this.velY *= (this.velY * -this.friction < this.tolerance ? 0 : -this.friction);
			}
			if(this.jumped) {
				this.jumped = false;
			}
		} else {
			this.velY -= this.gravity;
		}
		this.testKeys();
	}

}

class GravityTest extends Game {

    constructor(attributes) {
        super(attributes);
		this.player = new MovablePlayer(this, this.getWidth() / 2, this.getHeight() / 2, 15, 15, "rgb(75, 75, 125)", true);
    }

    update() {
        super.update();
        this.player.update();
    }

    draw() {
        super.draw();
        this.player.draw();
    }

}

class CanvasTest extends Game {

	constructor(attributes) {
        super(attributes);
		this.lastUpdate = 0;
		this.increment = 4;
		this.counter = 4;
		let avg = this.getWidth() + this.getHeight() / 2;
		this.min = avg / 4;
		this.max = avg * 8;
    }

    update() {
        super.update();
		this.lastUpdate += this.increment;
		if(this.lastUpdate >= this.counter) {
			this.setWidth(clamp(this.min, this.max, this.getWidth() - 1));
			this.setHeight(clamp(this.min, this.max, this.getHeight() - 1));
			this.lastUpdate = 0;
		}
    }
}

class SpawnTest extends Game {

	constructor(attributes) {
        super(attributes);
		this.players = [];
		this.setupListeners();
    }
	
	setupListeners() {
		this.onclick = function(e) {
			this.players.push(new MovablePlayer(this, mouse.x, mouse.y, 15, 15, genColor(), true));
		}
	}

    update() {
        super.update();
        this.players.forEach(function(player) {
			player.update();
		});
    }

    draw() {
        super.draw();
        this.players.forEach(function(player) {
			player.draw();
		});
    }
}

let defaults = {
    	"gravity": GravityTest,
	"canvas": CanvasTest,
	"spawn": SpawnTest
};

function pushDefault(id, clazz) {
	defaults[id] = clazz;
}

function getDefault(id) {
    return defaults[id] || null;
}

let tags = document.getElementsByTagName("game");
let games = [];

for (let i = 0; i < tags.length; i++) {
	let attributes = tags[i].getAttributes();
	console.log(getDefault(attributes.default));
    if (getDefault(attributes.default)) {
		let clazz = getDefault(attributes.default);
        games.push(new clazz(attributes));
    }
}

let eventLists = ["mousedown", "mouseup", "mousemove", "keydown", "keyup", "click"];

document.addEventListener("click", function(e) {
    var canvas = null;
	
	games.forEach(function(game) {
		if(game.getCanvas() === e.target) {
			canvas = e.target;
			game.setFocused();
		} else {
			game.setFocused(false);
		}
    });
	
	if(canvas !== null) {
		var bounds = canvas.getBoundingClientRect();
		mouse.x = event.pageX - bounds.left - scrollX;
    	mouse.y = event.pageY - bounds.top - scrollY;
		mouse.x /=  bounds.width; 
   		mouse.y /=  bounds.height; 
   		mouse.x *= canvas.width;
   		mouse.y *= canvas.height;
	}
}, true);

eventLists.forEach(function(event) {
    document.addEventListener(event, function(e) {
        games.forEach(function(game) {
            if (typeof game["on" + event] == "function" && game.isFocused()) {
                game["on" + event](e);
            }
        });
    });
});


function run() {
    games.forEach(function(game) {
        game.clear();
        game.update();
        game.render();
    });
    requestAnimationFrame(run);
}

requestAnimationFrame(run);
