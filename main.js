// Game Constants
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const PLAYER_SPEED = 400; // pixels per second
const NPC_SPEED = 150;

// Game State Enum
const GameState = { MENU: 'MENU', TRANSITION: 'TRANSITION', GAMEPLAY: 'GAMEPLAY', DIALOGUE: 'DIALOGUE', CABINET: 'CABINET', BOOK: 'BOOK' };
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
  if (e.key === 'Escape' && currentState === GameState.CABINET) {
    exitCabinetView();
  }
  if (e.key === 'Escape' && currentState === GameState.BOOK) {
    closeBookView();
    closeManuscriptView();
  }

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

// Mouse & Touch listeners for Cabinet Hold-to-Collect and Interactions
canvas.addEventListener('mousemove', (e) => {
  const pos = getCanvasMousePos(e);
  mouseCanvasX = pos.x;
  mouseCanvasY = pos.y;
});
canvas.addEventListener('touchmove', (e) => {
  const pos = getCanvasMousePos(e);
  mouseCanvasX = pos.x;
  mouseCanvasY = pos.y;
});

canvas.addEventListener('mousedown', (e) => {
  const pos = getCanvasMousePos(e);
  mouseCanvasX = pos.x;
  mouseCanvasY = pos.y;
  isMouseDown = true;
  
  if (currentState === GameState.CABINET) {
    // Check Close Button: bounding box x [1740, 1860], y [50, 110]
    if (mouseCanvasX >= 1740 && mouseCanvasX <= 1860 && mouseCanvasY >= 50 && mouseCanvasY <= 110) {
      exitCabinetView();
      return;
    }
    
    // Check click on jars
    updateHoveredJar();
    if (hoveredJarIndex !== null) {
      const list = activeCabinet === 'INGREDIENT' ? ingredients : bottles;
      const name = list[hoveredJarIndex].name;
      if (!inventory.includes(name)) {
        activeHoldJarIndex = hoveredJarIndex;
        holdTime = 0;
      }
    }
  } else if (currentState === GameState.GAMEPLAY && currentRoom === RoomState.WORKROOM) {
    // Check tap on Main Cabinet
    if (mouseCanvasX >= 850 && mouseCanvasX <= 1070 && mouseCanvasY >= 100 && mouseCanvasY <= 543) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth/2) - 960, 2) + Math.pow((player.y + player.renderHeight/2) - 500, 2));
      if (dist < 250) {
        activeCabinet = 'INGREDIENT';
        openCabinetView();
      }
    }
    // Check tap on Second Cabinet (Bottle Cabinet)
    else if (mouseCanvasX >= 1460 && mouseCanvasX <= 1580 && mouseCanvasY >= 290 && mouseCanvasY <= 470) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth/2) - 1520, 2) + Math.pow((player.y + player.renderHeight/2) - 440, 2));
      if (dist < 250) {
        activeCabinet = 'BOTTLE';
        openCabinetView();
      }
    }
  } else if (currentState === GameState.GAMEPLAY && currentRoom === RoomState.SHOP) {
    // Check tap on Book
    if (mouseCanvasX >= 950 && mouseCanvasX <= 1046 && mouseCanvasY >= 496 && mouseCanvasY <= 520) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth/2) - 998, 2) + Math.pow((player.y + player.renderHeight/2) - 496, 2));
      if (dist < 250) {
        openBookView();
      }
    }
  }
});

canvas.addEventListener('touchstart', (e) => {
  const pos = getCanvasMousePos(e);
  mouseCanvasX = pos.x;
  mouseCanvasY = pos.y;
  isMouseDown = true;
  
  if (currentState === GameState.CABINET) {
    // Check Close Button
    if (mouseCanvasX >= 1740 && mouseCanvasX <= 1860 && mouseCanvasY >= 50 && mouseCanvasY <= 110) {
      exitCabinetView();
      return;
    }
    
    // Check touch on jars
    updateHoveredJar();
    if (hoveredJarIndex !== null) {
      const list = activeCabinet === 'INGREDIENT' ? ingredients : bottles;
      const name = list[hoveredJarIndex].name;
      if (!inventory.includes(name)) {
        activeHoldJarIndex = hoveredJarIndex;
        holdTime = 0;
      }
    }
  } else if (currentState === GameState.GAMEPLAY && currentRoom === RoomState.WORKROOM) {
    // Check tap on Main Cabinet
    if (mouseCanvasX >= 850 && mouseCanvasX <= 1070 && mouseCanvasY >= 100 && mouseCanvasY <= 543) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth/2) - 960, 2) + Math.pow((player.y + player.renderHeight/2) - 500, 2));
      if (dist < 250) {
        activeCabinet = 'INGREDIENT';
        openCabinetView();
      }
    }
    // Check tap on Second Cabinet (Bottle Cabinet)
    else if (mouseCanvasX >= 1460 && mouseCanvasX <= 1580 && mouseCanvasY >= 290 && mouseCanvasY <= 470) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth/2) - 1520, 2) + Math.pow((player.y + player.renderHeight/2) - 440, 2));
      if (dist < 250) {
        activeCabinet = 'BOTTLE';
        openCabinetView();
      }
    }
  } else if (currentState === GameState.GAMEPLAY && currentRoom === RoomState.SHOP) {
    // Check tap on Book
    if (mouseCanvasX >= 950 && mouseCanvasX <= 1046 && mouseCanvasY >= 496 && mouseCanvasY <= 520) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth/2) - 998, 2) + Math.pow((player.y + player.renderHeight/2) - 496, 2));
      if (dist < 250) {
        openBookView();
      }
    }
  }
});

canvas.addEventListener('mouseup', () => {
  isMouseDown = false;
  if (activeHoldJarIndex !== null && !keys.e) {
    activeHoldJarIndex = null;
    holdTime = 0;
  }
});

canvas.addEventListener('touchend', () => {
  isMouseDown = false;
  if (activeHoldJarIndex !== null && !keys.e) {
    activeHoldJarIndex = null;
    holdTime = 0;
  }
});


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

// --- WORKROOM CONFIGURATION & VARIABLES ---
const RoomState = { SHOP: 'SHOP', WORKROOM: 'WORKROOM' };
let currentRoom = RoomState.SHOP;

// Transitions
let transitionAlpha = 0;
let transitionDirection = 0; // 1 = fade out, -1 = fade in
let nextRoom = null;

// Inventory & Collection
let inventory = []; // Array of collected ingredient names
let activeHoldJarIndex = null;
let holdTime = 0;
let hoveredJarIndex = null;
let mouseCanvasX = 0;
let mouseCanvasY = 0;
let isMouseDown = false;

// Active Cabinet Toggle
let activeCabinet = 'INGREDIENT'; // 'INGREDIENT' or 'BOTTLE'

// Particles & Animations
let steamParticles = [];
let activeAnimations = [];

// Cabinet Ingredient definitions
const ingredients = [
  { name: 'Willow Bark', category: 'Roots & Barks', color: '#7a5a40', highlight: '#9c795d', shadow: '#583f2a', lid: '#422c1b', lidHighlight: '#5e412a' },
  { name: 'Ginger', category: 'Roots & Barks', color: '#dfc08f', highlight: '#f1dab5', shadow: '#bf9e6f', lid: '#8c6239', lidHighlight: '#a3764b' },
  { name: 'Tulsi', category: 'Roots & Barks', color: '#4d754b', highlight: '#6ca369', shadow: '#31522f', lid: '#223821', lidHighlight: '#335431' },
  
  { name: 'Fats', category: 'Binders & Bases', color: '#e8e2d5', highlight: '#ffffff', shadow: '#ccc4b4', lid: '#a39788', lidHighlight: '#c2b6a7' },
  { name: 'Beeswax', category: 'Binders & Bases', color: '#ebb434', highlight: '#ffda73', shadow: '#bf8e1b', lid: '#8c6239', lidHighlight: '#a3764b' },
  { name: 'Herbal Extract', category: 'Binders & Bases', color: '#276965', highlight: '#439b97', shadow: '#124542', lid: '#0e2b29', lidHighlight: '#194a47' },
  
  { name: 'Jaggery', category: 'Sweeteners & Flavorings', color: '#784420', highlight: '#995f38', shadow: '#572d11', lid: '#381b07', lidHighlight: '#522b10' },
  { name: 'Black Pepper', category: 'Sweeteners & Flavorings', color: '#333333', highlight: '#555555', shadow: '#1a1a1a', lid: '#473d35', lidHighlight: '#61544a' },
  { name: 'Honey', category: 'Sweeteners & Flavorings', color: '#d99011', highlight: '#ffbc42', shadow: '#a36603', lid: '#8c6239', lidHighlight: '#a3764b', isGlass: true }
];

// Empty Bottles definitions
const bottles = [
  { name: 'Clear Vial', shape: 'vial', category: 'Clear Bottles', color: '#e0f7fa', highlight: '#ffffff', shadow: '#b2ebf2', lid: '#8a5a36', lidHighlight: '#a87a56', isGlass: true },
  { name: 'Clear Flask', shape: 'flask', category: 'Clear Bottles', color: '#e0f7fa', highlight: '#ffffff', shadow: '#b2ebf2', lid: '#8a5a36', lidHighlight: '#a87a56', isGlass: true },
  { name: 'Clear Jar', shape: 'jar', category: 'Clear Bottles', color: '#e0f7fa', highlight: '#ffffff', shadow: '#b2ebf2', lid: '#8a5a36', lidHighlight: '#a87a56', isGlass: true },
  
  { name: 'Blue Vial', shape: 'vial', category: 'Cobalt Blue Bottles', color: '#4ba3e3', highlight: '#8ac4ff', shadow: '#1c6ca3', lid: '#8a5a36', lidHighlight: '#a87a56', isGlass: true },
  { name: 'Blue Flask', shape: 'flask', category: 'Cobalt Blue Bottles', color: '#4ba3e3', highlight: '#8ac4ff', shadow: '#1c6ca3', lid: '#8a5a36', lidHighlight: '#a87a56', isGlass: true },
  { name: 'Blue Jar', shape: 'jar', category: 'Cobalt Blue Bottles', color: '#4ba3e3', highlight: '#8ac4ff', shadow: '#1c6ca3', lid: '#8a5a36', lidHighlight: '#a87a56', isGlass: true },
  
  { name: 'Amber Vial', shape: 'vial', category: 'Amber Bottles', color: '#d99011', highlight: '#ffbc42', shadow: '#a36603', lid: '#8a5a36', lidHighlight: '#a87a56', isGlass: true },
  { name: 'Amber Flask', shape: 'flask', category: 'Amber Bottles', color: '#d99011', highlight: '#ffbc42', shadow: '#a36603', lid: '#8a5a36', lidHighlight: '#a87a56', isGlass: true },
  { name: 'Amber Jar', shape: 'jar', category: 'Amber Bottles', color: '#d99011', highlight: '#ffbc42', shadow: '#a36603', lid: '#8a5a36', lidHighlight: '#a87a56', isGlass: true }
];

// Bottle Shape Sprite Arrays (with oblique viewpoints)
const vialSprite = [
  "....kk....",
  "...kooek...",
  "....kk....",
  "...kccsk...",
  "..kchccsk..",
  ".kchccccsk.",
  "kchccccccsk",
  "kchccccccsk",
  "kchccccccsk",
  "kchccccccsk",
  "kcccccccskk",
  ".kkkkkkkk."
];

const flaskShapeSprite = [
  "....kk....",
  "...kooek...",
  "....kk....",
  "...kccsk...",
  "..kccccsk..",
  ".kchcccskk.",
  "kchcccccskk",
  "kchcccccskk",
  "kchcccccskk",
  ".kccccccsk.",
  "..kccccsk..",
  "...kkkk..."
];

const jarShapeSprite = [
  "...kkkk...",
  "..koooek..",
  "..kcccck..",
  ".kcccccck.",
  "kchcccccsk",
  "kchcccccsk",
  "kchcccccsk",
  "kchcccccsk",
  "kchcccccsk",
  "kcccccccks",
  ".kkkkkkkk."
];


// Custom Sprites

// Main Cabinet (20x25)
const mainCabinetSprite = [
  "kkkkkkkkkkkkkkkkkkkk",
  "khhhhhhhhhhhhhhhhhhk",
  "kHwwwwwwwwwwwwwwwwsk",
  "kHwkkkkkkkkkkkkkkwsk",
  "kHwkggggggggggggkwsk",
  "kHwkg.p..g..u..gkwsk",
  "kHwkgpp..g.uu..gkwsk",
  "kHwkkkkkkkkkkkkkkwsk",
  "kHwkg.........agkwsk",
  "kHwkga........agkwsk",
  "kHwkkkkkkkkkkkkkkwsk",
  "kHwkkkkkkkkkkkkkkwsk",
  "kHwswwwwwwwwwwwwssk",
  "kHwwwwwwwwwwwwwwwwsk",
  "kHwwkkkkkkkkkkkkwwsk",
  "kHwwkskskskskskswwsk",
  "kHwwk.........kwwsk",
  "kHwwk.b.....b.kwwsk",
  "kHwwk.b.....b.kwwsk",
  "kHwwk.........kwwsk",
  "kHwwkskskskskskswwsk",
  "kHwwkkkkkkkkkkkkwwsk",
  "kHwwwwwwwwwwwwwwwwsk",
  "kssssssssssssssssssk",
  "kkkkkkkkkkkkkkkkkkkk"
];
const mainCabinetColorMap = {
  'k': '#1d1511', // dark outline
  'w': '#8C6239', // wood body
  'h': '#C89A6A', // wood highlight
  'H': '#EFE3D3', // extra light highlight
  's': '#4A2E1B', // shadow wood
  'g': '#2c3539', // glass back pane
  'p': '#d43f5e', // red pot
  'u': '#2f7a33', // green pot
  'a': '#5ac3e6', // blue pot
  'b': '#F4C05E', // brass handle
  '.': null
};

// Second Cabinet (15x22)
const secondCabinetSprite = [
  "kkkkkkkkkkkkkkk",
  "khhhhhhhhhhhhhk",
  "kHwwwwwwwwwwwsk",
  "kHwkkkkkkkkkwsk",
  "kHwkg..g.o.gkwsk",
  "kHwkgg.g.c.gkwsk",
  "kHwkkkkkkkkkwsk",
  "kHwkg.o.g.o.gkwsk",
  "kHwkggcgg.l.gkwsk",
  "kHwkkkkkkkkkwsk",
  "kHwkg.o.g...gkwsk",
  "kHwkgglgggggkwsk",
  "kHwkkkkkkkkkwsk",
  "kHwswwwwwwwwssk",
  "kHwwwwwwwwwwwsk",
  "kHwwkskskskwwsk",
  "kHwwk.....kwwsk",
  "kHwwk..b..kwwsk",
  "kHwwk.....kwwsk",
  "kHwwkskskskwwsk",
  "kHwwwwwwwwwwwsk",
  "kkkkkkkkkkkkkkk"
];
const secondCabinetColorMap = {
  'k': '#1d1511', // dark outline
  'w': '#8C6239', // wood body
  'h': '#C89A6A', // wood highlight
  'H': '#EFE3D3', // extra light highlight
  's': '#4A2E1B', // shadow wood
  'g': '#2c3539', // back panel
  'c': '#e0f7fa', // clear glass bottle
  'l': '#5ac3e6', // blue bottle
  'o': '#a06b3c', // cork
  'b': '#F4C05E', // brass handle
  '.': null
};

// Stove Sprite (15x22)
const stoveSprite = [
  "...............",
  "......kkk......",
  "....kHccHk....",
  "....kcwwck....",
  "....kcccck....",
  "....kkkkkk....",
  "kkkkkkkkkkkkkkk",
  "kihhhhhhhhhhhik",
  "kiIiiiiiiiiiiik",
  "kiIiikkkkkiiiik",
  "kiIikfffffkkiik",
  "kiIikffyffkkiik",
  "kiIikfyyyfkiik",
  "kiIiikkkkkiiiik",
  "kiIiiiiiiiiiiik",
  "kiIiiiiiiiiiiik",
  "kiIiiiiiiiiiiik",
  "kiIiiiiiiiiiiik",
  "kiIiiiiiiiiiiik",
  "kiIiiiiiiiiiiik",
  "kiiiiiiiiiiiiik",
  "kkkkkkkkkkkkkkk"
];
const stoveColorMap = {
  'k': '#1d1511', // dark outline
  'h': '#555555', // iron top rim highlight
  'i': '#292929', // dark iron
  'I': '#3a3a3a', // iron body highlight
  'f': '#d43f5e', // flame red-orange
  'y': '#F4C05E', // flame center
  'c': '#b57f4f', // copper body
  'H': '#d9c1a0', // copper highlight
  'w': '#87ceeb', // water
  '.': null
};

// Worktable Sprite (32x16)
const worktableSprite = [
  "................................",
  ".....k..........................",
  "....kmk........k.kk.............",
  "....kmk.k.....kppk.k.....kkkk...",
  "....kmmkk.k...kppk.k....kcccck..",
  "....kmmmpkk...kkkk.k....kcoock..",
  "....kkkkkkk...kdddkk....kcccck..",
  "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
  "khhhhhhhhhhhhhhhhhhhhhhhhhhhhhsk",
  "kHwwwwwwwwwwwwwwwwwwwwwwwwwwwwsk",
  "kHwkkkwwkkkkkkkkkkkkkkwwkkkwwwsk",
  "kHwk.kwwk............kwwk.kwwwsk",
  "kHwk.kwwk............kwwk.kwwwsk",
  "kHwk.kwwk............kwwk.kwwwsk",
  "kHwkskssk............ksksskwwwsk",
  "kkkkkkkkk............kkkkkkkkkkk"
];
const worktableColorMap = {
  'k': '#1d1511', // outline
  'w': '#8C6239', // wood body
  'h': '#C89A6A', // wood highlight
  'H': '#EFE3D3', // top slab highlight
  's': '#4A2E1B', // shadow wood
  'm': '#7f8c8d', // mortar stone
  'p': '#f5f6fa', // cheesecloth / pestle light grey
  'd': '#485460', // tablet mold dark grey
  'c': '#b57f4f', // copper basin
  'o': '#d9c1a0', // basin highlight/shine
  '.': null
};

// Collision detection function
function checkCollision(x, y, width, height) {
  if (currentRoom === RoomState.SHOP) {
    // Shop room limits
    if (x < 100) return true;
    if (x + width > CANVAS_WIDTH + 10) return true; // Let them walk off to the right
    if (y < 280) return true;
    if (y > 410) return true;
  } else if (currentRoom === RoomState.WORKROOM) {
    const pLeft = x + 24;
    const pRight = x + width - 24;
    const pBottom = y + height;
    const pFeetY = y + height - 20; // check collision at bottom of player (feet box)
    
    // Boundaries (entire screen 1920x1080)
    if (pLeft < -40) return true; // Let them walk off to the left back to shop
    if (pRight > CANVAS_WIDTH - 20) return true;
    if (pFeetY < 500) return true; // Wall border seam at Y = 500
    if (pBottom > 1060) return true; // Bottom border near bottom of screen
    
    // Furniture obstacle bounding boxes in full-screen Workroom
    const obstacles = [
      { x: 300, y: 410, w: 120, h: 66 },   // Stove
      { x: 850, y: 470, w: 220, h: 73 },   // Main Cabinet
      { x: 1460, y: 410, w: 120, h: 60 },  // Second Cabinet
      { x: 1590, y: 440, w: 120, h: 30 },  // Potted Plant
      { x: 830, y: 620, w: 260, h: 128 }   // Worktable
    ];
    
    for (const obs of obstacles) {
      if (
        pRight > obs.x &&
        pLeft < obs.x + obs.w &&
        pBottom > obs.y &&
        pFeetY < obs.y + obs.h
      ) {
        return true;
      }
    }
  }
  return false;
}

// Convert screen clicks/touches to raw canvas coordinates
function getCanvasMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;
  
  let clientX = e.clientX;
  let clientY = e.clientY;
  
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }
  
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

// Update which cabinet container is hovered by mouse/touch
function updateHoveredJar() {
  if (currentState !== GameState.CABINET) {
    hoveredJarIndex = null;
    return;
  }
  
  const rowY = [250, 510, 770];
  const colX = [480, 960, 1440];
  
  const boxW = 180;
  const boxH = 200;
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const jX = colX[c];
      const jY = rowY[r];
      
      if (
        mouseCanvasX >= jX - boxW/2 &&
        mouseCanvasX <= jX + boxW/2 &&
        mouseCanvasY >= jY - boxH/2 &&
        mouseCanvasY <= jY + boxH/2
      ) {
        hoveredJarIndex = idx;
        return;
      }
    }
  }
  hoveredJarIndex = null;
}


// Open and Close cabinet view functions
function openCabinetView() {
  currentState = GameState.CABINET;
  activeHoldJarIndex = null;
  holdTime = 0;
  interactionPrompt.classList.add('hidden');
}

function exitCabinetView() {
  currentState = GameState.GAMEPLAY;
  activeHoldJarIndex = null;
  holdTime = 0;
}

// Render a large cabinet jar or bottle shape in the overlay view
function drawCabinetJar(ctx, ing, x, y, scale) {
  const map = {
    '.': null,
    'k': '#2F231B', // Dark outline
    'c': ing.color,
    'h': ing.highlight,
    's': ing.shadow,
    'o': ing.lid,
    'O': ing.lidHighlight,
    'e': '#ffffff', // highlight in cork
    'l': '#F5F2EB', // parchment label
    'g': ing.isGlass ? 'rgba(255, 255, 255, 0.4)' : ing.color // glass shine if honey
  };
  
  let sprite = [
    "....kkkkkk....",
    "...kOOOOOOk...",
    "...kooooook...",
    "..kkkkkkkkkk..",
    ".kcccccccccck.",
    "kchcccccccccsk",
    "kchcccccccccsk",
    "kchkkkkkkkkcsk",
    "kchklllllllskk",
    "kchklllllllskk",
    "kchkkkkkkkkcsk",
    "kchcccccccccsk",
    "kcccccccccccks",
    ".kkkkkkkkkkkk."
  ];
  
  if (ing.shape === 'vial') {
    sprite = vialSprite;
  } else if (ing.shape === 'flask') {
    sprite = flaskShapeSprite;
  } else if (ing.shape === 'jar') {
    sprite = jarShapeSprite;
  }
  
  const width = sprite[0].length * scale;
  const height = sprite.length * scale;
  const startX = x - width / 2;
  const startY = y - height / 2;
  
  for (let r = 0; r < sprite.length; r++) {
    for (let c = 0; c < sprite[r].length; c++) {
      const char = sprite[r][c];
      const color = map[char];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(startX + c * scale, startY + r * scale, scale, scale);
      }
    }
  }
  
  if (ing.isGlass) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(startX + 3 * scale, startY + 4 * scale, scale, 6 * scale);
    ctx.fillRect(startX + 4 * scale, startY + 5 * scale, scale, 6 * scale);
  }
}

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

// Load custom cabinet images
const cabinetIngredientsImage = new Image();
cabinetIngredientsImage.src = 'cabinet_ingredients.png';

const pottedPlantImage = new Image();
pottedPlantImage.src = 'potted_plant.png';

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
  // Handle room transitions
  if (transitionDirection !== 0) {
    if (transitionDirection === 1) {
      transitionAlpha += dt * 3; // 0.33s fade out
      if (transitionAlpha >= 1) {
        transitionAlpha = 1;
        transitionDirection = -1;
        currentRoom = nextRoom;
        
        // Relocate player near the entrance of the target room
        if (currentRoom === RoomState.WORKROOM) {
          player.x = 25; // Far left edge of full screen
          player.y = 520;
        } else {
          player.x = CANVAS_WIDTH - player.renderWidth - 25; // Far right edge behind counter
          player.y = 350;
        }
      }
    } else if (transitionDirection === -1) {
      transitionAlpha -= dt * 3; // 0.33s fade in
      if (transitionAlpha <= 0) {
        transitionAlpha = 0;
        transitionDirection = 0;
      }
    }
    return;
  }

  // Update slide animations at all times
  for (let i = activeAnimations.length - 1; i >= 0; i--) {
    const anim = activeAnimations[i];
    if (anim.type === 'collect_slide') {
      anim.progress += dt / anim.duration;
      if (anim.progress >= 1.0) {
        anim.progress = 1.0;
        activeAnimations.splice(i, 1);
      } else {
        const t = anim.progress;
        const ease = t * (2 - t); // easeOutQuad
        anim.x = anim.startX + (anim.endX - anim.startX) * ease;
        anim.y = anim.startY + (anim.endY - anim.startY) * ease;
      }
    }
  }

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
    
    // Axis-aligned slide movement
    let targetX = player.x + dx * PLAYER_SPEED * dt;
    let targetY = player.y + dy * PLAYER_SPEED * dt;
    
    let oldX = player.x;
    player.x = targetX;
    if (checkCollision(player.x, player.y, player.renderWidth, player.renderHeight)) {
      player.x = oldX;
    }
    
    let oldY = player.y;
    player.y = targetY;
    if (checkCollision(player.x, player.y, player.renderWidth, player.renderHeight)) {
      player.y = oldY;
    }
    
    // Room transition checks
    if (currentRoom === RoomState.SHOP) {
      if (player.x + player.renderWidth >= CANVAS_WIDTH - 5) {
        nextRoom = RoomState.WORKROOM;
        transitionDirection = 1;
        transitionAlpha = 0;
      }
    } else if (currentRoom === RoomState.WORKROOM) {
      if (player.x <= 10) {
        nextRoom = RoomState.SHOP;
        transitionDirection = 1;
        transitionAlpha = 0;
      }
    }
    
    // NPC & Book updates (only in Shop)
    if (currentRoom === RoomState.SHOP) {
      if (npc.active && !npc.reachedCounter) {
        if (npc.x > npc.targetX) npc.x -= NPC_SPEED * dt;
        else npc.reachedCounter = true;
      }
      
      const bookCenterX = 998;
      const bookCenterY = 496;
      const distToBook = Math.sqrt(Math.pow((player.x + player.renderWidth/2) - bookCenterX, 2) + Math.pow((player.y + player.renderHeight/2) - bookCenterY, 2));
      
      let showNPCPrompt = false;
      if (npc.reachedCounter) {
        const xDist = Math.abs((player.x + player.renderWidth/2) - (npc.x + npc.renderWidth/2));
        const yDist = Math.abs((player.y + player.renderHeight/2) - (npc.y + npc.renderHeight/2));
        if (xDist < 350 && yDist < 420) {
          showNPCPrompt = true;
        }
      }
      
      if (showNPCPrompt) {
        interactionPrompt.classList.remove('hidden');
        interactionPrompt.textContent = "Press E";
        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        const scaleX = containerRect.width / CANVAS_WIDTH;
        const scaleY = containerRect.height / CANVAS_HEIGHT;
        interactionPrompt.style.left = `${(npc.x + npc.renderWidth/2) * scaleX}px`;
        interactionPrompt.style.top = `${(npc.y) * scaleY}px`;
        
        if (keysPressed.e) startDialogue();
      } else if (distToBook < 180) {
        interactionPrompt.classList.remove('hidden');
        interactionPrompt.textContent = "Press E / Tap to Read Book";
        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        const scaleX = containerRect.width / CANVAS_WIDTH;
        const scaleY = containerRect.height / CANVAS_HEIGHT;
        interactionPrompt.style.left = `${bookCenterX * scaleX}px`;
        interactionPrompt.style.top = `${400 * scaleY}px`;
        
        if (keysPressed.e) {
          openBookView();
        }
      } else {
        interactionPrompt.classList.add('hidden');
      }
    }
    
    // Cabinet proximity & interaction (only in Workroom)
    if (currentRoom === RoomState.WORKROOM) {
      const mainCenterX = 960;
      const mainCenterY = 500;
      const bottleCenterX = 1520;
      const bottleCenterY = 440;
      
      const distToMain = Math.sqrt(Math.pow((player.x + player.renderWidth/2) - mainCenterX, 2) + Math.pow((player.y + player.renderHeight/2) - mainCenterY, 2));
      const distToBottle = Math.sqrt(Math.pow((player.x + player.renderWidth/2) - bottleCenterX, 2) + Math.pow((player.y + player.renderHeight/2) - bottleCenterY, 2));
      
      let targetCabinet = null;
      let targetX = 0;
      
      if (distToMain < 180) {
        targetCabinet = 'INGREDIENT';
        targetX = mainCenterX;
      } else if (distToBottle < 180) {
        targetCabinet = 'BOTTLE';
        targetX = bottleCenterX;
      }
      
      if (targetCabinet !== null) {
        interactionPrompt.classList.remove('hidden');
        interactionPrompt.textContent = targetCabinet === 'INGREDIENT' ? "Press E / Tap to Open Ingredients" : "Press E / Tap to Open Bottle Storage";
        
        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        const scaleX = containerRect.width / CANVAS_WIDTH;
        const scaleY = containerRect.height / CANVAS_HEIGHT;
        interactionPrompt.style.left = `${targetX * scaleX}px`;
        interactionPrompt.style.top = `${300 * scaleY}px`;
        
        if (keysPressed.e) {
          activeCabinet = targetCabinet;
          openCabinetView();
        }
      } else {
        interactionPrompt.classList.add('hidden');
      }
      
      // Steam particle system updates (stove is at x=300)
      if (Math.random() < 0.15) {
        steamParticles.push({
          x: 350 + Math.random() * 20,
          y: 310,
          vx: (Math.random() - 0.5) * 20,
          vy: -30 - Math.random() * 40,
          alpha: 0.5,
          life: 0,
          maxLife: 1.0 + Math.random() * 1.0
        });
      }
      
      for (let i = steamParticles.length - 1; i >= 0; i--) {
        const p = steamParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt;
        p.alpha = 0.5 * (1 - p.life / p.maxLife);
        if (p.life >= p.maxLife) {
          steamParticles.splice(i, 1);
        }
      }
    }
  } else if (currentState === GameState.CABINET) {
    updateHoveredJar();
    const list = activeCabinet === 'INGREDIENT' ? ingredients : bottles;
    
    // Desktop holding: hovered and key E is held down
    if (hoveredJarIndex !== null && keys.e) {
      const name = list[hoveredJarIndex].name;
      if (!inventory.includes(name)) {
        if (activeHoldJarIndex !== hoveredJarIndex) {
          activeHoldJarIndex = hoveredJarIndex;
          holdTime = 0;
        } else {
          holdTime += dt;
        }
      }
    }
    // Mobile/Mouse holding: isMouseDown is true and pointer is over the active hold jar
    else if (isMouseDown && hoveredJarIndex !== null && activeHoldJarIndex === hoveredJarIndex) {
      const name = list[hoveredJarIndex].name;
      if (!inventory.includes(name)) {
        holdTime += dt;
      }
    }
    // Releasing key / mouse up
    else {
      if (!(isMouseDown && hoveredJarIndex !== null && activeHoldJarIndex === hoveredJarIndex)) {
        activeHoldJarIndex = null;
        holdTime = 0;
      }
    }
    
    // Trigger successful collection
    if (activeHoldJarIndex !== null && holdTime >= 1.0) {
      const ing = list[activeHoldJarIndex];
      if (!inventory.includes(ing.name)) {
        inventory.push(ing.name);
        
        // Slide animation values
        const r = Math.floor(activeHoldJarIndex / 3);
        const c = activeHoldJarIndex % 3;
        const rowY = [250, 510, 770];
        const colX = [480, 960, 1440];
        const startX = colX[c];
        const startY = rowY[r];
        
        const hotbarXStart = 536;
        const hotbarY = 960;
        const slotSize = 80;
        const slotSpacing = 16;
        const endX = hotbarXStart + activeHoldJarIndex * (slotSize + slotSpacing) + slotSize/2;
        // Y target coordinate is hotbarY + 10 for ingredients, hotbarY + 10 + slotSize + 12 for bottles
        const endY = (activeCabinet === 'INGREDIENT') ? (hotbarY + 10 + slotSize/2) : (hotbarY + 10 + slotSize + 12 + slotSize/2);
        
        activeAnimations.push({
          type: 'collect_slide',
          ingredientIndex: activeHoldJarIndex,
          isBottle: (activeCabinet === 'BOTTLE'),
          startX: startX,
          startY: startY,
          x: startX,
          y: startY,
          endX: endX,
          endY: endY,
          progress: 0,
          duration: 0.6
        });
      }
      activeHoldJarIndex = null;
      holdTime = 0;
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
  
  if (currentRoom === RoomState.SHOP) {
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
    ctx.fillStyle = 'rgba(74, 59, 50, 0.35)';
    ctx.beginPath();
    ctx.ellipse(50 + 16 * 11, CANVAS_HEIGHT - 12, 8 * 11, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(CANVAS_WIDTH - 16 * 11 - 50, CANVAS_HEIGHT - 12, 8 * 11, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    if (snakePlantImage.complete) {
      // Left Snake Plant
      ctx.drawImage(snakePlantImage, 50, CANVAS_HEIGHT - 32 * 11, 352, 352);
      // Right Snake Plant
      ctx.drawImage(snakePlantImage, CANVAS_WIDTH - 32 * 11 - 50, CANVAS_HEIGHT - 32 * 11, 352, 352);
    }
    
    // 5. Draw Ambient shadowy room tint overlay
    ctx.fillStyle = 'rgba(25, 20, 35, 0.25)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 6. Draw Glow Halos
    drawGlows();
    
  } else if (currentRoom === RoomState.WORKROOM) {
    // 1. Draw Workroom wood backing, wall, floor planks
    drawWorkroomBackground();
    
    // 2. Draw Y-Sorted Entities (stove, main cabinet, second cabinet, worktable, player)
    drawWorkroomEntities();
    
    // 3. Draw Steam Wisps
    drawSteamParticles();
    
    // 4. Tint
    ctx.fillStyle = 'rgba(25, 20, 35, 0.2)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 5. Glows
    drawWorkroomGlows();
  }
  
  // Cabinet View Overlay
  if (currentState === GameState.CABINET) {
    drawCabinetView();
  }
  
  // Inventory Hotbar (visible in both rooms during gameplay/cabinet)
  if (currentState === GameState.GAMEPLAY || currentState === GameState.CABINET) {
    drawInventoryHotbar();
  }
  
  // Active Slide Animations
  drawActiveAnimations();
  
  // Transition Overlay
  if (transitionAlpha > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
}

// --- WORKROOM RENDER HELPERS ---

function drawWorkroomBackground() {
  // 1. Draw outer backdrop color (wall background)
  ctx.fillStyle = '#3E2F25';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 500);
  
  // Wall panel vertical lines
  ctx.strokeStyle = '#2F231B';
  ctx.lineWidth = 4;
  for (let x = 120; x < CANVAS_WIDTH; x += 240) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 500);
    ctx.stroke();
  }
  
  // 2. Draw floor planks (Warm Honey Wood planks of height rowH)
  const rowH = 86;
  const floorStartY = 500;
  const floorEndY = CANVAS_HEIGHT;
  
  for (let y = floorStartY; y < floorEndY; y += rowH) {
    const nextY = Math.min(y + rowH, floorEndY);
    const currentH = nextY - y;
    
    ctx.fillStyle = '#C89A6A'; // Primary oak wood
    ctx.fillRect(0, y, CANVAS_WIDTH, currentH);
    
    // Grain Highlights
    ctx.fillStyle = '#EFE3D3';
    ctx.fillRect(0, y, CANVAS_WIDTH, 3);
    
    // Crevice lines
    ctx.fillStyle = '#4A2E1B';
    ctx.fillRect(0, y + currentH - 3, CANVAS_WIDTH, 3);
  }
  
  // Doorway to the shop (on the far left edge)
  ctx.fillStyle = '#171210';
  ctx.fillRect(0, 320, 24, 180);
  ctx.strokeStyle = '#4A3B32';
  ctx.lineWidth = 6;
  ctx.strokeRect(-10, 320, 34, 180);
}

function drawWorkroomEntities() {
  const drawables = [
    {
      y: 486,
      draw: () => {
        // Draw Stove (Y=310, bottom Y=486)
        drawSprite(ctx, stoveSprite, stoveColorMap, 300, 310, pixelScale);
      }
    },
    {
      y: 543,
      draw: () => {
        // Draw Main Cabinet (Y=53, bottom Y=543, aspect-ratio preserved size: 220x490)
        if (cabinetIngredientsImage.complete) {
          ctx.drawImage(cabinetIngredientsImage, 850, 53, 220, 490);
        } else {
          drawSprite(ctx, mainCabinetSprite, mainCabinetColorMap, 880, 280, pixelScale);
        }
      }
    },
    {
      y: 486,
      draw: () => {
        // Draw Second Cabinet (Y=310, bottom Y=486)
        drawSprite(ctx, secondCabinetSprite, secondCabinetColorMap, 1460, 310, pixelScale);
      }
    },
    {
      y: 486,
      draw: () => {
        // Draw Potted Plant beside Second Cabinet (bottom Y=486, size 120x156)
        if (pottedPlantImage.complete) {
          ctx.drawImage(pottedPlantImage, 1590, 330, 120, 156);
        }
      }
    },
    {
      y: 738,
      draw: () => {
        // Draw Worktable (Y=610, bottom Y=738)
        drawSprite(ctx, worktableSprite, worktableColorMap, 830, 610, pixelScale);
      }
    },
    {
      y: player.y + player.renderHeight,
      draw: () => {
        // Draw Player Shadow
        ctx.fillStyle = 'rgba(74, 59, 50, 0.45)';
        ctx.beginPath();
        ctx.ellipse(player.x + player.renderWidth/2, player.y + player.renderHeight, player.renderWidth/2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Draw Player
        drawSprite(ctx, playerSprite, playerColorMap, player.x, player.y, pixelScale);
      }
    }
  ];
  
  // 2.5D Y-Sort
  drawables.sort((a, b) => a.y - b.y);
  drawables.forEach(d => d.draw());
}

function drawSteamParticles() {
  ctx.save();
  steamParticles.forEach(p => {
    ctx.fillStyle = `rgba(240, 248, 255, ${p.alpha})`;
    const size = 6 + Math.sin(p.life * 5) * 2;
    ctx.fillRect(p.x, p.y, size, size);
  });
  ctx.restore();
}

function drawWorkroomGlows() {
  const t = Date.now() / 1000;
  ctx.globalCompositeOperation = 'screen';
  
  // Warm furnace glow from Stove (stove is at x = 300)
  const flicker = 0.95 + 0.05 * Math.sin(t * 3.5);
  const radius = 120 * flicker;
  const sX = 360;
  const sY = 430;
  
  const grad = ctx.createRadialGradient(sX, sY, 0, sX, sY, radius);
  grad.addColorStop(0, 'rgba(212, 63, 94, 0.4)');
  grad.addColorStop(0.4, 'rgba(244, 192, 94, 0.2)');
  grad.addColorStop(1, 'rgba(244, 192, 94, 0)');
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(sX, sY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalCompositeOperation = 'source-over';
}

// --- CABINET INTERFACE OVERLAY ---

function drawCabinetView() {
  // Wooden cabinet background backing
  ctx.fillStyle = '#2F231B';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Cabinet outer frames
  ctx.strokeStyle = '#8C6239';
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, CANVAS_WIDTH - 16, CANVAS_HEIGHT - 16);
  
  ctx.strokeStyle = '#1d1511';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, CANVAS_WIDTH - 32, CANVAS_HEIGHT - 32);
  
  // Cabinet interior shelves
  const shelvesY = [310, 570, 830];
  shelvesY.forEach(sy => {
    ctx.fillStyle = '#8C6239';
    ctx.fillRect(100, sy, CANVAS_WIDTH - 200, 24);
    
    ctx.strokeStyle = '#1d1511';
    ctx.lineWidth = 4;
    ctx.strokeRect(100, sy, CANVAS_WIDTH - 200, 24);
    
    ctx.fillStyle = '#C89A6A';
    ctx.fillRect(100, sy + 2, CANVAS_WIDTH - 200, 4);
  });
  
  // Title Header
  ctx.fillStyle = '#F5F2EB';
  ctx.font = 'bold 44px "EB Garamond", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const titleText = activeCabinet === 'INGREDIENT' ? "Apothecary Cabinet - Ingredients" : "Storage Cabinet - Empty Bottles";
  ctx.fillText(titleText, CANVAS_WIDTH/2, 40);
  
  // Category headers
  const list = activeCabinet === 'INGREDIENT' ? ingredients : bottles;
  const categories = activeCabinet === 'INGREDIENT' ? ['Roots & Barks', 'Binders & Bases', 'Sweeteners & Flavorings'] : ['Clear Bottles', 'Cobalt Blue Bottles', 'Amber Bottles'];
  
  ctx.fillStyle = '#F0E4CC';
  ctx.font = 'bold 36px "EB Garamond", serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(categories[0], 120, 160);
  ctx.fillText(categories[1], 120, 420);
  ctx.fillText(categories[2], 120, 680);
  
  // Jars and labels drawing
  const rowY = [250, 510, 770];
  const colX = [480, 960, 1440];
  
  for (let i = 0; i < 9; i++) {
    const r = Math.floor(i / 3);
    const c = i % 3;
    const jarX = colX[c];
    const jarY = rowY[r];
    
    const isCollected = inventory.includes(list[i].name);
    
    ctx.save();
    if (isCollected) {
      ctx.globalAlpha = 0.45; // Dim collected jars
    }
    
    // Draw the jar (pixelScale = 8)
    drawCabinetJar(ctx, list[i], jarX, jarY, 8);
    ctx.restore();
    
    // Draw hand-lettered label card beneath
    const labelW = 180;
    const labelH = 40;
    const ly = jarY + 80;
    
    ctx.fillStyle = '#F5F2EB';
    ctx.strokeStyle = '#1d1511';
    ctx.lineWidth = 3;
    ctx.fillRect(jarX - labelW/2, ly, labelW, labelH);
    ctx.strokeRect(jarX - labelW/2, ly, labelW, labelH);
    
    ctx.fillStyle = '#4A3B32';
    ctx.font = 'bold 20px "EB Garamond", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(list[i].name, jarX, ly + labelH/2);
    
    // Radial hold-progress feedback
    if (activeHoldJarIndex === i) {
      const progress = holdTime / 1.0;
      ctx.beginPath();
      ctx.arc(jarX, jarY, 70, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(29, 21, 17, 0.4)';
      ctx.lineWidth = 8;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(jarX, jarY, 70, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.strokeStyle = '#F4C05E'; // glowing gold Progress Arc
      ctx.lineWidth = 8;
      ctx.stroke();
    }
  }
  
  // Close Button [Esc]
  ctx.fillStyle = '#F5F2EB';
  ctx.strokeStyle = '#1d1511';
  ctx.lineWidth = 4;
  ctx.fillRect(1740, 50, 120, 60);
  ctx.strokeRect(1740, 50, 120, 60);
  
  ctx.fillStyle = '#4A3B32';
  ctx.font = 'bold 24px "EB Garamond", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CLOSE', 1800, 75);
  ctx.font = '14px "EB Garamond", serif';
  ctx.fillText('[Esc]', 1800, 95);
}

// --- HOTBAR & INVENTORY ---

const hotbarXStart = 536;
const hotbarY = 860; // Shifted up to hold 2 rows
const slotSize = 80;
const slotSpacing = 16;

function drawInventoryHotbar() {
  // Wooden plank backer (holds 2 rows, height 200px)
  ctx.fillStyle = '#8C6239';
  ctx.fillRect(516, 860, 888, 200);
  
  ctx.strokeStyle = '#1d1511';
  ctx.lineWidth = 6;
  ctx.strokeRect(516, 860, 888, 200);
  
  ctx.fillStyle = '#C89A6A';
  ctx.fillRect(516, 862, 888, 4);
  
  // Row 1: Ingredients
  for (let i = 0; i < 9; i++) {
    const slotX = hotbarXStart + i * (slotSize + slotSpacing);
    const slotY = hotbarY + 10;
    
    // Slot frame
    ctx.fillStyle = '#4A2E1B';
    ctx.fillRect(slotX, slotY, slotSize, slotSize);
    
    ctx.strokeStyle = '#1d1511';
    ctx.lineWidth = 4;
    ctx.strokeRect(slotX, slotY, slotSize, slotSize);
    
    const name = ingredients[i].name;
    if (inventory.includes(name)) {
      const isAnimating = activeAnimations.some(anim => anim.type === 'collect_slide' && !anim.isBottle && anim.ingredientIndex === i);
      if (!isAnimating) {
        drawCabinetJar(ctx, ingredients[i], slotX + slotSize/2, slotY + slotSize/2, 4);
      }
    } else {
      ctx.save();
      ctx.globalAlpha = 0.15;
      drawCabinetJar(ctx, ingredients[i], slotX + slotSize/2, slotY + slotSize/2, 4);
      ctx.restore();
    }
  }
  
  // Row 2: Empty Bottles
  for (let i = 0; i < 9; i++) {
    const slotX = hotbarXStart + i * (slotSize + slotSpacing);
    const slotY = hotbarY + 10 + slotSize + 12; // Shifted down 92px
    
    // Slot frame
    ctx.fillStyle = '#4A2E1B';
    ctx.fillRect(slotX, slotY, slotSize, slotSize);
    
    ctx.strokeStyle = '#1d1511';
    ctx.lineWidth = 4;
    ctx.strokeRect(slotX, slotY, slotSize, slotSize);
    
    const name = bottles[i].name;
    if (inventory.includes(name)) {
      const isAnimating = activeAnimations.some(anim => anim.type === 'collect_slide' && anim.isBottle && anim.ingredientIndex === i);
      if (!isAnimating) {
        drawCabinetJar(ctx, bottles[i], slotX + slotSize/2, slotY + slotSize/2, 4);
      }
    } else {
      ctx.save();
      ctx.globalAlpha = 0.15;
      drawCabinetJar(ctx, bottles[i], slotX + slotSize/2, slotY + slotSize/2, 4);
      ctx.restore();
    }
  }
}

function drawActiveAnimations() {
  activeAnimations.forEach(anim => {
    if (anim.type === 'collect_slide') {
      const list = anim.isBottle ? bottles : ingredients;
      const ing = list[anim.ingredientIndex];
      const scale = 8 - 4 * anim.progress;
      drawCabinetJar(ctx, ing, anim.x, anim.y, scale);
    }
  });
}

// --- INGREDIENTS BOOK & RECIPE ACQUISITION SYSTEM ---
let activeRecipePage = 1;
let acquiredRecipes = []; // Stores page numbers (1, 2, 3)

const recipes = {
  1: {
    title: "Willow Bark Decoction",
    usage: "Fever / Pain relief",
    ingredients: [
      "Willow Bark (Salix alba)",
      "Water (available on stove)"
    ],
    steps: [
      "Crush willow bark using mortar and pestle",
      "Boil crushed bark in water for an extended period to extract salicin",
      "Strain through cloth to remove plant fibers",
      "Transfer syrup to an empty bottle"
    ],
    icon: "🍃"
  },
  2: {
    title: "Healing Salve",
    usage: "Antiseptic",
    ingredients: [
      "Beeswax",
      "Animal Fat",
      "Herbal extracts"
    ],
    steps: [
      "Melt fats and beeswax together over low heat in a basin",
      "Stir in herbal extracts as it cools",
      "Pour into jars to set into an ointment",
      "Transfer syrup to an empty bottle"
    ],
    icon: "🌸"
  },
  3: {
    title: "Tulsi-Ginger Syrup",
    usage: "Decongestion (cough/cold)",
    ingredients: [
      "Tulsi (Holy Basil)",
      "Ginger",
      "Long Pepper (Pippali)",
      "Jaggery",
      "Honey"
    ],
    steps: [
      "Crush or grate freshly washed tulsi leaves and peeled ginger using mortar and pestle",
      "Combine with crushed jaggery in a pan, heat gently over low flame",
      "Stir in finely powdered pippali (or black pepper) into the warm syrup",
      "Once cooled completely, mix in raw honey",
      "Transfer syrup to an empty bottle"
    ],
    icon: "🧪"
  }
};

function openBookView(page = 1) {
  currentState = GameState.BOOK;
  activeRecipePage = page;
  interactionPrompt.classList.add('hidden');
  document.getElementById('book-ui').classList.remove('hidden');
  renderBookPage();
}

function closeBookView() {
  currentState = GameState.GAMEPLAY;
  document.getElementById('book-ui').classList.add('hidden');
}

function renderBookPage() {
  const recipe = recipes[activeRecipePage];
  const isAcquired = acquiredRecipes.includes(activeRecipePage);
  
  // Highlight active page in Left Page Index
  document.querySelectorAll('.recipe-index .index-item').forEach(item => {
    const pageNum = parseInt(item.getAttribute('data-page'));
    if (pageNum === activeRecipePage) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Render navigation button visibility
  const prevBtn = document.getElementById('book-prev-btn');
  const nextBtn = document.getElementById('book-next-btn');
  if (activeRecipePage === 1) {
    prevBtn.classList.add('hidden');
  } else {
    prevBtn.classList.remove('hidden');
  }
  if (activeRecipePage === 3) {
    nextBtn.classList.add('hidden');
  } else {
    nextBtn.classList.remove('hidden');
  }

  // Right Page HTML content
  const container = document.getElementById('right-page-content');
  container.innerHTML = `
    <div class="recipe-header">
      <h3 class="recipe-usage">${recipe.usage}</h3>
      <div class="recipe-title-row" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
        <h2 class="recipe-title" style="margin: 0; font-size: 2.2rem;">${recipe.title}</h2>
        <button id="lets-make-btn" class="lets-make-btn small-btn ${isAcquired ? 'acquired' : ''}">
          ${isAcquired ? 'Acquired ✓' : "Acquire"}
        </button>
      </div>
      <div class="book-divider" style="margin: 10px 0 15px;"></div>
    </div>
    
    <h4 class="recipe-section-title">Ingredients</h4>
    <ul class="recipe-ingredients-list">
      ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
    </ul>
    
    <h4 class="recipe-section-title">Preparation Steps</h4>
    <ol class="recipe-steps-list">
      ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
    </ol>
    
    ${isAcquired ? `
    <div class="lets-make-container" style="padding-top: 15px; margin-top: auto;">
      <button id="unacquire-link" class="unacquire-link">Unacquire recipe</button>
    </div>
    ` : ''}
  `;

  // Bind actions
  const letsMakeBtn = document.getElementById('lets-make-btn');
  if (letsMakeBtn && !isAcquired) {
    letsMakeBtn.addEventListener('click', () => {
      acquireRecipe(activeRecipePage);
    });
  }

  const unacquireLink = document.getElementById('unacquire-link');
  if (unacquireLink) {
    unacquireLink.addEventListener('click', (e) => {
      e.stopPropagation();
      unacquireRecipe(activeRecipePage);
    });
  }
}

function acquireRecipe(page) {
  if (!acquiredRecipes.includes(page)) {
    acquiredRecipes.push(page);
    acquiredRecipes.sort((a, b) => a - b);
    renderBookPage();
    renderAcquiredRecipes();
  }
}

function unacquireRecipe(page) {
  const index = acquiredRecipes.indexOf(page);
  if (index > -1) {
    acquiredRecipes.splice(index, 1);
    renderBookPage();
    renderAcquiredRecipes();
  }
}

function renderAcquiredRecipes() {
  const panel = document.getElementById('acquired-recipes-container');
  panel.innerHTML = '';
  acquiredRecipes.forEach(page => {
    const recipe = recipes[page];
    const badge = document.createElement('div');
    badge.className = 'acquired-recipe-badge';
    badge.setAttribute('data-tooltip', recipe.title);
    
    // Roman Numeral corresponding to volume / page number
    const romanNumerals = { 1: "I", 2: "II", 3: "III" };
    const roman = romanNumerals[page] || page;
    
    // SVG book outline with Volume label overlay
    badge.innerHTML = `
      <svg class="recipe-badge-svg" viewBox="0 0 24 24" fill="none" stroke="#F5EBD0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 36px; height: 36px;">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
      <span class="badge-num">${roman}</span>
    `;
    
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      openManuscriptView(page);
    });
    panel.appendChild(badge);
  });
}

function openManuscriptView(page) {
  currentState = GameState.BOOK;
  activeRecipePage = page;
  interactionPrompt.classList.add('hidden');
  document.getElementById('manuscript-ui').classList.remove('hidden');
  renderManuscriptPage();
}

function closeManuscriptView() {
  currentState = GameState.GAMEPLAY;
  document.getElementById('manuscript-ui').classList.add('hidden');
}

function renderManuscriptPage() {
  const recipe = recipes[activeRecipePage];
  const container = document.getElementById('manuscript-page-content');
  
  container.innerHTML = `
    <div class="recipe-header">
      <h3 class="recipe-usage">${recipe.usage}</h3>
      <h2 class="recipe-title">${recipe.title}</h2>
      <div class="book-divider" style="background: #c2b59b; margin: 15px 0 20px;"></div>
    </div>
    
    <h4 class="recipe-section-title">Ingredients</h4>
    <ul class="recipe-ingredients-list">
      ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
    </ul>
    
    <h4 class="recipe-section-title">Preparation Steps</h4>
    <ol class="recipe-steps-list">
      ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
    </ol>
    
    <div class="lets-make-container" style="padding-top: 30px;">
      <button id="manuscript-unacquire-link" class="unacquire-link">Unacquire recipe</button>
    </div>
  `;

  // Bind unacquire action
  const unacquireLink = document.getElementById('manuscript-unacquire-link');
  if (unacquireLink) {
    unacquireLink.addEventListener('click', (e) => {
      e.stopPropagation();
      unacquireRecipe(activeRecipePage);
      closeManuscriptView();
    });
  }
}

function initBookUIEvents() {
  document.getElementById('book-close-btn').addEventListener('click', closeBookView);
  document.getElementById('book-prev-btn').addEventListener('click', () => {
    if (activeRecipePage > 1) {
      activeRecipePage--;
      renderBookPage();
    }
  });
  document.getElementById('book-next-btn').addEventListener('click', () => {
    if (activeRecipePage < 3) {
      activeRecipePage++;
      renderBookPage();
    }
  });

  // Table of Contents click listeners
  document.querySelectorAll('.recipe-index .index-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = parseInt(item.getAttribute('data-page'));
      activeRecipePage = page;
      renderBookPage();
    });
  });

  // Background overlay clicks
  document.querySelector('.book-overlay-bg').addEventListener('click', closeBookView);
  
  // Manuscript close events
  document.getElementById('manuscript-close-btn').addEventListener('click', closeManuscriptView);
  document.querySelector('#manuscript-ui .book-overlay-bg').addEventListener('click', closeManuscriptView);
}

// Initialize book events on load
initBookUIEvents();

requestAnimationFrame((time) => {
  lastTime = time;
  requestAnimationFrame(gameLoop);
});
