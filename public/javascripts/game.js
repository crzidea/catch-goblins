function game(res) {
  var monstersCaught = res.score || 0;
  // Create the canvas
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // canvas.width = 512;
  // canvas.height = 480;
  var canvasCenter = {
    x: canvas.width / 2,
    y: canvas.height / 2
  }
  document.body.appendChild(canvas);
  window.addEventListener('touchmove', function (e) {
    e.preventDefault();
  })

  var edge = 32;
  // Background image
  var bgReady = false;
  var bgImage = new Image();
  bgImage.onload = function () {
    bgReady = true;
  };
  bgImage.src = "images/background.png";

  // Hero image
  var heroReady = false;
  var heroImage = new Image();
  heroImage.onload = function () {
    heroReady = true;
  };
  heroImage.src = "images/hero.png";

  // Monster image
  var monsterReady = false;
  var monsterImage = new Image();
  monsterImage.onload = function () {
    monsterReady = true;
  };
  monsterImage.src = "images/monster.png";

  // Monster image
  var trapReady = false;
  var trapImage = new Image();
  trapImage.onload = function () {
    trapReady = true;
  };
  trapImage.src = "images/trap.png";

  // Game objects
  var hero = {
    x: canvasCenter.x,
    y: canvasCenter.y,
    turningX: false,
    turningY: false,
    speed: 256 // movement in pixels per second
  };
  var monster = {};
  var trap = {};

  var xhr = new XMLHttpRequest;
  xhr.onload = function () {
    try {
      monstersCaught = JSON.parse(xhr.response).score;
    } catch (e) {
      console.log(e);
    };
  }

  // Movement
  var vector = {
    x: 0,
    y: 0
  };
  // Handle keyboard controls
  var keysDown = {};

  addEventListener("keydown", function (e) {
    // keysDown[e.keyCode] = true;
    switch (e.keyCode) {
    case 37: // left
      vector.x = -1;
      break
    case 38: // up
      vector.y = -1;
      break
    case 39: // right
      vector.x = 1;
      break
    case 40: // down
      vector.y = 1;
      break
    }
  }, false);

  // Add touch device support
  canvas.addEventListener('touchstart', function (e) {
    var touch = e.touches[0];
    var canvas = document.getElementsByTagName('canvas')[0];
    vector = {
      x: touch.pageX - canvas.offsetTop > hero.x ? 1 : -1,
      y: touch.pageY - canvas.offsetLeft > hero.y ? 1 : -1
    };
  })
  // canvas.addEventListener('touchend', function (e) {
  //   console.log(e);
  // })


  // Reset the game when the player catches a monster
  var reset = function () {

    // Throw the monster somewhere on the screen randomly
    monster.x = 64 + (Math.random() * (canvas.width - 160));
    monster.y = 64 + (Math.random() * (canvas.height - 160));

    if (checkCollision(monster)) {
      return reset();
    }

    /**
     * Get trap position
     * x:     y:
     * 0 0 0  0 1 2
     * 1   1  0   2
     * 2 2 2  0 1 2
     */
    do {
      var posX = Math.floor(Math.random() * 3);
      var posY = Math.floor(Math.random() * 3);
    } while (posX == posY && 1 == posX)

    trap.x = monster.x + edge * (posX - 1);
    trap.y = monster.y + edge * (posY - 1);

    if (checkCollision(trap)) {
      return reset();
    }

  };


  var score = function () {
    xhr.open('post', '/api/score', true);
    xhr.send();
  }

  var checkCollision = function (thing) {
    return hero.x <= (thing.x + edge) &&
      thing.x <= (hero.x + edge) &&
      hero.y <= (thing.y + edge) &&
      thing.y <= (hero.y + edge)
  }

  // Update game objects
  var update = function (modifier) {
    hero.x += vector.x * hero.speed * modifier;
    hero.y += vector.y * hero.speed * modifier;

    // Are they touching?
    if (checkCollision(monster)) {
      score();
      reset();
    }

    if (checkCollision(trap)) {
      hero.x = canvasCenter.x;
      hero.y = canvasCenter.y;
      vector.x = vector.y = 0;
      reset();
    }

    // Are we out?
    if (hero.x + edge * 2 >= canvas.width) {
      vector.x = -1;
    } else if (hero.x - edge <= 0) {
      vector.x = 1;
    }
    if (hero.y + edge * 2 >= canvas.height) {
      vector.y = -1;
    } else if (hero.y - edge <= 0) {
      vector.y = 1;
    }

  };

  // Draw everything
  var render = function (modifier) {
    update(modifier);

    if (bgReady) {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }

    if (heroReady) {
      ctx.drawImage(heroImage, hero.x, hero.y);
    }

    if (monsterReady) {
      ctx.drawImage(monsterImage, monster.x, monster.y);
    }

    if (trapReady) {
      ctx.drawImage(trapImage, trap.x, trap.y);
    }

    // Score
    ctx.fillStyle = "rgb(250, 250, 250)";
    ctx.font = "24px Helvetica";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Score: " + monstersCaught, edge, edge);
    // Top 3 players
    var rankTop = edge;
    top3.forEach(function (player, rank) {
      ctx.fillStyle = "rgb(230, 230, 230)";
      var fontSize = 26 - rank * 5;
      ctx.font = fontSize + "px Helvetica";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      var text = player.name + " " + player.score;
      ctx.fillText(text, canvas.width - edge, rankTop);
      rankTop += fontSize + 5;
    });

    // Chat message
    if (chatMsgAlpha > 0) {
      ctx.fillStyle = "rgba(210, 210, 210, " + chatMsgAlpha + ")";
      ctx.font = "italic 24px Arial";
      // ctx.fillText(chatMsg, edge, canvas.width * 2 - edge * 2);
      ctx.fillText(chatMsg, edge, canvas.height - edge * 3);
      chatMsgAlpha -= 0.2 * modifier; // decrease opacity (fade out)
    }
  };

  // The main game loop
  var main = function () {
    var now = Date.now();
    var delta = now - then;

    render(delta / 1000);

    then = now;
    setTimeout(main, 1);
  };

  // Let's play this game!
  reset();
  var then = Date.now();
  // setInterval(main, 1); // Execute as fast as possible

  var chatMsg = '';
  var chatMsgAlpha = 0;
  var top3 = [];
  // use channel
  var channel = new Channel(res.chOpts);
  channel.onmessage = function (msg) {
    var obj = JSON.parse(msg.data);
    switch (msg.topic) {
    case 'chat':
      chatMsg = '[' + obj.name + ']:' + obj.msg;
      chatMsgAlpha = 1;
      break
    case 'rank':
      top3 = obj;
      break
    }
  }

  var textInput = document.createElement('input');
  textInput.style.position = 'absolute';
  textInput.style.height = edge + 'px';
  textInput.style.width = canvas.width + 'px';
  textInput.style.left = '0px';
  textInput.style.top = canvas.height - edge + 'px';
  var textInputUnactive = textInput.style.opacity = 0.3;
  var textInputActive = 0.9;
  // textInput.style.fontSize = edge + 'px';
  textInput.onfocus = function () {
    this.style.opacity = textInputActive;
  }
  textInput.onblur = function () {
    this.style.opacity = textInputUnactive;
  }
  var xhrChat = new XMLHttpRequest;
  textInput.onkeyup = function (e) {
    if (e.keyCode == 13) {
      xhrChat.open('post', '/api/chat', true);
      xhrChat.setRequestHeader('Content-Type', 'application/json')
      xhrChat.send(JSON.stringify({
        msg: textInput.value
      }));
      textInput.value = '';
    }
  }
  document.body.appendChild(textInput);
  main();
}
