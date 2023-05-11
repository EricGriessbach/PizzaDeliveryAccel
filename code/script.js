const gameContainer = document.getElementById("gameContainer");
const toggleMappingButton = document.getElementById("toggleMapping");
const instructions = document.getElementById("instructions");
const pointsReceivedDisplay = document.getElementById("pointsReceived");
const canvas = document.getElementById("gameCanvas");
const scoreDisplay = document.getElementsByClassName("scoreDisplay")[0];
const scoreSpan = document.getElementById("score");
const startGameButton = document.getElementById("startGame");
const instructionsPage = document.getElementById("instructionsPage");

const ctx = canvas.getContext('2d');
let score = 0;
let startTime = new Date().getTime();

const carImg = new Image();
carImg.src = 'Images/car.svg';  // replace with the actual path to your car image
const targetImg = new Image();
targetImg.src = 'Images/pizza.svg'; // replace with the URL of your target image

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let trials = 0;
const maxTrials = 5;
const breakDuration = 10; // 30 seconds
let breakTime = breakDuration;
let blockScores = [];
let onBreak = false;

let gameStarted = false;

const form = document.getElementById('form');
const registrationForm = document.getElementById('registrationForm');

form.addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent the form from submitting normally

  // Generate the identifier based on the form inputs
  const identifier = form.street.value.charAt(0) +
                     form.surname.value.charAt(0) +
                     form.age.value.toString().charAt(0) +
                     form.city.value.charAt(0) +
                     form.hobby.value.charAt(0) +
                     form.birthday.value.toString().charAt(0);
  
  // Store the identifier in localStorage or send it to a server
  localStorage.setItem('identifier', identifier);

  // Hide the registration form and show the game container
  registrationForm.style.display = 'none';
  gameContainer.style.display = 'block';
  
  drawInstructions(); // Draw the instructions after the form is submitted
});


const circle = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 10, // Half the size
    speed: 6,
    vx: 0, // New property for velocity in x direction
    vy: 0, // New property for velocity in y direction
    ax: 0, // New property for acceleration in x direction
    ay: 0, // New property for acceleration in y direction
};

const target = {
    x: 0,
    y: 0,
    size: 15 // Half the size
};

const keys = {};

// Key mappings
const mappings = [
  { w: 'left', s: 'right', j: 'up', l: 'down' },
  { w: 'up', s: 'down', j: 'left', l: 'right' }
];
let currentMapping = 0;

function setTargetPosition() {
  target.x = Math.random() * (canvas.width - target.size);
  target.y = Math.random() * (canvas.height - target.size);
}

function drawCar() {
  ctx.save(); // save the unrotated context

  // translate to the center of the car
  ctx.translate(circle.x, circle.y);

  // rotate the canvas to the angle of the car
  let angle = Math.atan2(circle.vy, circle.vx);
  ctx.rotate(angle); // add Math.PI / 2 if your car image is oriented to the top

  // draw the car on the rotated canvas
  ctx.drawImage(carImg, -circle.size, -circle.size, circle.size * 5, circle.size * 3);

  ctx.restore(); // restore the context to its unrotated state
}

function drawTarget() {
ctx.drawImage(targetImg, target.x - target.size, target.y - target.size, target.size * 2, target.size * 2);
}   


function checkCollision() {
  const distance = Math.sqrt((circle.x - target.x) ** 2 + (circle.y - target.y) ** 2);
  if (distance < circle.size + target.size) {
    const currentTime = new Date().getTime();
    const timeTaken = (currentTime - startTime) / 1000;
    startTime = currentTime;
    const currentScore = calculateScore(timeTaken);
    score += currentScore;
    scoreDisplay.textContent = score;
    setTargetPosition();
    trials += 1; // Increment the trial count
    if (trials >= maxTrials) {
      startBreak();
    }
  }
}

function calculateScore(timeTaken) {
  let points;
  if (timeTaken <= 0.2) {
    points = 100;
  } else if (timeTaken <= 3) {
    points = Math.round(100 - (timeTaken - 0.2) * (100 - 20) / (3 - 0.2));
  } else {
    points = 20;
  }
    showPointsReceived(points);
    return points;
  }

function showPointsReceived(points) {
    pointsReceivedDisplay.textContent = `+${points}`;
    pointsReceivedDisplay.style.display = 'block';

    setTimeout(() => {
      pointsReceivedDisplay.style.display = 'none';
    }, 500);
  }
  function keepCircleInBounds() {
    if (circle.x - circle.size < 0) {
        circle.x = circle.size;
        circle.vx = 0; // Reset velocity in x direction
    }
    if (circle.x + circle.size > canvas.width) {
        circle.x = canvas.width - circle.size;
        circle.vx = 0; // Reset velocity in x direction
    }
    if (circle.y - circle.size < 0) {
        circle.y = circle.size;
        circle.vy = 0; // Reset velocity in y direction
    }
    if (circle.y + circle.size > canvas.height) {
        circle.y = canvas.height - circle.size;
        circle.vy = 0; // Reset velocity in y direction
    }
}

function handleKeyDown(event) {
keys[event.key] = true; // Set the pressed key to true
if (onBreak && event.key === " " && breakTime <= 0) {
    onBreak = false;
    breakTime = breakDuration;
    window.removeEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleKeyDown); // Reattach handleKeyDown event listener
    window.addEventListener("keyup", handleKeyUp);
}
}

function handleKeyUp(event) {
    keys[event.key] = false; // Set the released key to false
}

function update() {
ctx.clearRect(0, 0, canvas.width, canvas.height);

if (onBreak) {
    drawBreakInfo();
} else {
    if (trials >= maxTrials) {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        startBreak();
    }

    if (breakTime < breakDuration) {
        drawBreakInfo();
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update circle position based on pressed keys and current mapping
        const mapping = mappings[currentMapping];
        if (keys['w']) moveCircle(mapping.w);
        if (keys['s']) moveCircle(mapping.s);
        if (keys['j']) moveCircle(mapping.j);
        if (keys['l']) moveCircle(mapping.l);

        
        // Update velocity based on acceleration
        circle.vx += circle.ax;
        circle.vy += circle.ay;

        // Update position based on velocity
        circle.x += circle.vx;
        circle.y += circle.vy;

        // Reset acceleration for the next frame
        circle.ax = 0;
        circle.ay = 0;

        keepCircleInBounds();
        checkCollision();
        drawCar();
        drawTarget();
    }
}
requestAnimationFrame(update);
}

// Move the circle based on the direction
function moveCircle(direction) {
  const acceleration = 0.05; // Adjust as needed to change the responsiveness of the controls
  switch (direction) {
    case 'left':
      circle.ax -= acceleration;
      break;
    case 'right':
      circle.ax += acceleration;
      break;
    case 'up':
      circle.ay -= acceleration;
      break;
    case 'down':
      circle.ay += acceleration;
      break;
  }
}

// Draw the instructions on the canvas.
function drawInstructions() {
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Pizza Delivery Game", canvas.width / 2, canvas.height / 2 - 180);
  ctx.fillText("Your task is to deliver all pizzas as fast as possible.", canvas.width / 2, canvas.height / 2 - 130);
  ctx.fillText("The current deliver spot is marked by a pizza slice.", canvas.width / 2, canvas.height / 2 - 80);
  ctx.fillText('Accelerate your car with "w", "s", "j", and "l" to drive to the deliver spot.', canvas.width / 2, canvas.height / 2 - 30);
  ctx.fillText("The faster you are, the higher the tip will be.", canvas.width / 2, canvas.height / 2 + 20);
  // Draw the Start Game button
  ctx.fillStyle = "lightgray";
  ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 + 120, 200, 50); 
  ctx.fillStyle = "black";
  ctx.fillText("Start Game", canvas.width / 2, canvas.height / 2 + 150);
  // Draw the car and pizza images
  ctx.drawImage(carImg, 20, 40, 100, 60);
  ctx.drawImage(targetImg, canvas.width - 120, 30, 100, 100);
}


// Handle a mouse click on the canvas.
canvas.addEventListener('click', function(event) {
  // Here, we scale the mouse coordinates from the event's clientX and clientY
  // to match the actual canvas size, which can differ due to CSS styling.
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  // Check if the click is within the bounds of the Start Game button.
  if (!gameStarted && x >= canvas.width / 2 - 50 && x <= canvas.width / 2 + 50 && y >= canvas.height / 2 + 120 && y <= canvas.height / 2 + 170) {
    gameStarted = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    setTargetPosition();
    update();
  }
});


// Start the break
function startBreak() {
  onBreak = true;
  blockScores.push(score);
  score = 0;
  scoreDisplay.textContent = score;
  trials = 0;

  const breakInterval = setInterval(() => {
    breakTime -= 1;
    if (breakTime <= 0) {
      clearInterval(breakInterval);
      window.addEventListener("keydown", handleKeyDown);
    }
  }, 1000);
}

// Draw the break info
function drawBreakInfo() {

  // Reset the position, velocity and acceleration
    circle.x = canvas.width / 2;
    circle.y = canvas.height / 2;
    circle.vx = 0;
    circle.vy = 0;
    circle.ax = 0;
    circle.ay = 0;

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Block Score: ${blockScores[blockScores.length - 1]}`, canvas.width / 2, canvas.height / 2 - 50);
  ctx.fillText(`Highest Block Score: ${Math.max(...blockScores)}`, canvas.width / 2, canvas.height / 2);
  ctx.fillText(`Break Time Remaining: ${breakTime}s`, canvas.width / 2, canvas.height / 2 + 50);
  
  if (breakTime <= 0) {
    ctx.fillText("Press Space to continue", canvas.width / 2, canvas.height / 2 + 100);
  }
}


toggleMappingButton.addEventListener('click', () => {
  currentMapping = (currentMapping + 1) % mappings.length;
});

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
