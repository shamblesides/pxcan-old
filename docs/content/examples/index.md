---
date: 2016-07-20T17:39:41-06:00
title: Examples
---

## Buttons ##
This example demonstrates how to check if the player has just pressed, just released, or is currently holding down a button.

<div id="button-example"></div>

~~~
// initialize the screen
var screen = new pxcan("#button-example");
screen.setBackground("black");

// bind a new button called "myButton" to the Z, X, and SPACE keys
screen.bind('myButton', 'z', 'x', ' ');

// each frame...
screen.onFrame = function() {
    // erase the screen
    this.reset();

    // show a red rectangle if the button is FIRST PRESSED during this frame
    if(this.button('myButton').wasPressed) {
        this.fill('red', 0,0, this.width/2,this.height, 1,0);
    }

    // show a blue rectangle if the button is RELEASED during this frame
    //  it is possible for wasPressed and wasReleased to happen during the
    //  same frame, if it was pressed and released quickly
    if(this.button('myButton').wasReleased) {
        this.fill('blue', 0,0, this.width/2,this.height, -1,0);
    }
    
    // write "down" or "not down" depending on if the button is currently down
    if(this.button('myButton').isDown) {
        this.write('down', 0,0);
    }
    else {
        this.write('not down', 0, 0);
    }

    // write the number of frames passed in the bottom right corner
    this.origin(1,1);
    this.write(this.clock, 0,0);
};
~~~

## Touch ##
This example demonstrates a lot of the touch functionality included within pxcan.js by implementing a simple drawing program. 

<div id="touch-example"></div>

~~~
var screen = new pxcan("#touch-example");
screen.setBackground("black");
screen.contextMenu = false;

screen.onReady = function() {
    this.write('draw', 0,0);
};

screen.onFrame = function() {
    if (!this.touch.changed) return;

    var tch = this.touch;
    var color = tch.isRightClick ? 'red': 'white';
    var size = tch.isMouse? 1 : 10;

    if (tch.moved && tch.isDown) {
        drawLine(this, color, size, tch.last.bounded().x, tch.last.bounded().y, tch.bounded().x, tch.bounded().y);
    }
    else if (tch.wasStarted) {
        this.fill(color, tch.x, tch.y, size, size);
    }
    else if (tch.wasReleased && tch.isDrag) {
        drawLine(this, 'gray', size, tch.start.x, tch.start.y, tch.x, tch.y);
    }
    else if (tch.wasInterrupted) {
        this.fill('orange');
    }
    else if (!tch.inBounds && tch.last && tch.last.inBounds) {
        this.write('out of bounds', 0,0);
    }
};

function drawLine(screen, color, size, x0,y0, x1,y1) {
    var dx = Math.abs(x1-x0);
    var dy = Math.abs(y1-y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx-dy;

    while(true){
    screen.fill(color, x0,y0, size,size);

    if ((x0==x1) && (y0==y1)) break;
        var e2 = 2*err;
        if (e2 >-dy){ err -= dy; x0  += sx; }
        if (e2 < dx){ err += dx; y0  += sy; }
    }
}
~~~

## hasFocus ##
A very simple demo to check if the game element has keyboard focus.

<div id="focus-example"></div>

~~~
var screen = new pxcan("#focus-example");
screen.frameskip = 5;

screen.onFrame = function() {
    this.fill(this.hasFocus? 'green': 'red');
    this.write(this.clock, 0,0);
};
~~~


<script src="/pxcan.js"></script>
<script>
    var screen = new pxcan("#button-example");
    screen.setBackground("black");
    screen.bind('myButton', 'z', 'x', ' ');

    screen.frameskip = 5;
    
    screen.onFrame = function() {
        this.reset();

        if(this.button('myButton').wasPressed) {
            this.fill('red', 0,0, this.width/2,this.height, 1,0);
        }

        if(this.button('myButton').wasReleased) {
            this.fill('blue', 0,0, this.width/2,this.height, -1,0);
        }
        
        if(this.button('myButton').isDown) {
            this.write('down', 0,0);
        }
        else {
            this.write('not down', 0, 0);
        }

        this.origin(1,1);
        this.write(this.clock, 0,0);
    };

    screen = new pxcan("#touch-example");
    screen.setBackground("black");
    screen.contextMenu = false;

    screen.onReady = function() {
        this.write('draw', 0,0);
    };

    screen.onFrame = function() {
        if (!this.touch.changed) return;

        var tch = this.touch;
        var color = tch.isRightClick ? 'red': 'white';
        var size = tch.isMouse? 1 : 10;

        if (tch.moved && tch.isDown) {
            drawLine(this, color, size, tch.last.bounded().x, tch.last.bounded().y, tch.bounded().x, tch.bounded().y);
        }
        else if (tch.wasStarted) {
            this.fill(color, tch.x, tch.y, size, size);
        }
        else if (tch.wasReleased && tch.isDrag) {
            drawLine(this, 'gray', size, tch.start.x, tch.start.y, tch.x, tch.y);
        }
        else if (tch.wasInterrupted) {
            this.fill('orange');
        }
        if (!tch.inBounds && tch.last && tch.last.inBounds) {
            this.write('out of bounds', 0,0);
        }
    };

    function drawLine(screen, color, size, x0,y0, x1,y1) {
        var dx = Math.abs(x1-x0);
        var dy = Math.abs(y1-y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        while(true){
        screen.fill(color, x0,y0, size,size);

        if ((x0==x1) && (y0==y1)) break;
            var e2 = 2*err;
            if (e2 >-dy){ err -= dy; x0  += sx; }
            if (e2 < dx){ err += dx; y0  += sy; }
        }
    }

    screen = new pxcan("#focus-example");
    screen.frameskip = 5;

    screen.onFrame = function() {
        this.fill(this.hasFocus? 'green': 'red');
        this.write(this.clock, 0,0);
    };
</script>
