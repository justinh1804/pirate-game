window.addEventListener('load', ()=>{
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const map = new Image();
const game = new Game(canvas.width, canvas.height);
let lastTime = 0;

function Initialize(){
    map.src = './Default size/pirate_map.png'
    game.playersArray.push(new Player(canvas.width/2, canvas.height/2, game, './Default size/Ships/ship (4).png'));
    game.Initialize();
}
function Animate(timeStamp){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let deltaTime = timeStamp-lastTime;
    lastTime = timeStamp;
    
    //ctx.drawImage(map, canvas.width/2-game.playersArray[0].x, canvas.height/2-game.playersArray[0].y);
    ctx.drawImage(map, 0, 0, canvas.width, canvas.height, canvas.width/2-game.playersArray[0].x, canvas.height/2-game.playersArray[0].y, canvas.width, canvas.height);
    game.Update(deltaTime);
    game.Draw(ctx);
    requestAnimationFrame(Animate);
}

Initialize();
Animate(0);
});

class Game{
    constructor(width, height){
        this.width = width;
        this.height = height;
        this.playersArray = [];
        this.explosionsArray = [];
    }
    Initialize(){
        this.playersArray.forEach(player=>player.Initialize());
    }
    Update(deltaTime){
        this.playersArray.forEach(player=>player.Update(deltaTime));
        this.explosionsArray.forEach((explosion, i)=>{
            explosion.Update(deltaTime);
            if(explosion.lifeTime>=300) this.explosionsArray.splice(i, 1);
        });
    }
    Draw(context){
        this.playersArray.forEach(player=>player.Draw(context));
        this.explosionsArray.forEach(explosion=>explosion.Draw(context));
    }
}

class Player{
    constructor(x, y, game, imageSRC){
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
        this.cannonAngle = 0;
        this.turnSpeed = 0.0014;
        this.speed = 0;
        this.directionX = 0;
        this.directionY = 0;
        this.angle = -Math.PI/2;
        this.friction = 0.9;
        this.ease = 10;
        this.game = game;
        this.canFire = true;
        this.canFireTimer = 0;
        this.isAnchored = false;
        this.pressedOnce = false;
        this.pressedTwice = false;
        this.pressedThrice = false;
        this.image = new Image();
        this.imageSRC = imageSRC;
        this.inputHandler = new InputHandler();
        this.cannonBalls = [];
    }
    Initialize(){
        this.image.src = this.imageSRC;
        this.cannonBalls.forEach(cannonBall=>{
            cannonBall.Initialize();
        })
    }
    Update(deltaTime){
        //this.handleAnchor();
        this.handleAccel();
        this.handleDecel();
        this.handleTurns();
        this.handleFireCannon(deltaTime);
        this.angle += this.turnSpeed*deltaTime*this.inputHandler.horizontal;
        this.directionX = Math.cos(this.angle);
        this.directionY = Math.sin(this.angle);
        this.x += this.speed*this.directionX*deltaTime;
        this.y += this.speed*this.directionY*deltaTime;
        //console.log(this.inputHandler.mouse.x, this.inputHandler.mouse.y);
        //console.log(this.cannonAngle, this.dx, this.dy);
        //console.log(this.pressedOnce, this.pressedTwice, this.pressedThrice, this.isAnchored, this.speed)
    }
    handleFireCannon(deltaTime){
        
        if(this.inputHandler.mouse.fired && this.canFire){
            this.inputHandler.mouse.fired = false;
            this.dx = this.inputHandler.mouse.x - this.x;
            this.dy = this.inputHandler.mouse.y - this.y;
            this.cannonAngle = Math.atan2(this.dy, this.dx);
            this.cannonBalls.push(new CannonBall(this.x, this.y, './Default size/Ship parts/cannonBall.png', this.cannonAngle));
        }
        this.cannonBalls.forEach((cannonBall, i)=>{
            cannonBall.Update(deltaTime);
            if(cannonBall.lifeTime >= 2000){
                this.game.explosionsArray.push(new Explosion(cannonBall.x, cannonBall.y))
                this.cannonBalls.splice(i, 1);
            }
        });
    }
    handleAnchor(){
        if(this.inputHandler.keys.e.pressed && !this.isAnchored && !this.pressedOnce && !this.pressedTwice && !this.pressedThrice){
            this.speed = 0;
            this.inputHandler.keys.e.pressed = false;
            this.isAnchored = true;
        }
        else if(this.inputHandler.keys.e.pressed && this.isAnchored){
            this.speed = -0.01;
            this.turnSpeed 
            this.inputHandler.keys.e.pressed = false;
            this.isAnchored = false;
        }
    }
    handleAccel(){
        if(this.inputHandler.keys.w.pressed && !this.isAnchored && !this.pressedOnce){
            this.speed = -0.05;
            this.turnSpeed = 0.0012;
            this.inputHandler.keys.w.pressed = false;
            this.pressedOnce = true;
        }
        else if(this.inputHandler.keys.w.pressed && !this.isAnchored && this.pressedOnce && !this.pressedTwice){
            this.speed = -0.1;
            this.turnSpeed = 0.001;
            this.inputHandler.keys.w.pressed = false;
            this.pressedTwice = true;
        }
        else if(this.inputHandler.keys.w.pressed && !this.isAnchored && this.pressedOnce && this.pressedTwice && !this.pressedThrice){
            this.speed = -0.15;
            this.turnSpeed = 0.00095;
            this.inputHandler.keys.w.pressed = false;
            this.pressedThrice = true;
        }
    }
    handleDecel(){
        if(this.inputHandler.keys.s.pressed && this.pressedOnce && this.pressedTwice && this.pressedThrice){
            this.speed = -0.1;
            this.turnSpeed = 0.001;
            this.inputHandler.keys.s.pressed = false;
            this.pressedThrice = false;
        }
        if(this.inputHandler.keys.s.pressed && this.pressedOnce && this.pressedTwice){
            this.speed = -0.05;
            this.turnSpeed = 0.0012;
            this.inputHandler.keys.s.pressed = false;
            this.pressedTwice = false;
        }
        if(this.inputHandler.keys.s.pressed && this.pressedOnce){
            this.speed = -0.01;
            this.turnSpeed = 0.0014;
            this.inputHandler.keys.s.pressed = false;
            this.pressedOnce = false;
        }
    }
    handleTurns(){
        if(this.inputHandler.keys.a.pressed){
            this.directionX = 1;
        }
        if(this.inputHandler.keys.d.pressed){
            this.directionX = -1;
        }
    }
    Draw(context){
        context.save();
        context.translate(this.x, this.y);
        context.rotate((this.angle-Math.PI/2)-Math.PI);
        context.drawImage(this.image, -(this.image.width)/2, -(this.image.height)/2);
        context.restore();
        this.cannonBalls.forEach(cannonBall=>{
            cannonBall.Draw(context);
        });
    }
}

class CannonBall{
    constructor(x, y, imageSRC, cannonAngle){
        this.x = x;
        this.y = y;
        this.lifeTime = 0;
        this.directionX = 0;
        this.directionY = 0;
        this.image = new Image();
        this.image.src = imageSRC;
        this.cannonAngle = cannonAngle;
        this.cannonSpeed = 0.2;
        this.radius = 0;
    }
    Update(deltaTime){
        this.directionX = Math.cos(this.cannonAngle);
        this.directionY = Math.sin(this.cannonAngle);
        
        this.lifeTime += deltaTime;
        this.x += this.cannonSpeed*this.directionX*deltaTime;
        this.y += this.cannonSpeed*this.directionY*deltaTime;
    }
    Draw(context){
        context.save();
        context.translate(this.x,this.y);
        context.scale(1.5,1.5);
        context.drawImage(this.image, -this.image.width/2, -this.image.height/2);
        context.restore();
    }
}

class InputHandler{
    constructor(){
        this.lastKey = '';
        this.horizontal = 0;
        this.keys = {
            w:{
                pressed: false
            },
            a:{
                pressed: false
            },
            s:{
                pressed: false
            },
            d:{
                pressed: false
            },
            e:{
                pressed: false
            }
        };
        this.mouse = {
            x: undefined,
            y: undefined,
            fired: false
        }
        window.addEventListener('keydown', (e)=>{
            switch(e.key)
            {
                case 'w':
                    this.keys.w.pressed = true;
                    this.lastKey = e.key;
                    break;
                case 'a':
                    this.keys.a.pressed = true;
                    this.lastKey = e.key;
                    this.horizontal = -1;
                    break;
                case 's':
                    this.keys.s.pressed = true;
                    this.lastKey = e.key;
                    break;
                case 'd':
                    this.keys.d.pressed = true;
                    this.lastKey = e.key;
                    this.horizontal = 1;
                    break;
                case 'e':
                    this.keys.e.pressed = true;
                    this.lastKey = 'e';
                    break;
            }
        });
        window.addEventListener('keyup', (e)=>{
            switch(e.key)
            {
                case 'w':
                    this.keys.w.pressed = false;
                    break;
                case 'a':
                    this.keys.a.pressed = false;
                    this.horizontal = 0;
                    break;
                case 's':
                    this.keys.s.pressed = false;
                    break;
                case 'd':
                    this.keys.d.pressed = false;
                    this.horizontal = 0;
                    break;
            }
        })
        window.addEventListener('click', (e)=>{
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouse.fired = true;
        });

    }
}

class Explosion{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.lifeTime = 0;
        this.sprite = new Image();
        this.frameWidth = 74;
        this.frameHeight = 75;
        this.frame = 0;
        this.sprite.src = './Default size/Effects/explosion1-Sheet.png';
    }
    Update(deltaTime){
        if(this.lifeTime>=100) this.frame = 1;
        if(this.lifeTime>=150) this.frame = 2;
        if(this.lifeTime>=200) this.frame = 1;
        //if(this.lifeTime>=250) this.frame = 0;
        this.lifeTime += deltaTime;
    }
    Draw(context){
        context.drawImage(this.sprite, this.frameWidth*this.frame, 0, this.frameWidth, this.frameHeight, this.x-(this.frameWidth)/2, this.y-(this.frameHeight)/2, this.frameWidth, this.frameHeight);
    }
}