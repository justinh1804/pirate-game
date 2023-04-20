const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
window.addEventListener('load', ()=>{

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const game = new Game(canvas.width, canvas.height);
let lastTime = 0;

function Initialize(){
    game.playersArray.push(new Player(canvas.width/2, canvas.height/2, game, './Default size/Ships/ship (4).png'));
    game.Initialize();
}
function Animate(timeStamp){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let deltaTime = timeStamp-lastTime;
    lastTime = timeStamp;
    
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
        this.map = new Map(4096, 4096, './Default size/pirate_map.png');
        this.camera = new Camera(0, 0, this.width, this.height, this.map.image.width, this.map.image.height);
        this.playersArray = [];
        this.explosionsArray = [];
    }
    Initialize(){
        this.playersArray.forEach(player=>player.Initialize());
        this.camera.follow(this.playersArray[0], this.width/2, this.height/2);
    }
    Update(deltaTime){
        this.camera.update();
        this.playersArray.forEach(player=>player.Update(deltaTime));
        this.explosionsArray.forEach((explosion, i)=>{
            explosion.Update(deltaTime);
            if(explosion.lifeTime>=300) this.explosionsArray.splice(i, 1);
        });
    }
    Draw(context){
        this.map.draw(context, this.camera.xView, this.camera.yView);
        this.playersArray.forEach(player=>player.Draw(context, this.camera.xView, this.camera.yView));
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
        this.turnSpeed = 0.0012;
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
        this.x += this.speed*(this.directionX*=this.friction)*deltaTime;
        this.y += this.speed*(this.directionY*=this.friction)*deltaTime;
        clamp(this.x, 0, 4096);
        clamp(this.y, 0, 4096);
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
            this.cannonBalls.push(new CannonBall(this.x, this.y, './Default size/Ship parts/cannonBall.png', this.cannonAngle, this));
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
            this.speed = -0.1;
            this.turnSpeed = 0.001;
            this.inputHandler.keys.w.pressed = false;
            this.pressedOnce = true;
        }
        else if(this.inputHandler.keys.w.pressed && !this.isAnchored && this.pressedOnce && !this.pressedTwice){
            this.speed = -0.15;
            this.turnSpeed = 0.0008;
            this.inputHandler.keys.w.pressed = false;
            this.pressedTwice = true;
        }
        else if(this.inputHandler.keys.w.pressed && !this.isAnchored && this.pressedOnce && this.pressedTwice && !this.pressedThrice){
            this.speed = -0.2;
            this.turnSpeed = 0.00075;
            this.inputHandler.keys.w.pressed = false;
            this.pressedThrice = true;
        }
    }
    handleDecel(){
        if(this.inputHandler.keys.s.pressed && this.pressedOnce && this.pressedTwice && this.pressedThrice){
            this.speed = -0.15;
            this.turnSpeed = 0.0008;
            this.inputHandler.keys.s.pressed = false;
            this.pressedThrice = false;
        }
        if(this.inputHandler.keys.s.pressed && this.pressedOnce && this.pressedTwice){
            this.speed = -0.1;
            this.turnSpeed = 0.001;
            this.inputHandler.keys.s.pressed = false;
            this.pressedTwice = false;
        }
        if(this.inputHandler.keys.s.pressed && this.pressedOnce){
            this.speed = -0.02;
            this.turnSpeed = 0.0012;
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
    Draw(context, xView, yView){
        context.save();
        context.translate(this.x-xView, this.y-yView);
        context.rotate((this.angle-Math.PI/2)-Math.PI);
        context.drawImage(this.image, -(this.image.width)/2, -(this.image.height)/2);
        context.restore();
        this.cannonBalls.forEach(cannonBall=>{
            cannonBall.Draw(context);
        });
    }
}

class CannonBall{
    constructor(x, y, imageSRC, cannonAngle, player){
        this.x = x;
        this.y = y;
        this.lifeTime = 0;
        this.directionX = 0;
        this.directionY = 0;
        this.image = new Image();
        this.image.src = imageSRC;
        this.cannonAngle = cannonAngle;
        this.cannonSpeed = 0.3;
        this.radius = 0;
        this.player = player;
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
            let pos = getMousePos(canvas, e);
            let matrix = ctx.getTransform();
            let imatrix = matrix.invertSelf();
            console.log(imatrix)

            this.mouse.x = pos.x * imatrix.a + pos.y * imatrix.c + imatrix.e;
            this.mouse.y = pos.x * imatrix.b + pos.y * imatrix.d + imatrix.f;
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

class Rectangle{
    constructor(left, top, width, height){
        this.left = left || 0;
        this.top = top || 0;
        this.width = width || 0;
        this.height = height || 0;
        this.right = this.left + this.width;
        this.bottom = this.top + this.height;
    }
    
    set(left, top, /*optional*/width, /*optional*/height){
        this.left = left;
        this.top = top;
        this.width = width || this.width;
        this.height = height || this.height
        this.right = (this.left + this.width);
        this.bottom = (this.top + this.height);
    }
    
    within(r) {
        return (r.left <= this.left && 
                r.right >= this.right &&
                r.top <= this.top && 
                r.bottom >= this.bottom);
    }		
    
    overlaps(r) {
        return (this.left < r.right && 
                r.left < this.right && 
                this.top < r.bottom &&
                r.top < this.bottom);
    }
}	

class Camera{
// Camera constructor
constructor(xView, yView, canvasWidth, canvasHeight, worldWidth, worldHeight)
{
        // possibles axis to move the camera
        this.AXIS = {
            NONE: "none", 
            HORIZONTAL: "horizontal", 
            VERTICAL: "vertical", 
            BOTH: "both"
        };
        // position of camera (left-top coordinate)
        this.xView = xView || 0;
        this.yView = yView || 0;
        
        // distance from followed object to border before camera starts move
        this.xDeadZone = 0; // min distance to horizontal borders
        this.yDeadZone = 0; // min distance to vertical borders
        
        // viewport dimensions
        this.wView = canvasWidth;
        this.hView = canvasHeight;			
        
        // allow camera to move in vertical and horizontal axis
        this.axis = this.AXIS.BOTH;	
    
        // object that should be followed
        this.followed = null;
        
        // rectangle that represents the viewport
        this.viewportRect = new Rectangle(this.xView, this.yView, this.wView, this.hView);				
                            
        // rectangle that represents the world's boundary (room's boundary)
        this.worldRect = new Rectangle(0, 0, worldWidth, worldHeight);			
    }

    // gameObject needs to have "x" and "y" properties (as world(or room) position)
    follow(gameObject, xDeadZone, yDeadZone)
    {		
        this.followed = gameObject;	
        this.xDeadZone = xDeadZone;
        this.yDeadZone = yDeadZone;
    }					
    
    update()
    {
        // keep following the player (or other desired object)
        if(this.followed != null)
        {		
            if(this.axis == this.AXIS.HORIZONTAL || this.axis == this.AXIS.BOTH)
            {		
                // moves camera on horizontal axis based on followed object position
                if(this.followed.x - this.xView  + this.xDeadZone > this.wView)
                    this.xView = this.followed.x - (this.wView - this.xDeadZone);
                else if(this.followed.x  - this.xDeadZone < this.xView)
                    this.xView = this.followed.x  - this.xDeadZone;
                
            }
            if(this.axis == this.AXIS.VERTICAL || this.axis == this.AXIS.BOTH)
            {
                // moves camera on vertical axis based on followed object position
                if(this.followed.y - this.yView + this.yDeadZone > this.hView)
                    this.yView = this.followed.y - (this.hView - this.yDeadZone);
                else if(this.followed.y - this.yDeadZone < this.yView)
                    this.yView = this.followed.y - this.yDeadZone;
            }						
            
        }		
        
        // update viewportRect
        this.viewportRect.set(this.xView, this.yView);
        
        // don't let camera leaves the world's boundary
        if(!this.viewportRect.within(this.worldRect))
        {
            if(this.viewportRect.left < this.worldRect.left)
                this.xView = this.worldRect.left;
            if(this.viewportRect.top < this.worldRect.top)					
                this.yView = this.worldRect.top;
            if(this.viewportRect.right > this.worldRect.right)
                this.xView = this.worldRect.right - this.wView;
            if(this.viewportRect.bottom > this.worldRect.bottom)					
                this.yView = this.worldRect.bottom - this.hView;
        }
        
    }	
}

// wrapper for "class" Map
class Map{
    constructor(width, height, imageSRC){
        // map dimensions
        this.width = width;
        this.height = height;
        
        // map texture
        this.image = new Image();
        this.image.src = imageSRC;
    }
    
    // draw the map adjusted to camera
    draw(context, xView, yView){					
        // easiest way: draw the entire map changing only the destination coordinate in canvas
        // canvas will cull the image by itself (no performance gaps -> in hardware accelerated environments, at least)
        //context.drawImage(this.image, 0, 0, this.image.width, this.image.height, -xView, -yView, this.image.width, this.image.height);
        
        // didactic way:
        
        var sx, sy, dx, dy;
        var sWidth, sHeight, dWidth, dHeight;
        
        // offset point to crop the image
        sx = xView;
        sy = yView;
        
        // dimensions of cropped image			
        sWidth =  context.canvas.width;
        sHeight = context.canvas.height;

        // if cropped image is smaller than canvas we need to change the source dimensions
        if(this.image.width - sx < sWidth){
            sWidth = this.image.width - sx;
        }
        if(this.image.height - sy < sHeight){
            sHeight = this.image.height - sy; 
        }
        
        // location on canvas to draw the croped image
        dx = 0;
        dy = 0;
        // match destination with source to not scale the image
        dWidth = sWidth;
        dHeight = sHeight;									
        
        context.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);			
    }
}

function clamp(value, min, max){
    if(value < min) return min;
    else if(value > max) return max;
    return value;
}

function  getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for x
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y
        
    return {
      x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
      y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    }
  }