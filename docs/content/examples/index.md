---
date: 2016-07-20T17:39:41-06:00
title: Examples
---

## Buttons ##
This example demonstrates how to check if the player has just pressed, just released, or is currently holding down a button.

<!--more-->

<div id="game"></div>

~~~
// initialize the screen
var screen = new pxcan("#game");
screen.mode("adapt", 3);
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

<script src="/nigelgame.js"></script>
<script>
    var screen = new pxcan("#game");
    screen.mode("adapt", 3);
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
</script>
