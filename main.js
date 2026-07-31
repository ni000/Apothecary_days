// Game Constants
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const PLAYER_SPEED = 400; // pixels per second
const NPC_SPEED = 150;

// Game State Enum
const GameState = { MENU: 'MENU', TRANSITION: 'TRANSITION', GAMEPLAY: 'GAMEPLAY', DIALOGUE: 'DIALOGUE' };
let currentState = GameState.MENU;

// DOM Elements
const startBtn = document.getElementById('start-btn');
const mainMenu = document.getElementById('main-menu');
const exteriorBg = document.getElementById('exterior-bg');
const interiorBg = document.getElementById('interior-bg');
const hud = document.getElementById('hud');
const dialogueUI = document.getElementById('dialogue-ui');
const dialogueText = document.getElementById('dialogue-text');
const dialoguePrompt = document.querySelector('.dialogue-prompt');
const interactionPrompt = document.getElementById('interaction-prompt');

// Canvas Setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Input Handling
const keys = { w: false, a: false, s: false, d: false, e: false };
const keysPressed = { e: false };

function handleKeyDown(e) {
  let key = e.key.toLowerCase();
  
  // Map arrow keys
  if (e.key === 'ArrowUp') key = 'w';
  if (e.key === 'ArrowDown') key = 's';
  if (e.key === 'ArrowLeft') key = 'a';
  if (e.key === 'ArrowRight') key = 'd';
  
  // Map codes for bulletproof input
  if (e.code === 'KeyW' || e.code === 'ArrowUp') key = 'w';
  if (e.code === 'KeyS' || e.code === 'ArrowDown') key = 's';
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') key = 'a';
  if (e.code === 'KeyD' || e.code === 'ArrowRight') key = 'd';
  if (e.code === 'KeyE') key = 'e';

  if (key in keys) {
    keys[key] = true;
    if (key === 'e') {
      keysPressed.e = true;
    }
  }
}

function handleKeyUp(e) {
  let key = e.key.toLowerCase();
  
  if (e.key === 'ArrowUp') key = 'w';
  if (e.key === 'ArrowDown') key = 's';
  if (e.key === 'ArrowLeft') key = 'a';
  if (e.key === 'ArrowRight') key = 'd';
  
  if (e.code === 'KeyW' || e.code === 'ArrowUp') key = 'w';
  if (e.code === 'KeyS' || e.code === 'ArrowDown') key = 's';
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') key = 'a';
  if (e.code === 'KeyD' || e.code === 'ArrowRight') key = 'd';

  if (key in keys) {
    keys[key] = false;
  }
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Color Maps for Sprites
const playerColorMap = {
  'k': '#4A3B32', // Soft dark outline
  'h': '#753b3b', // Dark brown hair
  'H': '#b35959', // Hair highlight
  's': '#ffcc99', // Skin
  'S': '#e6a873', // Skin shade
  'g': '#477a3d', // Green vest
  'r': '#8b2b2b', // Red shirt
  'p': '#706b70', // Grey pants
  'd': '#5e4033', // Shoes
  '.': null
};

// Player Sprite based on user reference
const playerSprite = [
  ".....kkkkkk.....",
  "...kkhhhhhhkk...",
  "..khhhhhhhhHhk..", 
  ".khhhhhhhhhhhhHk.",
  ".khhhkkhhhkkhhhk.",
  ".khhkSShkSShkHhk.",
  ".khkssssssssskhk.",
  ".khkssssssssskhk.",
  ".kkkssssssssskkk.",
  ".k.ksskkkkkssk.k.",
  "kk.kkssssssskk.kk",
  "krrkkgggggggkkrrk",
  "krkkgkgggggkgkkrk",
  "krkkgkgggggkgkkrk",
  "krkkgkgggggkgkkrk",
  "kkkkgggggggggkkkk",
  ".k..kpppppppk..k.",
  ".k..kpppppppk..k.",
  ".k..kpppppppk..k.",
  ".k..kpppppppk..k.",
  "....kpppppppk....",
  "...kkdddkdddkk...",
  "...kddddkddddk...",
  "...kkkkkkkkkkk..."
];

// NPC Sprite (recolored variant)
const npcColorMap = {
  'k': '#4A3B32',
  'h': '#4a4a4a', // Grey hair
  'H': '#7a7a7a', 
  's': '#f2d5c4', // Skin
  'S': '#d6b39a', 
  'g': '#3d5a80', // Blue vest
  'r': '#98c1d9', // Light blue shirt
  'p': '#293241', // Dark pants
  'd': '#000000', // Shoes
  '.': null
};

// Potion sprite based on user reference
const potionSprite = [
  "....kkk....",
  "...kcCck...",
  "...kccck...",
  "..kgggggk..",
  ".kggHllggk.",
  ".kgHHlllHk.",
  "kggHlllllgk",
  "kggHlllllgk",
  "kggHlllllgk",
  ".kgggggggk.",
  "..kkkkkkk.."
];

const potionColorMapTemplate = {
  'k': '#3b7d9b', // Glass outline
  'c': '#8b5a2b', // Cork
  'C': '#a06b3c', // Cork highlight
  'g': '#5ac3e6', // Glass
  'H': '#ffffff', // Highlight
  '.': null
};

// Candle Sprite (7x11)
const candleSprite = [
  "...f...",
  "..fff..",
  "..fyf..",
  "..kwk..",
  ".kccck.",
  "kccccck",
  "kccccck",
  "kccccck",
  "kccccck",
  "kccccck",
  "kkkkkkk"
];
const candleColorMap = {
  'k': '#4A3B32', // Soft dark outline
  'c': '#F5F2EB', // Soft cream wax
  'w': '#8B7355', // Wick
  'f': '#F4C05E', // Orange-yellow flame
  'y': '#FFEAA7', // Flame center
  '.': null
};

// Lantern Sprite (9x11)
const lanternSprite = [
  "....k....",
  "...kkk...",
  "..kmmmk..",
  ".kmmmmmk.",
  ".kggkggk.",
  "kggyyyggk",
  "kgyyyyygk",
  "kggyyyggk",
  ".kggkggk.",
  ".kmmmmmk.",
  "..kkkkk.."
];
const lanternColorMap = {
  'k': '#4A3B32', // Metal outline
  'm': '#8A7A71', // Metal structure (brass)
  'g': '#E0F7FA', // Glass highlights
  'y': '#F4C05E', // Glowing core
  '.': null
};

// Ceramic Jar Sprite (8x9)
const jarSprite = [
  "..kkkk..",
  ".kcccck.",
  ".kcccck.",
  "kcccccck",
  "kcccccck",
  "kcccccck",
  "kcccccck",
  "kcccccck",
  ".kkkkkk."
];
const jarColorMap = {
  'k': '#4A3B32',
  'c': '#D2B48C', // Clay color
  '.': null
};

// Potted Plant Sprite (16x16) - Flowering plant matching user's image
const plantSprite = [
  "......kkkk......",
  "....kkfrrrfkk...",
  "....kffwffrrk...",
  "..kkkkfrrkkkkk..",
  ".kfrrfkskskfrrfk",
  "kffwffrkskffwffr",
  ".kffrkkskkkffrkk",
  "..kkk.ksk..kkk..",
  "...khllskllhk...",
  "....klgkskglk...",
  ".....kkskkk.....",
  "....kbbbbbbk....",
  "..kkkkkkkkkkkk..",
  "..kpupppppppsk..",
  "...kpppppppsk...",
  "...kkkkkkkkkk..."
];
const plantColorMap = {
  'f': '#d43f5e', // Bright pinkish red
  'r': '#a0203b', // Rich burgundy red
  'w': '#ff8da1', // Light pink highlight
  'g': '#1b401c', // Dark forest green
  'l': '#2f7a33', // Rich green
  'h': '#64c268', // Vibrant light green
  's': '#3a3138', // Dark purple-grey pot shadow / stem shadow
  'p': '#5c4c57', // Pot dark purple-grey body
  'u': '#84717e', // Pot highlight grey
  'b': '#6e472b', // Soil brown
  'k': '#1d1511', // Dark outline
  '.': null
};

// Monstera Plant Sprite (32x32) - Custom pixel art matching user's image
const monsteraSprite = [
  "................................",
  "................................",
  "................................",
  "................................",
  ".........kkkkkk..kkkkk..........",
  ".......kkhhlhhkkkhhhlk..........",
  "......khhlllhllhkhllllk.........",
  ".....khlkkllkkllhhlkkk..........",
  "....khlk.kllk.kllhks............",
  "....klg..kllk..kllhks.kkk.......",
  "...klg...kllk...klgkskllhkk.....",
  "...kk....kllk....kksklhllhkk....",
  ".........kllk.....sklhllgghkk...",
  ".........kslk....sklgkkggkkk....",
  "..........sk....sklgk.kggk.kk...",
  "......kkhhks....skll..kggk..kk..",
  ".....khhhhhsk...sk....kggk..kk..",
  ".....kkhhkssk...s.....kggk.kk...",
  ".......kks..s...s.....kggkk.....",
  ".........k..s...s.....kk........",
  ".........kkks...s...............",
  ".........kbbboooobbbbbk.........",
  "........kkddddddddddddkk........",
  "........kppppppppppppppk........",
  "........kppppppppppppppk........",
  "........kkkkkkkkkkkkkkkk........",
  "........kppppppppppppppk........",
  "........kppqpppppppppppk........",
  "........kpppppppqppqpppk........",
  "........kqqqqqqqqqqqqqqk........",
  "........kkkkkkkkkkkkkkkk........",
  "................................"
];
const monsteraColorMap = {
  'k': '#1a241b', // Outline / Black / Shadow
  'g': '#1a4314', // Dark green shadow
  'l': '#2d7a29', // Rich medium green
  'h': '#6cb85c', // Bright green highlight
  's': '#1e541a', // Stem dark green
  'b': '#7c5435', // Soil brown
  'o': '#3d2514', // Dark brown soil shadow
  'p': '#ffffff', // Pot white
  'q': '#e1e5e8', // Pot light grey speckles
  'd': '#b1b6ba', // Pot rim dark grey
  '.': null
};


function drawSprite(ctx, spriteArray, colorMap, x, y, pixelScale) {
  for (let r = 0; r < spriteArray.length; r++) {
    for (let c = 0; c < spriteArray[r].length; c++) {
      const char = spriteArray[r][c];
      const color = colorMap[char];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x + c * pixelScale, y + r * pixelScale, pixelScale, pixelScale);
      }
    }
  }
}

function getPotionColorMap(liquidColor) {
  return { ...potionColorMapTemplate, 'l': liquidColor };
}

// Load custom counter plant image
const plantImage = new Image();
plantImage.src = 'plant.png';

// Load custom corner snake plant image
const snakePlantImage = new Image();
snakePlantImage.src = 'snake_plant.png';

// Load custom flask images
const flaskImages = {
  pink: new Image(),
  blue: new Image(),
  red: new Image(),
  green: new Image()
};
flaskImages.pink.src = 'flask_pink.png';
flaskImages.blue.src = 'flask_blue.png';
flaskImages.red.src = 'flask_red.png';
flaskImages.green.src = 'flask_green.png';

// Load custom book images
const booksTwoImage = new Image();
booksTwoImage.src = 'books_two.png';

const booksThreeImage = new Image();
booksThreeImage.src = 'books_three.png';

// Load custom plant/cactus images
const potCactusImage = new Image();
potCactusImage.src = 'pot_cactus.png';

const potLeafyImage = new Image();
potLeafyImage.src = 'pot_leafy.png';

// Load custom vine image
const vineImage = new Image();
vineImage.src = 'vine.png';

// Generate randomized and equally distributed flask array (13 slots total)
const flaskTypes = ['pink', 'blue', 'red', 'green', 'pink', 'blue', 'red', 'green', 'pink', 'blue', 'red', 'green', 'red'];
for (let i = flaskTypes.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [flaskTypes[i], flaskTypes[j]] = [flaskTypes[j], flaskTypes[i]];
}

function drawFlask(ctx, type, x, y) {
  const img = flaskImages[type];
  if (img && img.complete) {
    ctx.drawImage(img, x, y, 88, 88);
  }
}

// Entities
const pixelScale = 8;
const player = {
  x: CANVAS_WIDTH / 2 - (playerSprite[0].length * pixelScale) / 2,
  y: 350, // Starts behind the counter
  renderWidth: playerSprite[0].length * pixelScale,
  renderHeight: playerSprite.length * pixelScale
};

const npc = {
  x: CANVAS_WIDTH + 100,
  y: 700, // Starts in front of the counter
  targetX: CANVAS_WIDTH / 2 + 250,
  renderWidth: playerSprite[0].length * pixelScale,
  renderHeight: playerSprite.length * pixelScale,
  active: false,
  reachedCounter: false
};

// Light Sources Definitions
const shelfY1 = 160;
const shelfY2 = 280;
const shelfY3 = 400;
const counterY = 520;

const lightSources = [
  { type: 'lantern', x: 180 + 36, y: shelfY1 - 88 + 44, radius: 70 },
  { type: 'lantern', x: 560 + 36, y: shelfY2 - 88 + 44, radius: 70 },
  { type: 'lantern', x: 660 + 36, y: shelfY3 - 88 + 44, radius: 70 },
  { type: 'lantern', x: 1660 + 36, y: shelfY1 - 88 + 44, radius: 70 },
  { type: 'lantern', x: 1200 + 36, y: shelfY2 - 88 + 44, radius: 70 },
  { type: 'lantern', x: 1540 + 36, y: shelfY3 - 88 + 44, radius: 70 },
  { type: 'candle', x: 300 + 28, y: counterY - 88 + 20, radius: 50 },
  { type: 'candle', x: 1300 + 28, y: counterY - 88 + 20, radius: 50 }
];

// Dialogue System
const dialogueString = "Hello! I'm looking for a Willow Bark Decoction.";
let dialogueIndex = 0;
let isTyping = false;
let typeTimer = 0;
const typeDelay = 0.05;

// Start Game Transition
startBtn.addEventListener('click', () => {
  if (currentState !== GameState.MENU) return;
  currentState = GameState.TRANSITION;
  mainMenu.classList.remove('active');
  mainMenu.classList.add('hidden');
  exteriorBg.classList.add('zoom-in');
  
  // Focus the window to ensure immediate WASD control
  window.focus();
  
  setTimeout(() => {
    exteriorBg.classList.remove('active');
    interiorBg.classList.add('active');
    setTimeout(() => {
      exteriorBg.classList.add('hidden');
      hud.classList.remove('hidden');
      currentState = GameState.GAMEPLAY;
      setTimeout(() => { npc.active = true; }, 1000);
    }, 500);
  }, 500);
});

// Main Game Loop
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  update(dt);
  draw();
  keysPressed.e = false;
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  if (currentState === GameState.GAMEPLAY) {
    let dx = 0; let dy = 0;
    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;
    
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length; dy /= length;
    }
    
    player.x += dx * PLAYER_SPEED * dt;
    player.y += dy * PLAYER_SPEED * dt;
    
    // Boundary check: Player is behind the counter
    player.x = Math.max(100, Math.min(CANVAS_WIDTH - 100 - player.renderWidth, player.x));
    player.y = Math.max(280, Math.min(410, player.y)); // Restricts player to back area behind counter
    
    if (npc.active && !npc.reachedCounter) {
      if (npc.x > npc.targetX) npc.x -= NPC_SPEED * dt;
      else npc.reachedCounter = true;
    }
    
    if (npc.reachedCounter) {
      // Robust box-proximity check across the counter
      const xDist = Math.abs((player.x + player.renderWidth/2) - (npc.x + npc.renderWidth/2));
      const yDist = Math.abs((player.y + player.renderHeight/2) - (npc.y + npc.renderHeight/2));
      
      if (xDist < 350 && yDist < 420) {
        interactionPrompt.classList.remove('hidden');
        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        const scaleX = containerRect.width / CANVAS_WIDTH;
        const scaleY = containerRect.height / CANVAS_HEIGHT;
        interactionPrompt.style.left = `${(npc.x + npc.renderWidth/2) * scaleX}px`;
        interactionPrompt.style.top = `${(npc.y) * scaleY}px`;
        
        if (keysPressed.e) startDialogue();
      } else {
        interactionPrompt.classList.add('hidden');
      }
    }
  } else if (currentState === GameState.DIALOGUE) {
    interactionPrompt.classList.add('hidden');
    if (isTyping) {
      typeTimer += dt;
      if (typeTimer >= typeDelay) {
        typeTimer = 0;
        dialogueIndex++;
        dialogueText.textContent = dialogueString.substring(0, dialogueIndex);
        if (dialogueIndex >= dialogueString.length) {
          isTyping = false;
          dialoguePrompt.classList.remove('hidden');
        }
      }
      if (keysPressed.e) {
        dialogueIndex = dialogueString.length;
        dialogueText.textContent = dialogueString;
        isTyping = false;
        dialoguePrompt.classList.remove('hidden');
      }
    } else {
      if (keysPressed.e) {
        dialogueUI.classList.add('hidden');
        currentState = GameState.GAMEPLAY;
      }
    }
  }
}

function startDialogue() {
  currentState = GameState.DIALOGUE;
  dialogueUI.classList.remove('hidden');
  dialoguePrompt.classList.add('hidden');
  dialogueText.textContent = '';
  dialogueIndex = 0;
  isTyping = true;
  typeTimer = 0;
}

function drawBookImage(ctx, image, x, y, width, height, isHorizontal = false, isLeaning = false) {
  if (!image.complete) return;
  ctx.save();
  if (isHorizontal) {
    // Lie horizontal: translate to center, rotate 90 deg clockwise
    ctx.translate(x + height / 2, y - width / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else if (isLeaning) {
    ctx.translate(x + width / 2, y - height / 2);
    ctx.rotate(14 * Math.PI / 180);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
  } else {
    ctx.drawImage(image, x, y - height, width, height);
  }
  ctx.restore();
}

function drawPottedPlant(ctx, x, shelfY, size, seed) {
  // Stable random selection to prevent flickering
  const rand = (Math.sin(seed * 0.05) + 1) / 2;
  const image = rand < 0.5 ? potCactusImage : potLeafyImage;
  if (image.complete) {
    // Offset transparent padding at bottom so pot base rests exactly on shelfY
    const bottomPadding = size * 0.08;
    ctx.drawImage(image, x - (size - 128) / 2, shelfY - size + bottomPadding, size, size);
  }
}

function drawVine(ctx, x, y, targetHeight) {
  if (!vineImage.complete) return;
  
  const targetWidth = 60; // Increased width so leaves are large and visible
  const scale = targetWidth / vineImage.naturalWidth;
  const segmentHeight = vineImage.naturalHeight * scale; // ~282px
  
  ctx.save();
  let drawnHeight = 0;
  while (drawnHeight < targetHeight) {
    const remainingHeight = targetHeight - drawnHeight;
    const drawH = Math.min(segmentHeight, remainingHeight);
    
    // Calculate source height to crop
    const srcH = drawH / scale;
    
    ctx.drawImage(
      vineImage,
      0, 0,
      vineImage.naturalWidth, srcH,
      x - targetWidth / 2, y + drawnHeight,
      targetWidth, drawH
    );
    
    drawnHeight += drawH;
  }
  ctx.restore();
}

function drawBookcase(ctx, x1, x2) {
  ctx.fillStyle = '#8C6239'; // Honey wood base
  ctx.strokeStyle = '#4A2E1B';
  ctx.lineWidth = 4;
  
  const floorY = CANVAS_HEIGHT * 0.6;
  
  // Vertical support columns
  ctx.fillRect(x1, 0, 24, floorY);
  ctx.strokeRect(x1, -4, 24, floorY + 8);
  ctx.fillRect(x2 - 24, 0, 24, floorY);
  ctx.strokeRect(x2 - 24, -4, 24, floorY + 8);
  
  // Honey Wood Highlights on columns
  ctx.fillStyle = '#C89A6A';
  ctx.fillRect(x1 + 4, 0, 4, floorY);
  ctx.fillRect(x2 - 20, 0, 4, floorY);
  
  // Horizontal shelves
  const shelfHeights = [160, 280, 400];
  shelfHeights.forEach(sy => {
    ctx.fillStyle = '#8C6239';
    ctx.fillRect(x1, sy, x2 - x1, 20);
    ctx.strokeRect(x1, sy, x2 - x1, 20);
    
    // Highlight edge
    ctx.fillStyle = '#C89A6A';
    ctx.fillRect(x1, sy + 2, x2 - x1, 4);
  });
}

function drawShopBackground() {
  // 1. Draw Back Wall
  ctx.fillStyle = '#3E2F25'; // Darker cottagecore brown wall
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Wall panel lines
  ctx.strokeStyle = '#2F231B'; // Subtle dark panel lines
  ctx.lineWidth = 4;
  for (let x = 120; x < CANVAS_WIDTH; x += 240) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT * 0.6);
    ctx.stroke();
  }

  // 1.5. Draw background wall vines on either side of the bookcases (organically varied lengths, doubled on outer edges)
  drawVine(ctx, 90, 0, 420);    // Outer Left 1
  drawVine(ctx, 130, 0, 455);   // Outer Left 2
  drawVine(ctx, 770, 0, 480);   // Inner Left (near window)
  drawVine(ctx, 1150, 0, 465);  // Inner Right (near window)
  drawVine(ctx, 1780, 0, 435);  // Outer Right 1
  drawVine(ctx, 1820, 0, 460);  // Outer Right 2

  // 2. Wall Light Falloff (Warm tint pools behind lanterns)
  lightSources.forEach(src => {
    if (src.type === 'lantern') {
      const grad = ctx.createRadialGradient(src.x, src.y, 0, src.x, src.y, 70);
      grad.addColorStop(0, 'rgba(244, 192, 94, 0.45)'); // Warm amber gold tint
      grad.addColorStop(1, 'rgba(244, 192, 94, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(src.x, src.y, 70, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 3. Draw Floor Planks (Warm Honey Oak Wood with Woody Grains and Scratches)
  const floorY = CANVAS_HEIGHT * 0.6;
  const floorHeight = CANVAS_HEIGHT * 0.4;
  const rowHeight = 86;
  const plankRows = [
    { y: floorY, joints: [600, 1400] },
    { y: floorY + rowHeight, joints: [350, 1150] },
    { y: floorY + rowHeight * 2, joints: [800, 1500] },
    { y: floorY + rowHeight * 3, joints: [500, 1300] },
    { y: floorY + rowHeight * 4, joints: [700] }
  ];

  plankRows.forEach((row, rowIndex) => {
    const nextY = rowIndex === 4 ? CANVAS_HEIGHT : row.y + rowHeight;
    const currentHeight = nextY - row.y;
    
    // Define planks by splitting screen width at joint coordinates
    const joints = [0, ...row.joints, CANVAS_WIDTH];
    
    for (let i = 0; i < joints.length - 1; i++) {
      const startX = joints[i];
      const endX = joints[i+1];
      const width = endX - startX;
      
      // Stable color selection based on position
      const seed = Math.sin(startX * 0.03 + row.y * 0.07) * 10000;
      const rand = seed - Math.floor(seed);
      
      // Distribute: Honey Oak (40%), Caramel (25%), Driftwood Tan (20%), Sun-bleached Beige (10%), Walnut (5%)
      let plankColor = '#C89A6A';
      if (rand < 0.05) {
        plankColor = '#8B5E3C'; // Deeper walnut brown (worn)
      } else if (rand < 0.15) {
        plankColor = '#C4B49A'; // Soft greyish-beige (sun-bleached)
      } else if (rand < 0.35) {
        plankColor = '#D9C1A0'; // Faded driftwood tan
      } else if (rand < 0.60) {
        plankColor = '#B57F4F'; // Muted caramel
      } else {
        plankColor = '#C89A6A'; // Warm honey oak
      }
      
      // Draw Plank Body
      ctx.fillStyle = plankColor;
      ctx.fillRect(startX, row.y, width, currentHeight);
      
      // Draw Wood Grains (horizontal lines along the wood)
      ctx.save();
      ctx.lineWidth = 2;
      
      // Determine grain color (slightly darker than base color)
      let grainColor = '#9A6B3E';
      if (plankColor === '#8B5E3C') grainColor = '#5c3d25';
      if (plankColor === '#C4B49A') grainColor = '#a39379';
      if (plankColor === '#D9C1A0') grainColor = '#b59e7f';
      if (plankColor === '#B57F4F') grainColor = '#8a5c34';
      if (plankColor === '#C89A6A') grainColor = '#a3764b';

      ctx.strokeStyle = grainColor;
      
      // We draw 3 grain lines per plank at stable heights
      const grainOffsets = [0.25, 0.5, 0.75];
      grainOffsets.forEach((offset, gIdx) => {
        const grainY = row.y + currentHeight * offset;
        // Stagger grain starts and lengths based on seed
        const startOffset = ((rand * (gIdx + 1) * 7.7) % 1) * (width * 0.4);
        const grainWidth = (0.4 + ((rand * (gIdx + 1) * 3.3) % 0.5)) * width;
        
        ctx.beginPath();
        ctx.moveTo(startX + startOffset, grainY);
        ctx.lineTo(startX + startOffset + grainWidth, grainY);
        ctx.stroke();
      });
      ctx.restore();
      
      // Draw highlights (top & left)
      ctx.fillStyle = '#EFE3D3'; // Warm light highlight
      ctx.fillRect(startX, row.y, width, 3); // Top highlight line
      ctx.fillRect(startX, row.y, 4, currentHeight); // Left highlight line
      
      // Draw crevices (bottom & right)
      ctx.fillStyle = '#4A2E1B'; // Deep warm brown seam line
      ctx.fillRect(startX, row.y + currentHeight - 4, width, 4); // Bottom crevice
      ctx.fillRect(endX - 4, row.y, 4, currentHeight); // Right crevice

      // Draw Wear and Damage (Scratches & Scuffs on a few planks)
      // If rand is between 0.15 and 0.28, draw a diagonal scratch
      if (rand > 0.15 && rand < 0.28) {
        ctx.strokeStyle = '#4A2E1B'; // Dark scratch shadow
        ctx.lineWidth = 2;
        ctx.beginPath();
        const scratchX = startX + width * 0.3;
        const scratchY = row.y + currentHeight * 0.4;
        ctx.moveTo(scratchX, scratchY);
        ctx.lineTo(scratchX + 30, scratchY + 15);
        ctx.stroke();
        
        ctx.strokeStyle = '#EFE3D3'; // Highlight edge of scratch
        ctx.beginPath();
        ctx.moveTo(scratchX, scratchY + 2);
        ctx.lineTo(scratchX + 30, scratchY + 17);
        ctx.stroke();
      }
      
      // If rand is between 0.75 and 0.85, draw a worn scuff mark
      if (rand > 0.75 && rand < 0.85) {
        ctx.fillStyle = 'rgba(74, 46, 27, 0.25)'; // Dark scuff dirt
        const scuffX = startX + width * 0.6;
        const scuffY = row.y + currentHeight * 0.5;
        ctx.fillRect(scuffX, scuffY, 40, 12);
        ctx.fillStyle = 'rgba(74, 46, 27, 0.5)';
        ctx.fillRect(scuffX + 5, scuffY + 4, 15, 3);
        ctx.fillRect(scuffX + 25, scuffY + 2, 10, 3);
      }
    }
  });

  // 4. Draw Arched Window in the center (x = 800 to 1120)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(800, 520);
  ctx.lineTo(800, 220);
  ctx.arc(960, 220, 160, Math.PI, 0, false);
  ctx.lineTo(1120, 520);
  ctx.closePath();
  ctx.clip();
  
  // Sky/Sunrise Gradient
  const skyGrad = ctx.createLinearGradient(960, 60, 960, 520);
  skyGrad.addColorStop(0, '#e5b299'); // warm peach sunrise sky
  skyGrad.addColorStop(0.5, '#edd8c0');
  skyGrad.addColorStop(1, '#d5e2c9'); // soft sage green hills backdrop
  ctx.fillStyle = skyGrad;
  ctx.fillRect(800, 60, 320, 460);
  
  // Distant green hills
  ctx.fillStyle = '#6d8c55';
  ctx.beginPath();
  ctx.arc(860, 520, 120, 0, Math.PI * 2);
  ctx.arc(1060, 520, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Window frame outlines (wood)
  ctx.strokeStyle = '#4A2E1B';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(800, 520);
  ctx.lineTo(800, 220);
  ctx.arc(960, 220, 160, Math.PI, 0, false);
  ctx.lineTo(1120, 520);
  ctx.stroke();

  // Honey Wood Highlight
  ctx.strokeStyle = '#C89A6A';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(804, 520);
  ctx.lineTo(804, 220);
  ctx.arc(960, 220, 156, Math.PI, 0, false);
  ctx.lineTo(1116, 520);
  ctx.stroke();

  // Window grilles
  ctx.strokeStyle = '#4A2E1B';
  ctx.lineWidth = 4;
  
  // Vertical center divider
  ctx.beginPath();
  ctx.moveTo(960, 60);
  ctx.lineTo(960, 500);
  ctx.stroke();
  
  // Horizontal dividers
  ctx.beginPath();
  ctx.moveTo(800, 220);
  ctx.lineTo(1120, 220);
  ctx.moveTo(800, 360);
  ctx.lineTo(1120, 360);
  ctx.stroke();

  // Windowsill
  ctx.fillStyle = '#8C6239';
  ctx.fillRect(785, 496, 350, 24);
  ctx.strokeStyle = '#4A3B32';
  ctx.lineWidth = 4;
  ctx.strokeRect(785, 496, 350, 24);
  ctx.fillStyle = '#C89A6A'; // Highlight
  ctx.fillRect(785, 498, 350, 4);

  // Windowsill items (Cluttered potted plant + jars + potion)
  drawSprite(ctx, jarSprite, jarColorMap, 810, 496 - 72, 8);
  if (flaskImages.green.complete) ctx.drawImage(flaskImages.green, 890, 496 - 60, 60, 60);
  drawPottedPlant(ctx, 1020, 496, 96, 1020); // Touch windowsill base, size 96px

  // 5. Draw Bookcase Structures
  drawBookcase(ctx, 150, 750);
  drawBookcase(ctx, 1170, 1770);

  // 6. Draw Shelves items (Dense mixture with overlap)
  // Left Shelves
  // Shelf 1 (y = 160)
  drawFlask(ctx, flaskTypes[0], 190, 160 - 88);
  drawFlask(ctx, flaskTypes[1], 240, 160 - 88);
  drawSprite(ctx, lanternSprite, lanternColorMap, 180, 160 - 88, 8); // Lantern 1
  drawBookImage(ctx, booksThreeImage, 330, 160, 57, 64, true); // Horizontal stack of 3 books (Image 2)
  drawPottedPlant(ctx, 410, 160, 150, 410); // Touch shelf base, size 150px
  drawFlask(ctx, flaskTypes[2], 560, 160 - 88);
  drawBookImage(ctx, booksTwoImage, 630, 160, 37, 64, false, false); // Vertical pair of 2 books (Image 1)
  drawSprite(ctx, jarSprite, jarColorMap, 700, 160 - 72, 8);

  // Shelf 2 (y = 280)
  drawPottedPlant(ctx, 170, 280, 150, 170); // Touch shelf base, size 150px
  drawSprite(ctx, jarSprite, jarColorMap, 300, 280 - 72, 8);
  drawFlask(ctx, flaskTypes[3], 380, 280 - 88);
  drawFlask(ctx, flaskTypes[4], 440, 280 - 88);
  drawBookImage(ctx, booksTwoImage, 510, 280, 37, 64, true); // Horizontal stack of 2 books (Image 1)
  drawSprite(ctx, lanternSprite, lanternColorMap, 560, 280 - 88, 8); // Lantern 2
  drawFlask(ctx, flaskTypes[5], 660, 280 - 88);

  // Shelf 3 (y = 400)
  drawBookImage(ctx, booksTwoImage, 180, 400, 37, 64, false, false); // Vertical pair of 2 books (Image 1)
  drawFlask(ctx, flaskTypes[6], 240, 400 - 88);
  drawPottedPlant(ctx, 310, 400, 150, 310); // Touch shelf base, size 150px
  drawSprite(ctx, jarSprite, jarColorMap, 450, 400 - 72, 8);
  drawFlask(ctx, flaskTypes[7], 530, 400 - 88);
  drawFlask(ctx, flaskTypes[8], 590, 400 - 88);
  drawSprite(ctx, lanternSprite, lanternColorMap, 660, 400 - 88, 8); // Lantern 3

  // Right Shelves
  // Shelf 1 (y = 160)
  drawFlask(ctx, flaskTypes[9], 1200, 160 - 88);
  drawFlask(ctx, flaskTypes[10], 1260, 160 - 88);
  drawPottedPlant(ctx, 1330, 160, 150, 1330); // Touch shelf base, size 150px
  drawSprite(ctx, jarSprite, jarColorMap, 1470, 160 - 72, 8);
  drawBookImage(ctx, booksThreeImage, 1540, 160, 57, 64, true); // Horizontal stack of 3 books (Image 2)
  drawSprite(ctx, lanternSprite, lanternColorMap, 1660, 160 - 88, 8); // Lantern 4

  // Shelf 2 (y = 280)
  drawSprite(ctx, lanternSprite, lanternColorMap, 1200, 280 - 88, 8); // Lantern 5
  drawBookImage(ctx, booksTwoImage, 1280, 280, 37, 64, true); // Horizontal stack of 2 books (Image 1)
  drawFlask(ctx, flaskTypes[11], 1360, 280 - 88);
  drawPottedPlant(ctx, 1440, 280, 150, 1440); // Touch shelf base, size 150px
  drawFlask(ctx, flaskTypes[12], 1580, 280 - 88);
  drawSprite(ctx, jarSprite, jarColorMap, 1660, 280 - 72, 8);

  // Shelf 3 (y = 400)
  drawPottedPlant(ctx, 1200, 400, 150, 1200); // Touch shelf base, size 150px
  drawFlask(ctx, flaskTypes[11], 1310, 400 - 88);
  drawSprite(ctx, jarSprite, jarColorMap, 1380, 400 - 72, 8);
  drawBookImage(ctx, booksTwoImage, 1450, 400, 37, 64, false, true); // Leaning pair of 2 books (Image 1)
  drawSprite(ctx, lanternSprite, lanternColorMap, 1540, 400 - 88, 8); // Lantern 6
  drawFlask(ctx, flaskTypes[12], 1630, 400 - 88);
  drawFlask(ctx, flaskTypes[10], 1690, 400 - 88);
}

function drawCounterAndItems() {
  const counterHeight = 160;

  // Counter shadow
  ctx.fillStyle = 'rgba(74, 59, 50, 0.35)';
  ctx.fillRect(100, counterY + counterHeight - 10, CANVAS_WIDTH - 200, 30);

  // Draw Wooden Counter Base
  ctx.fillStyle = '#8C6239';
  ctx.fillRect(100, counterY, CANVAS_WIDTH - 200, counterHeight);

  // Countertop Light Falloff (Pools of light on wood under candles, clipped to counter)
  ctx.save();
  ctx.beginPath();
  ctx.rect(100, counterY, CANVAS_WIDTH - 200, counterHeight);
  ctx.clip();
  lightSources.forEach(src => {
    if (src.type === 'candle') {
      const grad = ctx.createRadialGradient(src.x, counterY + 10, 0, src.x, counterY + 10, 80);
      grad.addColorStop(0, '#B07B52'); // Bright warm wood center
      grad.addColorStop(1, '#8C6239'); // Fades into counter tone
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(src.x, counterY + 10, 80, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
  
  // Countertop slab
  ctx.fillStyle = '#A37A5C';
  ctx.fillRect(100, counterY, CANVAS_WIDTH - 200, 32);
  
  // Counter outlines
  ctx.strokeStyle = '#4A3B32';
  ctx.lineWidth = 6;
  ctx.strokeRect(100, counterY, CANVAS_WIDTH - 200, counterHeight);
  ctx.beginPath();
  ctx.moveTo(100, counterY + 32);
  ctx.lineTo(CANVAS_WIDTH - 100, counterY + 32);
  ctx.stroke();

  // Panels details
  for (let x = 250; x < CANVAS_WIDTH - 200; x += 300) {
    ctx.strokeRect(x, counterY + 50, 200, 80);
  }

  // Draw Countertop Props
  drawSprite(ctx, candleSprite, candleColorMap, 300, counterY - 88, 8); // Candle 1
  if (plantImage.complete) ctx.drawImage(plantImage, 450, counterY - 128, 128, 128); // Plant 1
  drawFlask(ctx, flaskTypes[11], 650, counterY - 88);
  drawFlask(ctx, flaskTypes[12], 750, counterY - 88);
  
  // Book/Scroll
  ctx.fillStyle = '#E5DEC9';
  ctx.fillRect(950, counterY - 24, 96, 24);
  ctx.strokeStyle = '#4A3B32';
  ctx.lineWidth = 4;
  ctx.strokeRect(950, counterY - 24, 96, 24);
  ctx.fillStyle = '#4A3B32';
  ctx.fillRect(965, counterY - 16, 66, 4);
  ctx.fillRect(965, counterY - 8, 46, 4);

  drawSprite(ctx, candleSprite, candleColorMap, 1300, counterY - 88, 8); // Candle 2
  if (plantImage.complete) ctx.drawImage(plantImage, 1500, counterY - 128, 128, 128); // Plant 2
}

function drawGlows() {
  const t = Date.now() / 1000;
  
  ctx.globalCompositeOperation = 'screen';
  
  lightSources.forEach((src, idx) => {
    // Unique slow flicker/breathing phase for each light source
    const t_i = t + idx * 1.7;
    const flicker = 0.95 + 0.05 * Math.sin(t_i * 2.8) + 0.02 * Math.cos(t_i * 7.4) + 0.01 * Math.sin(t_i * 15.3);
    const radius = src.radius * flicker;
    
    // radial gradient glow halo, amber-gold (#F4C05E)
    const grad = ctx.createRadialGradient(src.x, src.y, 0, src.x, src.y, radius);
    
    const maxOpacity = src.type === 'candle' ? 0.55 : 0.45;
    grad.addColorStop(0, `rgba(244, 192, 94, ${maxOpacity})`);
    grad.addColorStop(0.3, `rgba(244, 192, 94, ${maxOpacity * 0.5})`);
    grad.addColorStop(1, 'rgba(244, 192, 94, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(src.x, src.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.globalCompositeOperation = 'source-over';
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (currentState === GameState.MENU || currentState === GameState.TRANSITION) return;
  
  // 1. Base Wall, Floor, Shelves, Jars, Lanterns, Wall light falloffs
  drawShopBackground();
  
  // 2. Draw Apothecary behind the counter
  // Retro drop shadow
  ctx.fillStyle = 'rgba(74, 59, 50, 0.45)';
  ctx.beginPath();
  ctx.ellipse(player.x + player.renderWidth/2, player.y + player.renderHeight, player.renderWidth/2, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  drawSprite(ctx, playerSprite, playerColorMap, player.x, player.y, pixelScale);
  
  // 3. Draw Wooden Counter, countertop items, and countertop light falloffs
  drawCounterAndItems();
  
  // 4. Draw NPC Customer in front of the counter
  if (npc.active) {
    ctx.fillStyle = 'rgba(74, 59, 50, 0.45)';
    ctx.beginPath();
    ctx.ellipse(npc.x + npc.renderWidth/2, npc.y + npc.renderHeight, npc.renderWidth/2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    drawSprite(ctx, playerSprite, npcColorMap, npc.x, npc.y, pixelScale);
  }

  // 4.5. Draw Snake Plants in the lower corners (Enlarged)
  // Shadows
  ctx.fillStyle = 'rgba(74, 59, 50, 0.35)';
  ctx.beginPath();
  ctx.ellipse(50 + 16 * 11, CANVAS_HEIGHT - 12, 8 * 11, 14, 0, 0, Math.PI * 2);
  ctx.ellipse(CANVAS_WIDTH - 16 * 11 - 50, CANVAS_HEIGHT - 12, 8 * 11, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw snake plants if loaded (scaled to 32 * 11 = 352px)
  if (snakePlantImage.complete) {
    // Left Snake Plant
    ctx.drawImage(snakePlantImage, 50, CANVAS_HEIGHT - 32 * 11, 352, 352);
    // Right Snake Plant
    ctx.drawImage(snakePlantImage, CANVAS_WIDTH - 32 * 11 - 50, CANVAS_HEIGHT - 32 * 11, 352, 352);
  }
  
  // 5. Draw Ambient shadowy room tint overlay (so shadows are cooler/darker)
  ctx.fillStyle = 'rgba(25, 20, 35, 0.25)'; // Softer dark room tint
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // 6. Draw Glow Halos (additive/screen overlay)
  drawGlows();
}

requestAnimationFrame((time) => {
  lastTime = time;
  requestAnimationFrame(gameLoop);
});
