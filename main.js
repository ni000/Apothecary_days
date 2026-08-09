// Game Constants
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const PLAYER_SPEED = 400; // pixels per second
const NPC_SPEED = 200;

// Game State Enum
const GameState = { MENU: 'MENU', TRANSITION: 'TRANSITION', GAMEPLAY: 'GAMEPLAY', DIALOGUE: 'DIALOGUE', CABINET: 'CABINET', BOOK: 'BOOK', WORKTABLE: 'WORKTABLE' };
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
const keys = { w: false, a: false, s: false, d: false, e: false, space: false };
const keysPressed = { e: false, space: false };

function handleKeyDown(e) {
  if (e.key === 'Escape' && currentState === GameState.CABINET) {
    exitCabinetView();
  }
  if (e.key === 'Escape' && currentState === GameState.BOOK) {
    closeBookView();
    closeManuscriptView();
  }
  if (e.key === 'Escape' && currentState === GameState.WORKTABLE) {
    exitWorktableView();
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

  if (e.code === 'Space' || e.key === ' ') {
    keys.space = true;
    keysPressed.space = true;
    e.preventDefault();
  }

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

  if (e.code === 'Space' || e.key === ' ') {
    keys.space = false;
  }

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
  if (draggedItemIndex !== null || isDraggingFromMortar) {
    draggedItemX = mouseCanvasX;
    draggedItemY = mouseCanvasY;
  }
});
canvas.addEventListener('touchmove', (e) => {
  const pos = getCanvasMousePos(e);
  mouseCanvasX = pos.x;
  mouseCanvasY = pos.y;
  if (draggedItemIndex !== null || isDraggingFromMortar) {
    draggedItemX = mouseCanvasX;
    draggedItemY = mouseCanvasY;
  }
});

canvas.addEventListener('mousedown', (e) => {
  const pos = getCanvasMousePos(e);
  mouseCanvasX = pos.x;
  mouseCanvasY = pos.y;
  isMouseDown = true;

  if (currentState === GameState.GAMEPLAY || currentState === GameState.CABINET || currentState === GameState.WORKTABLE) {
    if (mouseCanvasY >= 920 && mouseCanvasY <= 1040) {
      for (let i = 0; i < 10; i++) {
        const slotX = 488 + i * (slotSize + slotSpacing);
        if (mouseCanvasX >= slotX && mouseCanvasX <= slotX + slotSize) {
          if (i < inventory.length) {
            draggedItemIndex = i;
            draggedItemX = mouseCanvasX;
            draggedItemY = mouseCanvasY;
            return;
          }
        }
      }
    }
  }

  if (currentState === GameState.WORKTABLE) {
    // Check Close Button: bounding box x [1740, 1860], y [50, 110]
    if (mouseCanvasX >= 1740 && mouseCanvasX <= 1860 && mouseCanvasY >= 50 && mouseCanvasY <= 110) {
      exitWorktableView();
      return;
    }

    // Mortar & Pestle bounding box: X [290, 870], Y [330, 630]
    if (mouseCanvasX >= 290 && mouseCanvasX <= 870 && mouseCanvasY >= 330 && mouseCanvasY <= 630) {
      if (mortarState === 'FULL') {
        mortarState = 'MIXING';
        mortarMixingTime = 0;
        return;
      }
      if (mortarState === 'MIXED') {
        isDraggingFromMortar = true;
        draggedItemX = mouseCanvasX;
        draggedItemY = mouseCanvasY;
        return;
      }
    }

    // Copper Bowl bounding box: X [930, 1590], Y [310, 650]
    if (mouseCanvasX >= 930 && mouseCanvasX <= 1590 && mouseCanvasY >= 310 && mouseCanvasY <= 650) {
      if (copperBowlState === 'FULL') {
        if (inventory.length < 10) {
          inventory.push("Willow Bark Mixture");
          copperBowlState = 'COLLECTED';

          const slotIndex = inventory.length - 1;
          const slotX = 488 + slotIndex * (slotSize + slotSpacing);
          const slotY = 940;
          activeAnimations.push({
            type: 'collect_slide',
            itemName: 'Willow Bark Mixture',
            startX: 1260,
            startY: 480,
            x: 1260,
            y: 480,
            endX: slotX + slotSize / 2,
            endY: slotY + slotSize / 2,
            progress: 0,
            duration: 0.6
          });
        }
        return;
      }
    }
  } else if (currentState === GameState.CABINET) {
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
    // Check tap on Stove (x: [300, 420], y: [410, 476])
    if (mouseCanvasX >= 300 && mouseCanvasX <= 420 && mouseCanvasY >= 410 && mouseCanvasY <= 476) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - 360, 2) + Math.pow((player.y + player.renderHeight / 2) - 443, 2));
      const hasMixture = inventory.includes("Willow Bark Mixture");
      const hasBottle = inventory.some(name => bottles.some(b => b.name === name));
      if (dist < 250 && (currentCustomerState === CustomerState.STEPS || currentCustomerState === CustomerState.CRAFTING) && hasMixture && hasBottle && !inventory.includes("Willow Bark Decoction")) {
        activeHoldStove = true;
        isBrewing = true;
        brewingTime = 0;
      }
    }
    // Check tap on Barrel (x: [670, 830], y: [383, 543])
    else if (mouseCanvasX >= 670 && mouseCanvasX <= 830 && mouseCanvasY >= 383 && mouseCanvasY <= 543) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - 750, 2) + Math.pow((player.y + player.renderHeight / 2) - 463, 2));
      if (dist < 250 && !inventory.includes('Water')) {
        activeHoldBarrel = true;
        holdTime = 0;
      }
    }
    // Check tap on Main Cabinet
    else if (mouseCanvasX >= 850 && mouseCanvasX <= 1070 && mouseCanvasY >= 100 && mouseCanvasY <= 543) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - 960, 2) + Math.pow((player.y + player.renderHeight / 2) - 500, 2));
      if (dist < 250) {
        activeCabinet = 'INGREDIENT';
        openCabinetView();
      }
    }
    // Check tap on Second Cabinet (Bottle Cabinet)
    else if (mouseCanvasX >= 1460 && mouseCanvasX <= 1580 && mouseCanvasY >= 290 && mouseCanvasY <= 470) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - 1520, 2) + Math.pow((player.y + player.renderHeight / 2) - 440, 2));
      if (dist < 250) {
        activeCabinet = 'BOTTLE';
        openCabinetView();
      }
    }
  } else if (currentState === GameState.GAMEPLAY && currentRoom === RoomState.WORKROOM) {
    // Check tap on Worktable (x: [830, 1090], y: [700, 840])
    if (mouseCanvasX >= 830 && mouseCanvasX <= 1090 && mouseCanvasY >= 700 && mouseCanvasY <= 840) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - 960, 2) + Math.pow((player.y + player.renderHeight) - 770, 2));
      if (dist < 250) {
        openWorktableView();
        return;
      }
    }
  } else if (currentState === GameState.GAMEPLAY && currentRoom === RoomState.SHOP) {
    // Check tap on NPC
    if (npc.active && npc.reachedCounter && mouseCanvasX >= npc.x && mouseCanvasX <= npc.x + npc.renderWidth && mouseCanvasY >= npc.y && mouseCanvasY <= npc.y + npc.renderHeight) {
      const xDist = Math.abs((player.x + player.renderWidth / 2) - (npc.x + npc.renderWidth / 2));
      const yDist = Math.abs((player.y + player.renderHeight / 2) - (npc.y + npc.renderHeight / 2));
      if (xDist < 350 && yDist < 420) {
        if (currentCustomerState === CustomerState.DELIVERY) {
          startDialogue("Thank you! This works like magic");
          const remedyIndex = inventory.indexOf("Willow Bark Decoction");
          if (remedyIndex > -1) inventory.splice(remedyIndex, 1);
          playMoneySound();
          updateCoins(100);
          npc.reachedCounter = false;
          npc.targetX = CANVAS_WIDTH + 200;
          currentCustomerState = CustomerState.IDLE;
          activeAilmentType = null;
          isShopOpen = false;
          updateObjective();
        } else {
          startDialogue();
        }
      }
    }
    // Check tap on Book (only after customer's first dialogue)
    else if (currentCustomerState >= CustomerState.LOOKUP && mouseCanvasX >= 900 && mouseCanvasX <= 1100 && mouseCanvasY >= 450 && mouseCanvasY <= 580) {
      const dist = Math.hypot((player.x + player.renderWidth / 2) - 998, (player.y + player.renderHeight / 2) - 496);
      if (dist < 380) {
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

  if (currentState === GameState.GAMEPLAY || currentState === GameState.CABINET || currentState === GameState.WORKTABLE) {
    if (mouseCanvasY >= 920 && mouseCanvasY <= 1040) {
      for (let i = 0; i < 10; i++) {
        const slotX = 488 + i * (slotSize + slotSpacing);
        if (mouseCanvasX >= slotX && mouseCanvasX <= slotX + slotSize) {
          if (i < inventory.length) {
            draggedItemIndex = i;
            draggedItemX = mouseCanvasX;
            draggedItemY = mouseCanvasY;
            return;
          }
        }
      }
    }
  }

  if (currentState === GameState.WORKTABLE) {
    // Check Close Button
    if (mouseCanvasX >= 1740 && mouseCanvasX <= 1860 && mouseCanvasY >= 50 && mouseCanvasY <= 110) {
      exitWorktableView();
      return;
    }
    // Mortar & Pestle bounding box: X [290, 870], Y [330, 630]
    if (mouseCanvasX >= 290 && mouseCanvasX <= 870 && mouseCanvasY >= 330 && mouseCanvasY <= 630) {
      if (mortarState === 'FULL') {
        mortarState = 'MIXING';
        mortarMixingTime = 0;
        return;
      }
      if (mortarState === 'MIXED') {
        isDraggingFromMortar = true;
        draggedItemX = mouseCanvasX;
        draggedItemY = mouseCanvasY;
        return;
      }
    }
    // Copper Bowl bounding box: X [930, 1590], Y [310, 650]
    if (mouseCanvasX >= 930 && mouseCanvasX <= 1590 && mouseCanvasY >= 310 && mouseCanvasY <= 650) {
      if (copperBowlState === 'FULL') {
        if (inventory.length < 10) {
          inventory.push("Willow Bark Mixture");
          copperBowlState = 'COLLECTED';

          const slotIndex = inventory.length - 1;
          const slotX = 488 + slotIndex * (slotSize + slotSpacing);
          const slotY = 940;
          activeAnimations.push({
            type: 'collect_slide',
            itemName: 'Willow Bark Mixture',
            startX: 1260,
            startY: 480,
            x: 1260,
            y: 480,
            endX: slotX + slotSize / 2,
            endY: slotY + slotSize / 2,
            progress: 0,
            duration: 0.6
          });
        }
        return;
      }
    }
  } else if (currentState === GameState.CABINET) {
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
    // Check tap on Stove (x: [300, 420], y: [410, 476])
    if (mouseCanvasX >= 300 && mouseCanvasX <= 420 && mouseCanvasY >= 410 && mouseCanvasY <= 476) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - 360, 2) + Math.pow((player.y + player.renderHeight / 2) - 443, 2));
      const hasMixture = inventory.includes("Willow Bark Mixture");
      const hasBottle = inventory.some(name => bottles.some(b => b.name === name));
      if (dist < 250 && (currentCustomerState === CustomerState.STEPS || currentCustomerState === CustomerState.CRAFTING) && hasMixture && hasBottle && !inventory.includes("Willow Bark Decoction")) {
        activeHoldStove = true;
        isBrewing = true;
        brewingTime = 0;
      }
    }
    // Check tap on Barrel (x: [670, 830], y: [383, 543])
    else if (mouseCanvasX >= 670 && mouseCanvasX <= 830 && mouseCanvasY >= 383 && mouseCanvasY <= 543) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - 750, 2) + Math.pow((player.y + player.renderHeight / 2) - 463, 2));
      if (dist < 250 && !inventory.includes('Water')) {
        activeHoldBarrel = true;
        holdTime = 0;
      }
    }
    // Check tap on Main Cabinet
    else if (mouseCanvasX >= 850 && mouseCanvasX <= 1070 && mouseCanvasY >= 100 && mouseCanvasY <= 543) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - 960, 2) + Math.pow((player.y + player.renderHeight / 2) - 500, 2));
      if (dist < 250) {
        activeCabinet = 'INGREDIENT';
        openCabinetView();
      }
    }
    // Check tap on Second Cabinet (Bottle Cabinet)
    else if (mouseCanvasX >= 1460 && mouseCanvasX <= 1580 && mouseCanvasY >= 290 && mouseCanvasY <= 470) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - 1520, 2) + Math.pow((player.y + player.renderHeight / 2) - 440, 2));
      if (dist < 250) {
        activeCabinet = 'BOTTLE';
        openCabinetView();
      }
    }
  } else if (currentState === GameState.GAMEPLAY && currentRoom === RoomState.WORKROOM) {
    if (mouseCanvasX >= 830 && mouseCanvasX <= 1090 && mouseCanvasY >= 700 && mouseCanvasY <= 840) {
      const dist = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - 960, 2) + Math.pow((player.y + player.renderHeight) - 770, 2));
      if (dist < 250) {
        openWorktableView();
        return;
      }
    }
  } else if (currentState === GameState.GAMEPLAY && currentRoom === RoomState.SHOP) {
    // Check tap on NPC
    if (npc.active && npc.reachedCounter && mouseCanvasX >= npc.x && mouseCanvasX <= npc.x + npc.renderWidth && mouseCanvasY >= npc.y && mouseCanvasY <= npc.y + npc.renderHeight) {
      const xDist = Math.abs((player.x + player.renderWidth / 2) - (npc.x + npc.renderWidth / 2));
      const yDist = Math.abs((player.y + player.renderHeight / 2) - (npc.y + npc.renderHeight / 2));
      if (xDist < 350 && yDist < 420) {
        if (currentCustomerState === CustomerState.DELIVERY) {
          startDialogue("Thank you! This works like magic");
          const remedyIndex = inventory.indexOf("Willow Bark Decoction");
          if (remedyIndex > -1) inventory.splice(remedyIndex, 1);
          playMoneySound();
          updateCoins(100);
          npc.reachedCounter = false;
          npc.targetX = CANVAS_WIDTH + 200;
          currentCustomerState = CustomerState.IDLE;
          activeAilmentType = null;
          isShopOpen = false;
          updateObjective();
        } else {
          startDialogue();
        }
      }
    }
    // Check tap on Book (only after customer's first dialogue)
    else if (currentCustomerState >= CustomerState.LOOKUP && mouseCanvasX >= 900 && mouseCanvasX <= 1100 && mouseCanvasY >= 450 && mouseCanvasY <= 580) {
      const dist = Math.hypot((player.x + player.renderWidth / 2) - 998, (player.y + player.renderHeight / 2) - 496);
      if (dist < 380) {
        openBookView();
      }
    }
  }
});

canvas.addEventListener('mouseup', () => {
  isMouseDown = false;
  if (draggedItemIndex !== null) {
    if (currentState === GameState.WORKTABLE) {
      // Check if dropped onto Mortar & Pestle
      if (mouseCanvasX >= 280 && mouseCanvasX <= 880 && mouseCanvasY >= 320 && mouseCanvasY <= 640) {
        const itemName = inventory[draggedItemIndex];
        if ((itemName === "Willow Bark" || itemName === "Water") && !mortarIngredients.includes(itemName) && (mortarState === 'EMPTY' || mortarState === 'HALF')) {
          mortarIngredients.push(itemName);
          inventory.splice(draggedItemIndex, 1);
          if (mortarIngredients.length === 1) mortarState = 'HALF';
          else if (mortarIngredients.length >= 2) mortarState = 'FULL';
        }
      } else if (mouseCanvasX < 468 || mouseCanvasX > 1452 || mouseCanvasY < 920 || mouseCanvasY > 1040) {
        inventory.splice(draggedItemIndex, 1);
        checkIngredientsCollected();
      }
    } else {
      if (mouseCanvasX < 468 || mouseCanvasX > 1452 || mouseCanvasY < 920 || mouseCanvasY > 1040) {
        inventory.splice(draggedItemIndex, 1);
        checkIngredientsCollected();
      }
    }
    draggedItemIndex = null;
  }

  if (isDraggingFromMortar) {
    // Check if dropped onto Copper Bowl
    if (mouseCanvasX >= 920 && mouseCanvasX <= 1600 && mouseCanvasY >= 300 && mouseCanvasY <= 660) {
      mortarState = 'EMPTY';
      mortarIngredients = [];
      copperBowlState = 'FULL';
    }
    isDraggingFromMortar = false;
  }

  if (activeHoldJarIndex !== null && !keys.e) {
    activeHoldJarIndex = null;
    holdTime = 0;
  }
  if (activeHoldBarrel) {
    activeHoldBarrel = false;
    holdTime = 0;
  }
  if (activeHoldStove) {
    activeHoldStove = false;
    isBrewing = false;
    brewingTime = 0;
  }
});

canvas.addEventListener('touchend', () => {
  isMouseDown = false;
  if (draggedItemIndex !== null) {
    if (currentState === GameState.WORKTABLE) {
      // Check if dropped onto Mortar & Pestle
      if (mouseCanvasX >= 280 && mouseCanvasX <= 880 && mouseCanvasY >= 320 && mouseCanvasY <= 640) {
        const itemName = inventory[draggedItemIndex];
        if ((itemName === "Willow Bark" || itemName === "Water") && !mortarIngredients.includes(itemName) && (mortarState === 'EMPTY' || mortarState === 'HALF')) {
          mortarIngredients.push(itemName);
          inventory.splice(draggedItemIndex, 1);
          if (mortarIngredients.length === 1) mortarState = 'HALF';
          else if (mortarIngredients.length >= 2) mortarState = 'FULL';
        }
      } else if (mouseCanvasX < 468 || mouseCanvasX > 1452 || mouseCanvasY < 920 || mouseCanvasY > 1040) {
        inventory.splice(draggedItemIndex, 1);
        checkIngredientsCollected();
      }
    } else {
      if (mouseCanvasX < 468 || mouseCanvasX > 1452 || mouseCanvasY < 920 || mouseCanvasY > 1040) {
        inventory.splice(draggedItemIndex, 1);
        checkIngredientsCollected();
      }
    }
    draggedItemIndex = null;
  }

  if (isDraggingFromMortar) {
    // Check if dropped onto Copper Bowl
    if (mouseCanvasX >= 920 && mouseCanvasX <= 1600 && mouseCanvasY >= 300 && mouseCanvasY <= 660) {
      mortarState = 'EMPTY';
      mortarIngredients = [];
      copperBowlState = 'FULL';
    }
    isDraggingFromMortar = false;
  }

  if (activeHoldJarIndex !== null && !keys.e) {
    activeHoldJarIndex = null;
    holdTime = 0;
  }
  if (activeHoldBarrel) {
    activeHoldBarrel = false;
    holdTime = 0;
  }
  if (activeHoldStove) {
    activeHoldStove = false;
    isBrewing = false;
    brewingTime = 0;
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

// Ancient Chinese Bronze Lotus Candle Sprite (9x13)
const candleSprite = [
  "....f....",
  "...fff...",
  "...fyf...",
  "...kwk...",
  "..krrrk..",
  ".krrrrrk.",
  ".krrrrrk.",
  ".krrrrrk.",
  ".krrrrrk.",
  "kkrrrrrkk",
  "kkbbmbbkk",
  "kbbbbbbbk",
  "kkkkkkkkk"
];
const candleColorMap = {
  'k': '#1D120B', // Dark outline
  'r': '#A82828', // Cinnabar red candle wax
  'w': '#5A3825', // Wick
  'f': '#F4C05E', // Warm flame
  'y': '#FFF5D6', // Luminous flame center
  'b': '#8C6D2B', // Antique bronze base
  'm': '#DEB34A', // Bronze highlight
  '.': null
};

// Ancient Chinese Palace Silk Lantern Sprite (11x15)
const lanternSprite = [
  ".....k.....",
  "...kkmkk...",
  "..kmmmmmk..",
  ".kkkkmkkkk.",
  ".ksssssssk.",
  "ksssgsssssk",
  "kssgyygsssk",
  "kssgyygsssk",
  "ksssgsssssk",
  ".ksssssssk.",
  ".kkkkmkkkk.",
  "..kmmmmmk..",
  "...kktkk...",
  "....ktk....",
  "....ktk...."
];
const lanternColorMap = {
  'k': '#1D120B', // Dark rosewood frame
  'm': '#DEB34A', // Carved gold/brass trim
  's': '#F5DCAD', // Amber silk panel
  'g': '#8C6D2B', // Lattice rib
  'y': '#FFE8B0', // Glowing lantern core
  't': '#A82828', // Red silk tassel
  '.': null
};

// Ancient Chinese Celadon / Porcelain Medicine Jar Sprite (10x12)
const jarSprite = [
  "...kkkk...",
  "..koooek..",
  "..kcccck..",
  ".kcccccck.",
  "kchcccccsk",
  "kchcccccsk",
  "kchkkkkcsk",
  "kchllllcsk",
  "kchcccccsk",
  "kchcccccsk",
  "kcccccccks",
  ".kkkkkkkk."
];
const jarColorMap = {
  'k': '#1D120B', // Dark outline
  'c': '#6B9E8A', // Pale Celadon jade glaze
  'h': '#9EC7B5', // Celadon highlight
  's': '#4A7A68', // Celadon shadow
  'o': '#8C6239', // Cork/wood stopper
  'e': '#B58855', // Stopper highlight
  'l': '#F2E8D5', // Paper label slip
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
let activeHoldBarrel = false;
let activeHoldStove = false;
let isBrewing = false;
let brewingTime = 0;
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
  { name: 'Honey', category: 'Sweeteners & Flavorings', color: '#d99011', highlight: '#ffbc42', shadow: '#a36603', lid: '#8c6239', lidHighlight: '#a3764b', isGlass: true },
  { name: 'Water', category: 'Liquids', color: '#87ceeb', highlight: '#ffffff', shadow: '#4ba3e3', lid: '#8a5a36', lidHighlight: '#a87a56', isGlass: true }
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
  "....kkkkkkkkkkkkkkkkkkkkkkkk....",
  "...khhhhhhhhhhhhhhhhhhhhhhhhsk..",
  "..kHwwwwwwwwwwwwwwwwwwwwwwwwsk..",
  ".kHHHHHHHHHHHHHHHHHHHHHHHHHHHsk.",
  "kHhhhhhhhhhhhhhhhhhhhhhhhhhhhhsk",
  "kHwwwwwwwwwwwwwwwwwwwwwwwwwwwwsk",
  "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
  "..kwkhppdhkwksssssskwkhppdhkwk..",
  "..kwkhhhhhkwksssssskwkhhhhhkwk..",
  "..kkkkkkkkkkksssssskkkkkkkkkkk..",
  "..kwkhppdhkwksssssskwkhhhhhkwk..",
  "..kwkhhhhhkwk......kwkppdhhkwk..",
  "..kkkkkkkkkkk......kwkppdhhkwk..",
  "..kwkhppdhkwk......kwkppdhhkwk..",
  "..kwkhhhhhkwk......kwkhhhhhkwk..",
  "..kkkkkkkkkkk......kkkkkkkkkkk.."
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
      { x: 670, y: 470, w: 160, h: 73 },   // Barrel
      { x: 850, y: 470, w: 220, h: 73 },   // Main Cabinet
      { x: 1460, y: 410, w: 120, h: 60 },  // Second Cabinet
      { x: 1590, y: 440, w: 120, h: 30 },  // Potted Plant
      { x: 830, y: 720, w: 260, h: 128 }   // Worktable (shifted down 100px)
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
        mouseCanvasX >= jX - boxW / 2 &&
        mouseCanvasX <= jX + boxW / 2 &&
        mouseCanvasY >= jY - boxH / 2 &&
        mouseCanvasY <= jY + boxH / 2
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

function drawPlayerImage(ctx, x, y) {
  let img = playerDownImg;
  if (playerDirection === 'left') img = playerLeftImg;
  else if (playerDirection === 'right') img = playerRightImg;
  else if (playerDirection === 'up') img = playerUpImg;

  if (img.complete) {
    const scale = 0.82;
    const imgWidth = img.naturalWidth * scale;
    const imgHeight = img.naturalHeight * scale;
    // Center horizontally on the player's collision box, align bottom
    const drawX = x + (player.renderWidth - imgWidth) / 2;
    const drawY = y + player.renderHeight - imgHeight;
    ctx.drawImage(img, drawX, drawY, imgWidth, imgHeight);
  } else {
    // Fallback to original playerSprite drawing if image is not loaded
    drawSprite(ctx, playerSprite, playerColorMap, x, y, pixelScale);
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

// Load custom barrel image
const barrelImage = new Image();
barrelImage.src = 'barrel.png';

const pottedPlantImage = new Image();
pottedPlantImage.src = 'potted_plant.png';

// Load 4-directional player images
const playerDownImg = new Image();
playerDownImg.src = 'apothecary_down.png';

const playerLeftImg = new Image();
playerLeftImg.src = 'apothecary_left.png';

const playerRightImg = new Image();
playerRightImg.src = 'apothecary_right.png';

const playerUpImg = new Image();
playerUpImg.src = 'apothecary_up.png';

let playerDirection = 'down'; // Track current player direction

const bookImage = new Image();
bookImage.src = 'book.png';

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

// Load custom worktable close-up image
const tableCloseupImage = new Image();
tableCloseupImage.src = 'table_closeup.png';

// Load custom mortar & pestle images
const mortarEmptyImage = new Image();
mortarEmptyImage.src = 'mortar_empty.png';

const mortarHalfImage = new Image();
mortarHalfImage.src = 'mortar_half.png';

const mortarFull1Image = new Image();
mortarFull1Image.src = 'mortar_full_1.png';

const mortarFull2Image = new Image();
mortarFull2Image.src = 'mortar_full_2.png';

// Load custom copper bowl images
const copperBowlEmptyImage = new Image();
copperBowlEmptyImage.src = 'copper_bowl_empty.png';

const copperBowlFullImage = new Image();
copperBowlFullImage.src = 'copper_bowl_full.png';

// Worktable Crafting State Variables
let mortarIngredients = [];
let mortarState = 'EMPTY'; // 'EMPTY', 'HALF', 'FULL', 'MIXING', 'MIXED'
let mortarMixingTime = 0;
let copperBowlState = 'EMPTY'; // 'EMPTY', 'FULL', 'COLLECTED'
let isDraggingFromMortar = false;

function openWorktableView() {
  currentState = GameState.WORKTABLE;
  interactionPrompt.classList.add('hidden');
  if (copperBowlState === 'COLLECTED') {
    copperBowlState = 'EMPTY';
  }
}

function exitWorktableView() {
  currentState = GameState.GAMEPLAY;
  isDraggingFromMortar = false;
  if (copperBowlState === 'COLLECTED') {
    copperBowlState = 'EMPTY';
  }
}

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
  baseY: 350,
  vy: 0,
  jumpOffset: 0,
  renderWidth: playerSprite[0].length * pixelScale,
  renderHeight: playerSprite.length * pixelScale
};

const npc = {
  x: CANVAS_WIDTH + 100,
  y: 700, // Starts in front of the counter
  targetX: CANVAS_WIDTH / 2 - (playerSprite[0].length * pixelScale) / 2, // Centered in front of apothecary
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

// Coins & Currency with Simulator-style Satisfying Animation
let coins = 150;
let displayedCoins = 150;
let coinCountUpAnim = null;

function updateCoins(amount, animate = true) {
  const startCoins = coins;
  coins += amount;
  const targetCoins = coins;

  const panel = document.querySelector('.coin-panel');
  const coinElement = document.getElementById('coin-text');

  if (animate && panel && coinElement) {
    // 1. Box Jump animation
    panel.classList.remove('coin-jump');
    void panel.offsetWidth; // force reflow
    panel.classList.add('coin-jump');

    // 2. Color Flash
    coinElement.classList.add('coin-flash');

    // 3. Floating +100 text (lasts for ~4s)
    const floatEl = document.createElement('div');
    floatEl.className = 'coin-float-text';
    floatEl.textContent = `+${amount}`;
    panel.appendChild(floatEl);
    setTimeout(() => {
      if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
    }, 4200);

    // 4. Count-up animation paced over 4.0 seconds (4000ms)
    const startTime = performance.now();
    const duration = 4000;

    if (coinCountUpAnim) cancelAnimationFrame(coinCountUpAnim);

    function stepCountUp(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Paced ease progression across the 4 seconds
      const eased = progress < 0.85
        ? (progress / 0.85) * 0.9
        : 0.9 + ((progress - 0.85) / 0.15) * 0.1;
      displayedCoins = Math.round(startCoins + (targetCoins - startCoins) * Math.min(1, Math.max(0, eased)));
      coinElement.textContent = `🪙 ${displayedCoins}`;

      if (progress < 1) {
        coinCountUpAnim = requestAnimationFrame(stepCountUp);
      } else {
        displayedCoins = targetCoins;
        coinElement.textContent = `🪙 ${displayedCoins}`;
        coinElement.classList.remove('coin-flash');
        coinCountUpAnim = null;
      }
    }

    coinCountUpAnim = requestAnimationFrame(stepCountUp);
  } else if (coinElement) {
    displayedCoins = targetCoins;
    coinElement.textContent = `🪙 ${displayedCoins}`;
  }
}

// Customer Objective State Machine
const CustomerState = {
  IDLE: 0,        // STATE 0
  ARRIVAL: 1,     // STATE 1
  LOOKUP: 2,      // STATE 2
  INGREDIENTS: 3, // STATE 3
  STEPS: 4,       // STATE 4
  CRAFTING: 5,    // STATE 5
  DELIVERY: 6     // STATE 6
};

let currentCustomerState = CustomerState.ARRIVAL;
let activeAilmentType = null;
let hasOpenedBookInStepsState = false;
let isShopOpen = true;

const ailmentToRecipePage = {
  'PAIN': 1,
  'WOUND_INFECTION': 2,
  'CONGESTION': 3
};

const customerData = {
  1: {
    ailment: 'PAIN',
    dialogue: "Aughh! My head hurts. Make anything that stops the pain, I'll pay you anything!",
    recipePage: 1,
    remedyName: "Willow Bark Decoction"
  }
};
let activeCustomerNum = 1;
let activeDialogueString = "Hello!";

// Audio context, blip sound, and money click audio
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playBlipSound(char) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'triangle';

    const charCode = char.charCodeAt(0);
    const pitchOffset = (charCode % 8) * 12;
    osc.frequency.setValueAtTime(140 + pitchOffset, ctx.currentTime);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.start();
    osc.stop(ctx.currentTime + 0.075);
  } catch (e) {
    console.error('Audio error:', e);
  }
}

const moneyAudio = new Audio('/assets/money.mp3');

function playMoneySound() {
  try {
    moneyAudio.currentTime = 0;
    const playPromise = moneyAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => {
        console.warn('Audio playback prevented or file empty:', e);
      });
    }
  } catch (e) {
    console.error('Money sound error:', e);
  }
}

// Objective Text update helper
function updateObjective() {
  const element = document.getElementById('objective-text');
  if (!element) return;

  let text = "";
  switch (currentCustomerState) {
    case CustomerState.IDLE:
    case CustomerState.ARRIVAL:
      text = "Objective: Attend to the customer";
      break;
    case CustomerState.LOOKUP:
      if (activeAilmentType === 'PAIN') {
        text = "Objective: Check the recipe book: what relieves pain?";
      } else if (activeAilmentType === 'CONGESTION') {
        text = "Objective: Check the recipe book: what helps with congestion?";
      } else if (activeAilmentType === 'WOUND_INFECTION') {
        text = "Objective: Check the recipe book: what helps with wound infection?";
      } else {
        text = `Objective: Check the recipe book: what helps with ${activeAilmentType.toLowerCase()}?`;
      }
      break;
    case CustomerState.INGREDIENTS:
      const pageNum = ailmentToRecipePage[activeAilmentType];
      if (pageNum === 1) {
        text = "Objective: Collect ingredients: Willow Bark, Water";
      } else if (pageNum === 2) {
        text = "Objective: Collect ingredients: Beeswax, Fats, Herbal Extract";
      } else if (pageNum === 3) {
        text = "Objective: Collect ingredients: Tulsi, Ginger, Black Pepper, Jaggery, Honey";
      } else {
        text = "Objective: Collect ingredients";
      }
      break;
    case CustomerState.STEPS:
    case CustomerState.CRAFTING:
      text = "Objective: Follow the steps in the recipe book";
      break;
    case CustomerState.DELIVERY:
      if (activeAilmentType === 'PAIN') {
        text = "Objective: Deliver the Willow Bark Decoction";
      } else if (activeAilmentType === 'CONGESTION') {
        text = "Objective: Deliver the Tulsi-Ginger Syrup";
      } else if (activeAilmentType === 'WOUND_INFECTION') {
        text = "Objective: Deliver the Healing Salve";
      } else {
        text = "Objective: Deliver the remedy";
      }
      break;
  }
  element.textContent = text;
}

// Dialogue System
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
      isShopOpen = true;
      currentCustomerState = CustomerState.ARRIVAL;
      npc.active = true;
      npc.reachedCounter = false;
      npc.x = CANVAS_WIDTH + 100;
      npc.targetX = CANVAS_WIDTH / 2 - npc.renderWidth / 2;
      updateObjective();
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
  keysPressed.space = false;
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
          player.baseY = 520;
          player.jumpOffset = 0;
          player.vy = 0;
          player.y = 520;
        } else {
          player.x = CANVAS_WIDTH - player.renderWidth - 25; // Far right edge behind counter
          player.baseY = 350;
          player.jumpOffset = 0;
          player.vy = 0;
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
    if (currentRoom === RoomState.SHOP) {
      player.baseY = 350;

      // Apothecary sprite can only walk on ground horizontally (A / D or Left / Right) behind counter
      let dx = 0;
      if (keys.a) { dx -= 1; playerDirection = 'left'; }
      if (keys.d) { dx += 1; playerDirection = 'right'; }
      if (keys.s) { playerDirection = 'down'; } // Pressing S lets apothecary face forward
      if (keys.w) { playerDirection = 'up'; }   // Pressing W lets apothecary face backward

      // Axis-aligned horizontal movement on ground
      let targetX = player.x + dx * PLAYER_SPEED * dt;
      targetX = Math.max(20, targetX);

      let oldX = player.x;
      player.x = targetX;
      if (checkCollision(player.x, player.baseY, player.renderWidth, player.renderHeight)) {
        player.x = oldX;
      }

      // Jump physics on pressing Space key (in shop)
      if ((keysPressed.space || keys.space) && player.jumpOffset === 0) {
        player.vy = -750;
      }

      if (player.jumpOffset < 0 || player.vy !== 0) {
        const gravity = 2200;
        player.vy += gravity * dt;
        player.jumpOffset += player.vy * dt;
        if (player.jumpOffset >= 0) {
          player.jumpOffset = 0;
          player.vy = 0;
        }
      }

      player.y = player.baseY + player.jumpOffset;
    } else if (currentRoom === RoomState.WORKROOM) {
      // Free 2D movement in the Working Room
      let dx = 0; let dy = 0;
      if (keys.w) dy -= 1;
      if (keys.s) dy += 1;
      if (keys.a) dx -= 1;
      if (keys.d) dx += 1;

      if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length; dy /= length;
      }

      if (dx !== 0 || dy !== 0) {
        if (Math.abs(dy) >= Math.abs(dx)) {
          if (dy > 0) playerDirection = 'down';
          else if (dy < 0) playerDirection = 'up';
        } else {
          if (dx > 0) playerDirection = 'right';
          else if (dx < 0) playerDirection = 'left';
        }
      }

      // Smooth slide movement in 2D with collision
      let targetX = player.x + dx * PLAYER_SPEED * dt;
      let targetY = player.baseY + dy * PLAYER_SPEED * dt;

      // Keep inside screen bounds
      targetX = Math.max(0, Math.min(CANVAS_WIDTH - player.renderWidth, targetX));
      targetY = Math.max(320, Math.min(CANVAS_HEIGHT - player.renderHeight - 20, targetY));

      let oldX = player.x;
      player.x = targetX;
      if (checkCollision(player.x, player.baseY, player.renderWidth, player.renderHeight)) {
        player.x = oldX;
      }

      let oldY = player.baseY;
      player.baseY = targetY;
      if (checkCollision(player.x, player.baseY, player.renderWidth, player.renderHeight)) {
        player.baseY = oldY;
      }

      // Jump physics with Space key (in workroom)
      if ((keysPressed.space || keys.space) && player.jumpOffset === 0) {
        player.vy = -750;
      }

      if (player.jumpOffset < 0 || player.vy !== 0) {
        const gravity = 2200;
        player.vy += gravity * dt;
        player.jumpOffset += player.vy * dt;
        if (player.jumpOffset >= 0) {
          player.jumpOffset = 0;
          player.vy = 0;
        }
      }

      player.y = player.baseY + player.jumpOffset;
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
        if (Math.abs(npc.x - npc.targetX) > 5) {
          const dir = Math.sign(npc.targetX - npc.x);
          npc.x += dir * NPC_SPEED * dt;
        } else {
          npc.reachedCounter = true;
          if (npc.targetX > CANVAS_WIDTH) {
            npc.active = false;
          }
        }
      }

      const bookCenterX = 998;
      const bookCenterY = 496;
      const isNearBook = Math.abs((player.x + player.renderWidth / 2) - bookCenterX) < 320 && (player.baseY >= 280);

      let showNPCPrompt = false;
      const showNPCDelivery = (currentCustomerState === CustomerState.DELIVERY);
      const showNPCTalk = (currentCustomerState === CustomerState.ARRIVAL);

      if (npc.reachedCounter && (showNPCDelivery || showNPCTalk)) {
        const xDist = Math.abs((player.x + player.renderWidth / 2) - (npc.x + npc.renderWidth / 2));
        const yDist = Math.abs((player.baseY + player.renderHeight / 2) - (npc.y + npc.renderHeight / 2));
        if (xDist < 350 && yDist < 420) {
          showNPCPrompt = true;
        }
      }

      if (showNPCPrompt) {
        interactionPrompt.classList.remove('hidden');
        if (currentCustomerState === CustomerState.DELIVERY) {
          interactionPrompt.textContent = "Press E / Tap to Deliver Willow Bark Decoction";
        } else {
          interactionPrompt.textContent = "Press E / Tap to Talk";
        }
        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        const scaleX = containerRect.width / CANVAS_WIDTH;
        const scaleY = containerRect.height / CANVAS_HEIGHT;
        interactionPrompt.style.left = `${(npc.x + npc.renderWidth / 2) * scaleX}px`;
        interactionPrompt.style.top = `${(npc.y) * scaleY}px`;

        if (keysPressed.e) {
          if (currentCustomerState === CustomerState.DELIVERY) {
            startDialogue("Thank you! This works like magic");
            const remedyIndex = inventory.indexOf("Willow Bark Decoction");
            if (remedyIndex > -1) inventory.splice(remedyIndex, 1);
            playMoneySound();
            updateCoins(100);
            npc.reachedCounter = false;
            npc.targetX = CANVAS_WIDTH + 200;
            currentCustomerState = CustomerState.IDLE;
            activeAilmentType = null;
            isShopOpen = false;
            updateObjective();
          } else {
            startDialogue();
          }
        }
      }
      else if (isNearBook && currentCustomerState >= CustomerState.LOOKUP) {
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
      const barrelCenterX = 750;
      const barrelCenterY = 463;

      const isNearMain = Math.abs((player.x + player.renderWidth / 2) - mainCenterX) < 160 && Math.abs((player.baseY + player.renderHeight) - 543) < 100;
      const isNearBottle = Math.abs((player.x + player.renderWidth / 2) - bottleCenterX) < 140 && Math.abs((player.baseY + player.renderHeight) - 486) < 100;
      const distToBarrel = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - barrelCenterX, 2) + Math.pow((player.baseY + player.renderHeight / 2) - barrelCenterY, 2));

      let targetCabinet = null;
      let targetX = 0;
      let isBarrelTarget = false;

      if (distToBarrel < 180 && !inventory.includes('Water')) {
        if (!isNearMain) {
          isBarrelTarget = true;
          targetX = barrelCenterX;
        } else {
          targetCabinet = 'INGREDIENT';
          targetX = mainCenterX;
        }
      } else if (isNearMain) {
        targetCabinet = 'INGREDIENT';
        targetX = mainCenterX;
      } else if (isNearBottle) {
        targetCabinet = 'BOTTLE';
        targetX = bottleCenterX;
      }

      // Worktable proximity & interaction
      const tableCenterX = 960;
      const tableCenterY = 770;
      const distToTable = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - tableCenterX, 2) + Math.pow((player.baseY + player.renderHeight) - tableCenterY, 2));

      if (isBarrelTarget) {
        interactionPrompt.classList.remove('hidden');
        interactionPrompt.textContent = "Hold E / Tap to Collect Water";

        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        const scaleX = containerRect.width / CANVAS_WIDTH;
        const scaleY = containerRect.height / CANVAS_HEIGHT;
        interactionPrompt.style.left = `${targetX * scaleX}px`;
        interactionPrompt.style.top = `${280 * scaleY}px`;
      } else if (targetCabinet !== null) {
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
      } else if (distToTable < 200) {
        interactionPrompt.classList.remove('hidden');
        interactionPrompt.textContent = "Press E / Tap to Use Worktable";

        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        const scaleX = containerRect.width / CANVAS_WIDTH;
        const scaleY = containerRect.height / CANVAS_HEIGHT;
        interactionPrompt.style.left = `${tableCenterX * scaleX}px`;
        interactionPrompt.style.top = `${660 * scaleY}px`;

        if (keysPressed.e) {
          openWorktableView();
        }
      } else {
        interactionPrompt.classList.add('hidden');
      }

      // Barrel Hold-to-Collect logic
      const isHoldingEOnBarrel = (distToBarrel < 180 && keys.e && !inventory.includes('Water'));
      const isHoldingMouseOnBarrel = (activeHoldBarrel && isMouseDown && !inventory.includes('Water'));
      if (isHoldingEOnBarrel || isHoldingMouseOnBarrel) {
        holdTime += dt;
        if (holdTime >= 1.0) {
          if (inventory.length < 10) {
            inventory.push('Water');
            checkIngredientsCollected();

            const startX = 750;
            const startY = 463;
            const slotIndex = inventory.length - 1;
            const slotSize = 80;
            const slotSpacing = 16;
            const slotX = 488 + slotIndex * (slotSize + slotSpacing);
            const slotY = 940;
            const endX = slotX + slotSize / 2;
            const endY = slotY + slotSize / 2;

            activeAnimations.push({
              type: 'collect_slide',
              itemName: 'Water',
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

          holdTime = 0;
          activeHoldBarrel = false;
        }
      } else {
        if (holdTime > 0 && !activeHoldBarrel && !isHoldingEOnBarrel) {
          holdTime = 0;
        }
      }

      // Stove Interaction logic (brewing)
      const stoveCenterX = 360;
      const stoveCenterY = 443;
      const distToStove = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - stoveCenterX, 2) + Math.pow((player.y + player.renderHeight / 2) - stoveCenterY, 2));

      // For Willow Bark Decoction, strictly require "Willow Bark Mixture" + empty bottle (old shortcut removed!)
      const targetPage = ailmentToRecipePage[activeAilmentType] || 1;
      let hasRequiredForStove = false;
      let missingMessage = "";

      if (targetPage === 1) {
        const hasMixture = inventory.includes("Willow Bark Mixture");
        const hasBottle = inventory.some(name => bottles.some(b => b.name === name));
        hasRequiredForStove = hasMixture && hasBottle;
        if (!hasMixture) missingMessage = "Need Willow Bark Mixture (grind on worktable)";
        else if (!hasBottle) missingMessage = "Need an empty bottle";
      } else if (targetPage === 2) {
        const hasIngredients = inventory.includes("Beeswax") && inventory.includes("Fats") && inventory.includes("Herbal Extract");
        const hasBottle = inventory.some(name => bottles.some(b => b.name === name));
        hasRequiredForStove = hasIngredients && hasBottle;
        if (!hasIngredients) missingMessage = "Missing ingredients (Beeswax, Fats, Herbal Extract)";
        else if (!hasBottle) missingMessage = "Need an empty bottle";
      } else if (targetPage === 3) {
        const hasIngredients = inventory.includes("Tulsi") && inventory.includes("Ginger") && inventory.includes("Black Pepper") && inventory.includes("Jaggery") && inventory.includes("Honey");
        const hasBottle = inventory.some(name => bottles.some(b => b.name === name));
        hasRequiredForStove = hasIngredients && hasBottle;
        if (!hasIngredients) missingMessage = "Missing ingredients";
        else if (!hasBottle) missingMessage = "Need an empty bottle";
      }

      const canBrew = (currentCustomerState === CustomerState.STEPS || currentCustomerState === CustomerState.CRAFTING) && hasRequiredForStove && !inventory.includes("Willow Bark Decoction");

      if (distToStove < 180 && canBrew) {
        interactionPrompt.classList.remove('hidden');
        interactionPrompt.textContent = "Hold E / Tap to Brew Willow Bark Decoction";
        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        const scaleX = containerRect.width / CANVAS_WIDTH;
        const scaleY = containerRect.height / CANVAS_HEIGHT;
        interactionPrompt.style.left = `${stoveCenterX * scaleX}px`;
        interactionPrompt.style.top = `${360 * scaleY}px`;

        const isHoldingEOnStove = keys.e;
        const isHoldingMouseOnStove = activeHoldStove && isMouseDown;

        if (isHoldingEOnStove || isHoldingMouseOnStove) {
          isBrewing = true;
          brewingTime += dt;
          if (brewingTime >= 1.5) {
            const emptyBottleName = inventory.find(name => bottles.some(b => b.name === name));

            // Consume mixture or ingredients
            if (targetPage === 1) {
              const mixtureIndex = inventory.indexOf("Willow Bark Mixture");
              if (mixtureIndex > -1) inventory.splice(mixtureIndex, 1);
            }
            const bottleIndex = inventory.indexOf(emptyBottleName);
            if (bottleIndex > -1) inventory.splice(bottleIndex, 1);

            // Add brewed remedy
            inventory.push("Willow Bark Decoction");

            // Reset brewing
            isBrewing = false;
            brewingTime = 0;
            activeHoldStove = false;

            // State machine progression
            currentCustomerState = CustomerState.DELIVERY;
            updateObjective();

            const slotIndex = inventory.length - 1;
            const slotSize = 80;
            const slotSpacing = 16;
            const slotX = 488 + slotIndex * (slotSize + slotSpacing);
            const slotY = 940;
            const endX = slotX + slotSize / 2;
            const endY = slotY + slotSize / 2;

            activeAnimations.push({
              type: 'collect_slide',
              itemName: 'Willow Bark Decoction',
              startX: stoveCenterX,
              startY: stoveCenterY,
              x: stoveCenterX,
              y: stoveCenterY,
              endX: endX,
              endY: endY,
              progress: 0,
              duration: 0.6
            });
          }
        } else {
          isBrewing = false;
          brewingTime = 0;
        }
      } else if (distToStove < 180 && (currentCustomerState === CustomerState.STEPS || currentCustomerState === CustomerState.CRAFTING) && !hasRequiredForStove) {
        interactionPrompt.classList.remove('hidden');
        interactionPrompt.textContent = missingMessage;
        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        const scaleX = containerRect.width / CANVAS_WIDTH;
        const scaleY = containerRect.height / CANVAS_HEIGHT;
        interactionPrompt.style.left = `${stoveCenterX * scaleX}px`;
        interactionPrompt.style.top = `${360 * scaleY}px`;
        isBrewing = false;
        brewingTime = 0;
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
  } else if (currentState === GameState.WORKTABLE) {
    if (mortarState === 'FULL') {
      interactionPrompt.classList.remove('hidden');
      interactionPrompt.textContent = "Press E / Tap to Grind";
      const containerRect = document.getElementById('game-container').getBoundingClientRect();
      const scaleX = containerRect.width / CANVAS_WIDTH;
      const scaleY = containerRect.height / CANVAS_HEIGHT;
      interactionPrompt.style.left = `${580 * scaleX}px`;
      interactionPrompt.style.top = `${280 * scaleY}px`;
    } else if (copperBowlState === 'FULL') {
      interactionPrompt.classList.remove('hidden');
      interactionPrompt.textContent = "Press E / Tap to Collect Basin";
      const containerRect = document.getElementById('game-container').getBoundingClientRect();
      const scaleX = containerRect.width / CANVAS_WIDTH;
      const scaleY = containerRect.height / CANVAS_HEIGHT;
      interactionPrompt.style.left = `${1260 * scaleX}px`;
      interactionPrompt.style.top = `${280 * scaleY}px`;
    } else {
      interactionPrompt.classList.add('hidden');
    }

    // Mixing progression
    if (mortarState === 'MIXING') {
      mortarMixingTime += dt;
      if (mortarMixingTime >= 5.0) {
        mortarState = 'MIXED';
        mortarMixingTime = 0;
      }
    } else {
      if (mortarState === 'FULL' && keysPressed.e) {
        mortarState = 'MIXING';
        mortarMixingTime = 0;
      } else if (copperBowlState === 'FULL' && keysPressed.e) {
        if (inventory.length < 10) {
          inventory.push("Willow Bark Mixture");
          copperBowlState = 'COLLECTED';

          const slotIndex = inventory.length - 1;
          const slotX = 488 + slotIndex * (slotSize + slotSpacing);
          const slotY = 940;
          activeAnimations.push({
            type: 'collect_slide',
            itemName: 'Willow Bark Mixture',
            startX: 1260,
            startY: 480,
            x: 1260,
            y: 480,
            endX: slotX + slotSize / 2,
            endY: slotY + slotSize / 2,
            progress: 0,
            duration: 0.6
          });
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
        if (inventory.length < 10) {
          inventory.push(ing.name);
          checkIngredientsCollected();

          // Slide animation values
          const r = Math.floor(activeHoldJarIndex / 3);
          const c = activeHoldJarIndex % 3;
          const rowY = [250, 510, 770];
          const colX = [480, 960, 1440];
          const startX = colX[c];
          const startY = rowY[r];

          const slotIndex = inventory.length - 1;
          const slotSize = 80;
          const slotSpacing = 16;
          const slotX = 488 + slotIndex * (slotSize + slotSpacing);
          const slotY = 940;
          const endX = slotX + slotSize / 2;
          const endY = slotY + slotSize / 2;

          activeAnimations.push({
            type: 'collect_slide',
            itemName: ing.name,
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
        const nextChar = activeDialogueString[dialogueIndex - 1];
        if (nextChar && nextChar !== ' ') {
          playBlipSound(nextChar);
        }
        dialogueText.textContent = activeDialogueString.substring(0, dialogueIndex);
        if (dialogueIndex >= activeDialogueString.length) {
          isTyping = false;
          dialoguePrompt.classList.remove('hidden');
        }
      }
      if (keysPressed.e || keysPressed.space) {
        advanceDialogue();
      }
    } else {
      if (keysPressed.e || keysPressed.space) {
        advanceDialogue();
      }
    }
  }
}

function advanceDialogue() {
  if (currentState !== GameState.DIALOGUE) return;
  if (isTyping) {
    dialogueIndex = activeDialogueString.length;
    dialogueText.textContent = activeDialogueString;
    isTyping = false;
    dialoguePrompt.classList.remove('hidden');
  } else {
    dialogueUI.classList.add('hidden');
    currentState = GameState.GAMEPLAY;

    // State 1 -> State 2 Transition
    if (currentCustomerState === CustomerState.ARRIVAL) {
      const currentCustomer = customerData[activeCustomerNum];
      if (currentCustomer) {
        activeAilmentType = currentCustomer.ailment;
      }
      currentCustomerState = CustomerState.LOOKUP;
      updateObjective();
    }
  }
}

function startDialogue(customText = null) {
  currentState = GameState.DIALOGUE;
  dialogueUI.classList.remove('hidden');
  dialoguePrompt.classList.add('hidden');
  dialogueText.textContent = '';
  dialogueIndex = 0;
  isTyping = true;
  typeTimer = 0;

  if (customText) {
    activeDialogueString = customText;
  } else {
    const currentCustomer = customerData[activeCustomerNum];
    activeDialogueString = currentCustomer ? currentCustomer.dialogue : "Hello!";
  }
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANCIENT CHINESE APOTHECARY PIXEL-ART RENDERING ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. Pale Celadon Ceramic Jar (Longquan style)
function drawCeladonJar(ctx, x, y, width = 48, height = 56, hasCloth = true) {
  const baseScale = width / 12;
  const startX = x - width / 2;
  const startY = y - height;

  // Drop shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y, width * 0.45, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Jar body (rich pale jade celadon)
  ctx.fillStyle = '#1D120B'; // Dark outline
  ctx.fillRect(startX, startY + 12, width, height - 12);
  ctx.fillRect(startX + 4, startY + 4, width - 8, height - 4);

  // Celadon Glaze Base
  ctx.fillStyle = '#6B9E8A';
  ctx.fillRect(startX + 2, startY + 14, width - 4, height - 16);
  ctx.fillRect(startX + 6, startY + 6, width - 12, 10);

  // Glaze Highlight
  ctx.fillStyle = '#9EC7B5';
  ctx.fillRect(startX + 4, startY + 14, 6, height - 18);
  ctx.fillRect(startX + 6, startY + 8, 4, 6);

  // Glaze Shadow
  ctx.fillStyle = '#4A7A68';
  ctx.fillRect(startX + width - 8, startY + 14, 6, height - 16);

  // Parchment Medicine Label Slip on Jar
  ctx.fillStyle = '#F2E8D5';
  ctx.fillRect(startX + width * 0.25, startY + height * 0.35, width * 0.5, height * 0.38);
  ctx.fillStyle = '#8B2626'; // Cinnabar red top border on label
  ctx.fillRect(startX + width * 0.25, startY + height * 0.35, width * 0.5, 3);
  // Micro-pixel calligraphy strokes
  ctx.fillStyle = '#2A1810';
  ctx.fillRect(startX + width * 0.4, startY + height * 0.45, width * 0.2, 2);
  ctx.fillRect(startX + width * 0.35, startY + height * 0.55, width * 0.3, 2);
  ctx.fillRect(startX + width * 0.42, startY + height * 0.62, width * 0.16, 2);

  // Cloth or Cork Cover
  if (hasCloth) {
    // Crimson/Dusty Red Cloth wrapped over mouth
    ctx.fillStyle = '#8B2626';
    ctx.fillRect(startX + 4, startY, width - 8, 8);
    ctx.fillStyle = '#B83838'; // highlight
    ctx.fillRect(startX + 6, startY + 1, width - 12, 3);
    // Gold/Hemp tie string
    ctx.fillStyle = '#C99B3B';
    ctx.fillRect(startX + 2, startY + 6, width - 4, 3);
  } else {
    // Wood/cork plug
    ctx.fillStyle = '#8C6239';
    ctx.fillRect(startX + 8, startY + 2, width - 16, 6);
  }
}

// 2. Blue-and-White Porcelain Ginger Jar (Qinghua Ci)
function drawQinghuaPorcelainJar(ctx, x, y, width = 52, height = 64) {
  const startX = x - width / 2;
  const startY = y - height;

  // Drop shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y, width * 0.45, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark outline
  ctx.fillStyle = '#1D120B';
  ctx.fillRect(startX + 2, startY + 10, width - 4, height - 10);
  ctx.fillRect(startX + 6, startY + 4, width - 12, 8);

  // White porcelain body
  ctx.fillStyle = '#EDF2F4';
  ctx.fillRect(startX + 4, startY + 12, width - 8, height - 14);
  ctx.fillRect(startX + 8, startY + 6, width - 16, 6);

  // Porcelain highlight shine
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(startX + 6, startY + 14, 6, height - 18);

  // Porcelain soft shadow
  ctx.fillStyle = '#C5D3D8';
  ctx.fillRect(startX + width - 10, startY + 14, 6, height - 16);

  // Cobalt Blue (Qinghua) Floral & Cloud Patterns
  ctx.fillStyle = '#224870';
  // Neck ring
  ctx.fillRect(startX + 8, startY + 12, width - 16, 3);
  // Central floral medallions & cloud swirls
  ctx.fillRect(startX + width * 0.35, startY + height * 0.35, width * 0.3, 4);
  ctx.fillRect(startX + width * 0.28, startY + height * 0.42, 6, 8);
  ctx.fillRect(startX + width * 0.62, startY + height * 0.42, 6, 8);
  ctx.fillRect(startX + width * 0.4, startY + height * 0.48, width * 0.2, 6);
  ctx.fillRect(startX + width * 0.3, startY + height * 0.62, width * 0.4, 4);
  // Base band
  ctx.fillRect(startX + 8, startY + height - 6, width - 16, 3);

  // Domed porcelain lid with blue finial knob
  ctx.fillStyle = '#EDF2F4';
  ctx.fillRect(startX + 10, startY, width - 20, 6);
  ctx.fillStyle = '#224870';
  ctx.fillRect(startX + width / 2 - 3, startY - 4, 6, 5);
}

// 3. Calabash / Gourd Medicine Bottle (Hulu 葫芦)
function drawGourdBottle(ctx, x, y, scale = 1.0) {
  const w = 40 * scale;
  const h = 60 * scale;
  const startX = x - w / 2;
  const startY = y - h;

  // Shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.45, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lower bulb
  ctx.fillStyle = '#1D120B';
  ctx.beginPath();
  ctx.arc(x, startY + h * 0.68, w * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#C99442'; // warm golden gourd
  ctx.beginPath();
  ctx.arc(x, startY + h * 0.68, w * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Upper bulb
  ctx.fillStyle = '#1D120B';
  ctx.beginPath();
  ctx.arc(x, startY + h * 0.32, w * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#DEB05C'; // slightly lighter top bulb
  ctx.beginPath();
  ctx.arc(x, startY + h * 0.32, w * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // Gourd highlights
  ctx.fillStyle = '#F4D48E';
  ctx.beginPath();
  ctx.arc(x - w * 0.12, startY + h * 0.3, w * 0.09, 0, Math.PI * 2);
  ctx.arc(x - w * 0.15, startY + h * 0.65, w * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Wooden stopper
  ctx.fillStyle = '#5A3825';
  ctx.fillRect(x - 3 * scale, startY, 6 * scale, 6 * scale);

  // Red Silk Ribbon tied at the waist
  ctx.fillStyle = '#A82424';
  ctx.fillRect(x - w * 0.22, startY + h * 0.46, w * 0.44, 5 * scale);
  // Ribbon tails
  ctx.beginPath();
  ctx.moveTo(x + 2 * scale, startY + h * 0.48);
  ctx.lineTo(x + w * 0.32, startY + h * 0.72);
  ctx.lineTo(x + w * 0.22, startY + h * 0.78);
  ctx.closePath();
  ctx.fill();
}

// 4. Dried Ginseng Roots Bundle
function drawGinsengBundle(ctx, x, y, scale = 1.0) {
  const w = 44 * scale;
  const h = 54 * scale;
  const startX = x - w / 2;
  const startY = y - h;

  // Drop shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.4, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main Root Body 1 (Tan / Aged Herbal Root)
  ctx.strokeStyle = '#1D120B';
  ctx.lineWidth = 4 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 4 * scale, startY + 8 * scale);
  ctx.quadraticCurveTo(x - 8 * scale, startY + 28 * scale, x - 12 * scale, startY + 48 * scale);
  ctx.moveTo(x - 6 * scale, startY + 26 * scale);
  ctx.quadraticCurveTo(x - 2 * scale, startY + 38 * scale, x - 4 * scale, startY + 50 * scale);
  ctx.stroke();

  // Root Body 1 Fill
  ctx.strokeStyle = '#D8BA8C';
  ctx.lineWidth = 2.5 * scale;
  ctx.beginPath();
  ctx.moveTo(x - 4 * scale, startY + 8 * scale);
  ctx.quadraticCurveTo(x - 8 * scale, startY + 28 * scale, x - 12 * scale, startY + 48 * scale);
  ctx.moveTo(x - 6 * scale, startY + 26 * scale);
  ctx.quadraticCurveTo(x - 2 * scale, startY + 38 * scale, x - 4 * scale, startY + 50 * scale);
  ctx.stroke();

  // Main Root Body 2 (Forked Root)
  ctx.strokeStyle = '#1D120B';
  ctx.lineWidth = 4 * scale;
  ctx.beginPath();
  ctx.moveTo(x + 4 * scale, startY + 6 * scale);
  ctx.quadraticCurveTo(x + 10 * scale, startY + 24 * scale, x + 6 * scale, startY + 44 * scale);
  ctx.moveTo(x + 6 * scale, startY + 24 * scale);
  ctx.quadraticCurveTo(x + 14 * scale, startY + 36 * scale, x + 16 * scale, startY + 50 * scale);
  ctx.stroke();

  ctx.strokeStyle = '#BFA06E';
  ctx.lineWidth = 2.5 * scale;
  ctx.beginPath();
  ctx.moveTo(x + 4 * scale, startY + 6 * scale);
  ctx.quadraticCurveTo(x + 10 * scale, startY + 24 * scale, x + 6 * scale, startY + 44 * scale);
  ctx.moveTo(x + 6 * scale, startY + 24 * scale);
  ctx.quadraticCurveTo(x + 14 * scale, startY + 36 * scale, x + 16 * scale, startY + 50 * scale);
  ctx.stroke();

  // Red Twine Tie binding the root crowns
  ctx.fillStyle = '#8B2626';
  ctx.fillRect(x - 8 * scale, startY + 12 * scale, 16 * scale, 5 * scale);
  ctx.fillStyle = '#C99B3B'; // Gold speckle knot
  ctx.fillRect(x - 2 * scale, startY + 13 * scale, 4 * scale, 3 * scale);
}

// 5. Lingzhi Mushroom on Lacquered Wood Dish
function drawLingzhiDish(ctx, x, y, scale = 1.0) {
  const w = 50 * scale;
  const startY = y - 36 * scale;

  // Shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.5, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark Lacquered Wood Dish
  ctx.fillStyle = '#1D120B';
  ctx.fillRect(x - w * 0.45, y - 6 * scale, w * 0.9, 6 * scale);
  ctx.fillStyle = '#4A2818';
  ctx.fillRect(x - w * 0.4, y - 5 * scale, w * 0.8, 3 * scale);
  ctx.fillStyle = '#8A5232';
  ctx.fillRect(x - w * 0.38, y - 5 * scale, w * 0.76, 1.5 * scale);

  // Lingzhi Stalk
  ctx.fillStyle = '#3A140E';
  ctx.fillRect(x - 4 * scale, y - 20 * scale, 8 * scale, 14 * scale);

  // Lingzhi Mushroom Cap (Concentric Kidneys / Shells)
  ctx.fillStyle = '#1D120B';
  ctx.beginPath();
  ctx.ellipse(x, startY, w * 0.42, 14 * scale, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // Deep Mahogany Body
  ctx.fillStyle = '#6E251A';
  ctx.beginPath();
  ctx.ellipse(x, startY, w * 0.38, 12 * scale, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // Growth Rings
  ctx.fillStyle = '#9C3D28';
  ctx.beginPath();
  ctx.ellipse(x - 2 * scale, startY - 2 * scale, w * 0.28, 8 * scale, -0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#C46538';
  ctx.beginPath();
  ctx.ellipse(x - 4 * scale, startY - 3 * scale, w * 0.18, 5 * scale, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // Outer Golden-Amber Spore Rim
  ctx.strokeStyle = '#D9A44E';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.ellipse(x, startY, w * 0.36, 11 * scale, -0.05, 0, Math.PI * 2);
  ctx.stroke();
}

// 6. Folded Herbal Medicine Paper Packet (Yao Bao 药包)
function drawHerbPaperPacket(ctx, x, y, scale = 1.0) {
  const w = 38 * scale;
  const h = 26 * scale;
  const startX = x - w / 2;
  const startY = y - h;

  // Drop shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.45, 3.5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Folded parchment envelope outline
  ctx.fillStyle = '#1D120B';
  ctx.fillRect(startX, startY, w, h);

  // Aged Mulberry Paper
  ctx.fillStyle = '#E8DEC8';
  ctx.fillRect(startX + 2, startY + 2, w - 4, h - 4);
  // Paper texture / fold shade
  ctx.fillStyle = '#D4C6AB';
  ctx.beginPath();
  ctx.moveTo(startX + 2, startY + 2);
  ctx.lineTo(x, startY + h / 2);
  ctx.lineTo(startX + w - 2, startY + 2);
  ctx.closePath();
  ctx.fill();

  // Red Cinnabar Cross Twine Tie
  ctx.fillStyle = '#8B2626';
  ctx.fillRect(startX + 2, startY + h / 2 - 1.5 * scale, w - 4, 3 * scale);
  ctx.fillRect(x - 1.5 * scale, startY + 2, 3 * scale, h - 4);

  // Tiny red official shop seal stamp
  ctx.fillStyle = '#A82828';
  ctx.fillRect(x + 4 * scale, startY + 4 * scale, 8 * scale, 8 * scale);
  ctx.fillStyle = '#F2E8D5';
  ctx.fillRect(x + 6 * scale, startY + 6 * scale, 4 * scale, 4 * scale);
}

// 7. Traditional Chinese Thread-Bound Books (Xian Zhuang Shu 线装书)
function drawThreadBoundBooks(ctx, x, y, w = 36, h = 64, isHorizontal = false, isLeaning = false) {
  ctx.save();
  ctx.translate(x, y);

  if (isHorizontal) {
    // Stack of horizontal thread-bound books
    const bookCount = 3;
    const bHeight = 12;
    const colors = ['#2B405A', '#3F5E4D', '#5A3825']; // indigo, jade, dark timber

    for (let i = 0; i < bookCount; i++) {
      const by = - (i + 1) * bHeight;
      const bw = 54;
      const bx = -bw / 2;

      // Book shadow
      ctx.fillStyle = '#1D120B';
      ctx.fillRect(bx, by, bw, bHeight);

      // Book cover
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(bx + 2, by + 2, bw - 4, bHeight - 4);

      // Paper pages edge (left side)
      ctx.fillStyle = '#F2E8D5';
      ctx.fillRect(bx + 2, by + 3, 6, bHeight - 6);

      // White thread stitching lines (right spine)
      ctx.fillStyle = '#FFFFFF';
      for (let s = 0; s < 4; s++) {
        ctx.fillRect(bx + bw - 14 + s * 3, by + 2, 1.5, bHeight - 4);
      }

      // Title label strip
      ctx.fillStyle = '#F5EBD0';
      ctx.fillRect(bx + 12, by + 3, 20, 3);
    }
  } else {
    if (isLeaning) {
      ctx.rotate(14 * Math.PI / 180);
    }

    const bx = -w / 2;
    const by = -h;

    // Book outline
    ctx.fillStyle = '#1D120B';
    ctx.fillRect(bx, by, w, h);

    // Silk cover (Deep Indigo / Imperial Teal)
    ctx.fillStyle = '#243A52';
    ctx.fillRect(bx + 2, by + 2, w - 4, h - 4);

    // Left spine crease
    ctx.fillStyle = '#1A2A3C';
    ctx.fillRect(bx + 2, by + 2, 5, h - 4);

    // Cream title slip on front cover
    ctx.fillStyle = '#F5EBD0';
    ctx.fillRect(bx + 10, by + 8, 8, h * 0.65);
    // Micro calligraphy title strokes
    ctx.fillStyle = '#2A1810';
    ctx.fillRect(bx + 12, by + 12, 4, 3);
    ctx.fillRect(bx + 12, by + 20, 4, 3);
    ctx.fillRect(bx + 12, by + 28, 4, 3);
    ctx.fillRect(bx + 12, by + 36, 4, 3);

    // Exposed white thread binding stitches along the right edge
    ctx.fillStyle = '#FFFFFF';
    const stitchY = [by + 8, by + 24, by + 40, by + 56];
    stitchY.forEach(sy => {
      ctx.fillRect(bx + w - 6, sy, 4, 2);
    });
  }

  ctx.restore();
}

// 8. Natural Segmented Bamboo Herb Canister
function drawBambooCanister(ctx, x, y, width = 32, height = 58) {
  const startX = x - width / 2;
  const startY = y - height;

  // Drop shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y, width * 0.45, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bamboo tube body outline
  ctx.fillStyle = '#1D120B';
  ctx.fillRect(startX, startY, width, height);

  // Bamboo green/tan gradient base
  ctx.fillStyle = '#8FA654';
  ctx.fillRect(startX + 2, startY + 2, width - 4, height - 4);

  // Bamboo nodes (horizontal rings)
  ctx.fillStyle = '#556B2F';
  ctx.fillRect(startX + 2, startY + height * 0.35, width - 4, 3);
  ctx.fillRect(startX + 2, startY + height * 0.7, width - 4, 3);

  // Bamboo node highlights
  ctx.fillStyle = '#C8DE8A';
  ctx.fillRect(startX + 4, startY + 3, 4, height - 6);
  ctx.fillRect(startX + 2, startY + height * 0.35 - 2, width - 4, 2);
  ctx.fillRect(startX + 2, startY + height * 0.7 - 2, width - 4, 2);

  // Bamboo Fitted Lid
  ctx.fillStyle = '#6E8040';
  ctx.fillRect(startX + 1, startY, width - 2, 7);
  ctx.fillStyle = '#C8DE8A';
  ctx.fillRect(startX + 3, startY + 1, width - 6, 2);
}

// 9. Ceramic Herb Bowl with Saffron / Red Berries and Wooden Scoop
function drawCeramicHerbBowl(ctx, x, y, scale = 1.0, herbColor = '#C84024') {
  const w = 48 * scale;
  const h = 26 * scale;
  const startX = x - w / 2;
  const startY = y - h;

  // Shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.45, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bowl outline
  ctx.fillStyle = '#1D120B';
  ctx.beginPath();
  ctx.arc(x, startY + 8 * scale, w * 0.44, 0, Math.PI);
  ctx.fill();

  // Celadon / Clay Bowl Body
  ctx.fillStyle = '#5A7A6A';
  ctx.beginPath();
  ctx.arc(x, startY + 8 * scale, w * 0.4, 0, Math.PI);
  ctx.fill();

  // Bowl interior opening
  ctx.fillStyle = '#1D120B';
  ctx.beginPath();
  ctx.ellipse(x, startY + 8 * scale, w * 0.42, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Herbal Contents (mounded herbs / berries / saffron)
  ctx.fillStyle = herbColor; // Saffron (#DE8A24) or Goji (#C84024)
  ctx.beginPath();
  ctx.ellipse(x, startY + 6 * scale, w * 0.36, 6 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Herb grain texture specks
  ctx.fillStyle = '#FFE599';
  ctx.fillRect(x - 6 * scale, startY + 4 * scale, 3 * scale, 2 * scale);
  ctx.fillRect(x + 4 * scale, startY + 5 * scale, 3 * scale, 2 * scale);
  ctx.fillRect(x - 1 * scale, startY + 7 * scale, 3 * scale, 2 * scale);

  // Tiny wooden scoop resting diagonally
  ctx.strokeStyle = '#8C6239';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.35, startY + 12 * scale);
  ctx.lineTo(x + w * 0.38, startY);
  ctx.stroke();
}

// 10. Ancient Chinese Apothecary Balance Scale (Yao Cheng 药秤)
function drawSteelyardScale(ctx, x, y, scale = 1.0) {
  const w = 46 * scale;
  const startY = y - 36 * scale;

  // Shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.4, 3 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark Rosewood / Bone Scale Beam
  ctx.strokeStyle = '#2A1810';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.45, startY + 4 * scale);
  ctx.lineTo(x + w * 0.45, startY - 4 * scale);
  ctx.stroke();

  // Beam graduation marks
  ctx.strokeStyle = '#C99B3B';
  ctx.lineWidth = 1 * scale;
  for (let i = -10; i <= 15; i += 5) {
    ctx.beginPath();
    ctx.moveTo(x + i * scale, startY - i * 0.15 * scale - 2 * scale);
    ctx.lineTo(x + i * scale, startY - i * 0.15 * scale + 2 * scale);
    ctx.stroke();
  }

  // Hanging Strings to Pan (left)
  ctx.strokeStyle = '#8C6239';
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.38, startY + 4 * scale);
  ctx.lineTo(x - w * 0.46, y - 6 * scale);
  ctx.moveTo(x - w * 0.38, startY + 4 * scale);
  ctx.lineTo(x - w * 0.3, y - 6 * scale);
  ctx.stroke();

  // Bronze Weighing Pan
  ctx.fillStyle = '#8C6D2B';
  ctx.beginPath();
  ctx.ellipse(x - w * 0.38, y - 6 * scale, 10 * scale, 3 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sliding Brass Counterweight (Tuo 砣) on the right
  ctx.fillStyle = '#DEB34A';
  ctx.fillRect(x + w * 0.28, startY - 2 * scale, 6 * scale, 8 * scale);
}

// 11. Dark Yixing Clay Herb Pot with Tied Cloth Cover
function drawClayHerbPot(ctx, x, y, width = 42, height = 52) {
  const startX = x - width / 2;
  const startY = y - height;

  // Drop shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y, width * 0.45, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.fillStyle = '#1D120B';
  ctx.fillRect(startX, startY + 10, width, height - 10);
  ctx.fillRect(startX + 4, startY + 4, width - 8, 8);

  // Yixing Terracotta / Dark Clay body
  ctx.fillStyle = '#6E3B2B';
  ctx.fillRect(startX + 2, startY + 12, width - 4, height - 14);
  ctx.fillRect(startX + 6, startY + 6, width - 12, 6);

  // Highlight
  ctx.fillStyle = '#9C5844';
  ctx.fillRect(startX + 4, startY + 12, 5, height - 16);

  // Shadow
  ctx.fillStyle = '#4A241A';
  ctx.fillRect(startX + width - 7, startY + 12, 5, height - 14);

  // Cinnabar Red Cloth Lid
  ctx.fillStyle = '#8B2626';
  ctx.fillRect(startX + 2, startY, width - 4, 8);
  ctx.fillStyle = '#C99B3B'; // Gold hemp tie
  ctx.fillRect(startX, startY + 6, width, 3);
}

// 12. Ancient Chinese Abacus (Suanpan 算盘) on Countertop
function drawAbacus(ctx, x, y, width = 72, height = 34) {
  const startX = x - width / 2;
  const startY = y - height;

  // Shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.5)';
  ctx.fillRect(startX + 2, y - 4, width, 6);

  // Rosewood Outer Frame
  ctx.fillStyle = '#2A1810';
  ctx.fillRect(startX, startY, width, height);

  // Frame Wood Body
  ctx.fillStyle = '#4A2E1B';
  ctx.fillRect(startX + 2, startY + 2, width - 4, height - 4);

  // Brass Corner Reinforcement Brackets
  ctx.fillStyle = '#DEB34A';
  ctx.fillRect(startX, startY, 6, 6);
  ctx.fillRect(startX + width - 6, startY, 6, 6);
  ctx.fillRect(startX, startY + height - 6, 6, 6);
  ctx.fillRect(startX + width - 6, startY + height - 6, 6, 6);

  // Inner Deck Area
  ctx.fillStyle = '#1D120B';
  ctx.fillRect(startX + 5, startY + 5, width - 10, height - 10);

  // Dividing Horizontal Beam (Liang 梁)
  const beamY = startY + 13;
  ctx.fillStyle = '#5A3825';
  ctx.fillRect(startX + 5, beamY, width - 10, 4);

  // Vertical Wire Rods & Bi-colored Wooden Beads (Suanzhu 算珠)
  const rods = 9;
  const rodSpacing = (width - 16) / (rods - 1);

  for (let r = 0; r < rods; r++) {
    const rx = startX + 8 + r * rodSpacing;

    // Metal rod
    ctx.fillStyle = '#8C7A6B';
    ctx.fillRect(rx, startY + 5, 1.5, height - 10);

    // Upper Deck: 2 beads per rod
    ctx.fillStyle = '#DEB34A';
    ctx.fillRect(rx - 2, startY + 6, 5, 3);
    ctx.fillRect(rx - 2, startY + 9.5, 5, 3);

    // Lower Deck: 5 beads per rod
    ctx.fillStyle = '#C99442';
    ctx.fillRect(rx - 2, beamY + 5, 5, 2.5);
    ctx.fillRect(rx - 2, beamY + 8, 5, 2.5);
    ctx.fillRect(rx - 2, beamY + 11, 5, 2.5);
  }
}

// 13. Mountain-Shaped Brush Rest & Calligraphy Brushes
function drawBrushRestAndInk(ctx, x, y, width = 64, height = 36) {
  const startX = x - width / 2;
  const startY = y - height;

  // Shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y, width * 0.45, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mountain Brush Rest (Bishan 笔山) in Carved Celadon Jade
  ctx.fillStyle = '#1D120B';
  ctx.beginPath();
  ctx.moveTo(startX + 10, y);
  ctx.lineTo(startX + 16, startY + 16);
  ctx.lineTo(startX + 24, startY + 22);
  ctx.lineTo(startX + 32, startY + 10); // Central highest peak
  ctx.lineTo(startX + 40, startY + 22);
  ctx.lineTo(startX + 48, startY + 16);
  ctx.lineTo(startX + 54, y);
  ctx.closePath();
  ctx.fill();

  // Celadon Jade Fill
  ctx.fillStyle = '#6B9E8A';
  ctx.beginPath();
  ctx.moveTo(startX + 12, y - 1);
  ctx.lineTo(startX + 17, startY + 18);
  ctx.lineTo(startX + 24, startY + 23);
  ctx.lineTo(startX + 32, startY + 12);
  ctx.lineTo(startX + 40, startY + 23);
  ctx.lineTo(startX + 47, startY + 18);
  ctx.lineTo(startX + 52, y - 1);
  ctx.closePath();
  ctx.fill();

  // Peak Highlights
  ctx.fillStyle = '#9EC7B5';
  ctx.fillRect(startX + 30, startY + 13, 4, 5);
  ctx.fillRect(startX + 16, startY + 19, 3, 4);
  ctx.fillRect(startX + 46, startY + 19, 3, 4);

  // Bamboo Calligraphy Brushes resting horizontally across peaks
  // Brush 1 (Large Wolf-hair / Sable Brush)
  ctx.strokeStyle = '#8FA654'; // bamboo shaft
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(startX, startY + 16);
  ctx.lineTo(startX + width, startY + 16);
  ctx.stroke();

  // Brush Tip (black ink soaked hair)
  ctx.fillStyle = '#1A1412';
  ctx.beginPath();
  ctx.moveTo(startX + width - 2, startY + 16);
  ctx.lineTo(startX + width + 10, startY + 16);
  ctx.lineTo(startX + width + 4, startY + 19);
  ctx.closePath();
  ctx.fill();
}

// 14. Potted Miniature Chinese Bonsai / Plum Blossom in Hexagonal Celadon Pot
function drawChineseBonsai(ctx, x, y, width = 110, height = 120) {
  const startX = x - width / 2;
  const startY = y - height;

  // Drop shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y, width * 0.45, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hexagonal Celadon Planter (Base Y: y - 36 to y)
  const potY = y - 34;
  ctx.fillStyle = '#1D120B';
  ctx.fillRect(startX + width * 0.15, potY, width * 0.7, 34);

  ctx.fillStyle = '#6B9E8A'; // Celadon glaze body
  ctx.fillRect(startX + width * 0.17, potY + 2, width * 0.66, 30);

  // Planter Rim
  ctx.fillStyle = '#9EC7B5';
  ctx.fillRect(startX + width * 0.12, potY, width * 0.76, 6);
  ctx.fillStyle = '#4A7A68'; // Planter shadow panel
  ctx.fillRect(startX + width * 0.55, potY + 6, width * 0.26, 24);

  // Dark Soil
  ctx.fillStyle = '#3A2416';
  ctx.fillRect(startX + width * 0.18, potY + 3, width * 0.64, 4);

  // Gnarled Bonsai Trunk & Branches
  ctx.strokeStyle = '#1D120B';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, potY + 2);
  ctx.quadraticCurveTo(x - 16, startY + height * 0.5, x - 6, startY + height * 0.35);
  ctx.quadraticCurveTo(x + 14, startY + height * 0.25, x + 24, startY + height * 0.15);
  ctx.moveTo(x - 6, startY + height * 0.35);
  ctx.quadraticCurveTo(x - 24, startY + height * 0.28, x - 32, startY + height * 0.2);
  ctx.stroke();

  // Bark Fill (Dark Aged Timber)
  ctx.strokeStyle = '#5A3825';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, potY + 2);
  ctx.quadraticCurveTo(x - 16, startY + height * 0.5, x - 6, startY + height * 0.35);
  ctx.quadraticCurveTo(x + 14, startY + height * 0.25, x + 24, startY + height * 0.15);
  ctx.moveTo(x - 6, startY + height * 0.35);
  ctx.quadraticCurveTo(x - 24, startY + height * 0.28, x - 32, startY + height * 0.2);
  ctx.stroke();

  // Jade Pine Clusters & Plum Blossom Petals
  const foliageCenters = [
    { cx: x - 32, cy: startY + height * 0.18, r: 18 },
    { cx: x - 6, cy: startY + height * 0.22, r: 16 },
    { cx: x + 24, cy: startY + height * 0.14, r: 20 },
    { cx: x + 8, cy: startY + height * 0.08, r: 14 }
  ];

  foliageCenters.forEach(fc => {
    // Dark outline cluster
    ctx.fillStyle = '#1D120B';
    ctx.beginPath();
    ctx.arc(fc.cx, fc.cy, fc.r, 0, Math.PI * 2);
    ctx.fill();

    // Lush Jade Green Pine Foliage
    ctx.fillStyle = '#3F6B52';
    ctx.beginPath();
    ctx.arc(fc.cx, fc.cy, fc.r - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6BA382';
    ctx.beginPath();
    ctx.arc(fc.cx - 3, fc.cy - 3, fc.r * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Plum Blossom Petals (Crimson & Coral)
    ctx.fillStyle = '#C43838';
    ctx.beginPath();
    ctx.arc(fc.cx - 5, fc.cy + 4, 3.5, 0, Math.PI * 2);
    ctx.arc(fc.cx + 6, fc.cy - 4, 3.5, 0, Math.PI * 2);
    ctx.arc(fc.cx + 2, fc.cy + 6, 3, 0, Math.PI * 2);
    ctx.fill();

    // Blossom Center Gold Stamen
    ctx.fillStyle = '#FFE599';
    ctx.fillRect(fc.cx - 5.5, fc.cy + 3.5, 1.5, 1.5);
    ctx.fillRect(fc.cx + 5.5, fc.cy - 4.5, 1.5, 1.5);
  });
}

// 15. Hanging Dried Herb Braid (Ginseng, Licorice, Safflower, Garlic/Ginger)
function drawHangingHerbalBraid(ctx, x, y, length = 180, type = 'ginseng') {
  // Dark Wooden Peg on Wall
  ctx.fillStyle = '#1D120B';
  ctx.fillRect(x - 4, y - 4, 8, 8);
  ctx.fillStyle = '#5A3825';
  ctx.fillRect(x - 3, y - 3, 6, 6);

  // Hemp Suspension String
  ctx.strokeStyle = '#8C6239';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 20);
  ctx.stroke();

  // Tiered Hanging Herbal Bundles
  const segments = Math.floor((length - 20) / 28);

  for (let s = 0; s < segments; s++) {
    const sy = y + 20 + s * 28;

    if (type === 'ginseng') {
      // Hanging Ginseng Roots
      ctx.fillStyle = '#1D120B';
      ctx.beginPath();
      ctx.ellipse(x, sy + 10, 8, 14, 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#D8BA8C';
      ctx.beginPath();
      ctx.ellipse(x, sy + 10, 6, 12, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Rootlet strands
      ctx.strokeStyle = '#BFA06E';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 3, sy + 18);
      ctx.lineTo(x - 6, sy + 28);
      ctx.moveTo(x + 2, sy + 18);
      ctx.lineTo(x + 5, sy + 30);
      ctx.stroke();

      // Red twine binding each tier
      ctx.fillStyle = '#8B2626';
      ctx.fillRect(x - 5, sy, 10, 3);
    } else if (type === 'safflower') {
      // Bundled dried flowers & medicinal leaves
      ctx.fillStyle = '#1D120B';
      ctx.beginPath();
      ctx.ellipse(x, sy + 10, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#C45228'; // dusty burnt orange/saffron
      ctx.beginPath();
      ctx.ellipse(x, sy + 10, 8, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#8B2626';
      ctx.fillRect(x - 6, sy, 12, 3);
    } else {
      // Dried Ginger / Orange Peel Braids
      ctx.fillStyle = '#1D120B';
      ctx.beginPath();
      ctx.ellipse(x + (s % 2 === 0 ? -4 : 4), sy + 8, 10, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#C89442';
      ctx.beginPath();
      ctx.ellipse(x + (s % 2 === 0 ? -4 : 4), sy + 8, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// 16. Hundred-Drawer Apothecary Cabinet (Baizigui 百子柜)
function drawBaiziguiCabinet(ctx, x1, x2) {
  const floorY = CANVAS_HEIGHT * 0.6; // Y = 648
  const cabinetWidth = x2 - x1;

  // Outer Cabinet Frame (Rich Dark Aged Rosewood)
  ctx.fillStyle = '#2E1B12';
  ctx.fillRect(x1, 0, cabinetWidth, floorY);

  // Frame Bevels & Depth Shading
  ctx.strokeStyle = '#180D08';
  ctx.lineWidth = 6;
  ctx.strokeRect(x1, 0, cabinetWidth, floorY);

  // Vertical Support Columns (Left & Right Pillars)
  ctx.fillStyle = '#44281B';
  ctx.fillRect(x1, 0, 24, floorY);
  ctx.fillRect(x2 - 24, 0, 24, floorY);

  ctx.fillStyle = '#5E3927';
  ctx.fillRect(x1 + 4, 0, 8, floorY);
  ctx.fillRect(x2 - 20, 0, 8, floorY);

  // Ornate Top Header Frieze with Chinese Cloud & Brass Corner Inlays
  ctx.fillStyle = '#3A2015';
  ctx.fillRect(x1, 0, cabinetWidth, 32);
  ctx.fillStyle = '#C99B3B'; // Imperial Gold Corner Brackets
  ctx.fillRect(x1, 0, 16, 16);
  ctx.fillRect(x2 - 16, 0, 16, 16);
  ctx.fillStyle = '#DEB34A';
  ctx.fillRect(x1 + 4, 4, 8, 8);
  ctx.fillRect(x2 - 12, 4, 8, 8);

  // Horizontal Display Shelves (Y = 160, Y = 280, Y = 400)
  const shelfHeights = [160, 280, 400];
  shelfHeights.forEach(sy => {
    // Shelf Base
    ctx.fillStyle = '#3A2015';
    ctx.fillRect(x1, sy, cabinetWidth, 22);

    ctx.strokeStyle = '#180D08';
    ctx.lineWidth = 3;
    ctx.strokeRect(x1, sy, cabinetWidth, 22);

    // Warm Aged Rosewood Highlight
    ctx.fillStyle = '#87553A';
    ctx.fillRect(x1, sy + 2, cabinetWidth, 4);

    // Shadow crevice under shelf
    ctx.fillStyle = '#180D08';
    ctx.fillRect(x1 + 24, sy + 22, cabinetWidth - 48, 6);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HUNDRED-DRAWER MEDICINE DRAWERS GRID (Y = 422 to 648)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const drawerStartY = 426;
  const drawerEndY = floorY - 6;
  const gridRows = 4;
  const gridCols = 8;
  const gridW = cabinetWidth - 48;
  const gridH = drawerEndY - drawerStartY;
  const cellW = gridW / gridCols;
  const cellH = gridH / gridRows;

  // Drawers Backing
  ctx.fillStyle = '#22130C';
  ctx.fillRect(x1 + 24, drawerStartY, gridW, gridH);

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const dx = x1 + 24 + c * cellW + 2;
      const dy = drawerStartY + r * cellH + 2;
      const dw = cellW - 4;
      const dh = cellH - 4;

      // Drawer wood body
      ctx.fillStyle = '#44281B';
      ctx.fillRect(dx, dy, dw, dh);

      // Drawer beveled frame highlight & shadow
      ctx.fillStyle = '#6E422D';
      ctx.fillRect(dx, dy, dw, 2);
      ctx.fillRect(dx, dy, 2, dh);
      ctx.fillStyle = '#1D1009';
      ctx.fillRect(dx, dy + dh - 2, dw, 2);
      ctx.fillRect(dx + dw - 2, dy, 2, dh);

      // Aged Paper Medicine Label Slip (Yao Qian 药签) on Upper Drawer Face
      const labelW = dw * 0.44;
      const labelH = dh * 0.48;
      const lx = dx + (dw - labelW) / 2;
      const ly = dy + 4;

      ctx.fillStyle = '#F2E8D5'; // Parchment
      ctx.fillRect(lx, ly, labelW, labelH);
      ctx.fillStyle = '#8B2626'; // Cinnabar red top strip
      ctx.fillRect(lx, ly, labelW, 2.5);

      // Micro-pixel calligraphy strokes
      ctx.fillStyle = '#2A1810';
      ctx.fillRect(lx + 2, ly + 4, labelW - 4, 1.5);
      ctx.fillRect(lx + 3, ly + 7, labelW - 6, 1.5);
      ctx.fillRect(lx + 2, ly + 10, labelW - 4, 1.5);

      // Antique Brass Drop Handle / Ring Pull (Lower Drawer Face)
      const hx = dx + dw / 2;
      const hy = dy + dh - 10;
      ctx.fillStyle = '#DEB34A';
      ctx.fillRect(hx - 3, hy - 3, 6, 3); // Base plate
      ctx.strokeStyle = '#DEB34A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy + 2, 4, 0, Math.PI);
      ctx.stroke();
    }
  }
}

// 17. Traditional Chinese Lattice Moon-Gate Window & Imperial Courtyard
function drawChineseLatticeWindow(ctx) {
  const winX = 800;
  const winY = 60;
  const winW = 320;
  const winH = 460;
  const sillY = 496;

  ctx.save();

  // 1. Clip to Arched Moon Window Shape
  ctx.beginPath();
  ctx.moveTo(winX, sillY);
  ctx.lineTo(winX, 220);
  ctx.arc(winX + winW / 2, 220, winW / 2, Math.PI, 0, false);
  ctx.lineTo(winX + winW, sillY);
  ctx.closePath();
  ctx.clip();

  // 2. Courtyard Sky & Atmospheric Light Gradient
  const skyGrad = ctx.createLinearGradient(960, winY, 960, sillY);
  skyGrad.addColorStop(0, '#E8C5A8'); // Soft warm peach morning sky
  skyGrad.addColorStop(0.45, '#F5E3CE'); // Misty golden light
  skyGrad.addColorStop(0.8, '#D8E8D5');  // Jade garden ambient
  skyGrad.addColorStop(1.0, '#BFD4BD');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(winX, winY, winW, winH);

  // 3. Distant Ancient Chinese Palace Tiled Roof with Upturned Flying Eaves (Feiyan 飞檐)
  ctx.fillStyle = '#3D5452'; // Distant dark teal/slate glazed tiles
  ctx.beginPath();
  // Main curved roof ridge
  ctx.moveTo(winX + 20, 360);
  ctx.quadraticCurveTo(winX + 80, 310, winX + 160, 305);
  ctx.quadraticCurveTo(winX + 240, 310, winX + 300, 360);
  // Upturned flying eaves tip
  ctx.lineTo(winX + 315, 345);
  ctx.quadraticCurveTo(winX + 240, 290, winX + 160, 285);
  ctx.quadraticCurveTo(winX + 80, 290, winX + 5, 345);
  ctx.closePath();
  ctx.fill();

  // Imperial Roof Tile Ridges
  ctx.strokeStyle = '#567572';
  ctx.lineWidth = 2;
  for (let rx = winX + 40; rx < winX + 280; rx += 18) {
    ctx.beginPath();
    ctx.moveTo(rx, 350);
    ctx.lineTo(rx - 8, 300);
    ctx.stroke();
  }

  // 4. Layered Bamboo Groves in the Imperial Courtyard
  const bambooStalks = [
    { x: winX + 45, h: 420, w: 7, color: '#5B7A3E' },
    { x: winX + 75, h: 450, w: 8, color: '#4E6B34' },
    { x: winX + 115, h: 390, w: 6, color: '#6A8E49' },
    { x: winX + 210, h: 430, w: 7, color: '#5B7A3E' },
    { x: winX + 255, h: 460, w: 9, color: '#4E6B34' },
    { x: winX + 285, h: 400, w: 6, color: '#6A8E49' }
  ];

  bambooStalks.forEach(b => {
    // Bamboo stalk
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, sillY - b.h, b.w, b.h);

    // Bamboo node rings
    ctx.fillStyle = '#364B22';
    for (let ny = sillY - 30; ny > sillY - b.h; ny -= 45) {
      ctx.fillRect(b.x - 1, ny, b.w + 2, 3);
    }

    // Bamboo leaves (pointed jade green clusters)
    ctx.fillStyle = '#557A3C';
    for (let ly = sillY - 60; ly > sillY - b.h; ly -= 40) {
      const dir = ly % 80 === 0 ? 1 : -1;
      // Leaf 1
      ctx.beginPath();
      ctx.moveTo(b.x + b.w / 2, ly);
      ctx.quadraticCurveTo(b.x + dir * 25, ly - 8, b.x + dir * 35, ly + 6);
      ctx.quadraticCurveTo(b.x + dir * 18, ly + 4, b.x + b.w / 2, ly);
      ctx.fill();

      // Leaf 2
      ctx.beginPath();
      ctx.moveTo(b.x + b.w / 2, ly + 8);
      ctx.quadraticCurveTo(b.x + dir * 30, ly + 2, b.x + dir * 42, ly + 18);
      ctx.quadraticCurveTo(b.x + dir * 20, ly + 14, b.x + b.w / 2, ly + 8);
      ctx.fill();
    }
  });

  // 5. Traditional Chinese Geometric Lattice Fretwork (Wan-fret & Ice-ray)
  ctx.strokeStyle = '#2A1810';
  ctx.lineWidth = 5;

  // Major vertical & horizontal lattice dividers
  ctx.beginPath();
  ctx.moveTo(winX + winW / 2, winY);
  ctx.lineTo(winX + winW / 2, sillY);
  ctx.moveTo(winX, 220);
  ctx.lineTo(winX + winW, 220);
  ctx.moveTo(winX, 360);
  ctx.lineTo(winX + winW, 360);
  ctx.stroke();

  // Geometric Lattice Quadrants (Ice-ray diagonal frets)
  ctx.strokeStyle = '#44281B';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  // Upper arch diagonals
  ctx.moveTo(winX + 40, 220);
  ctx.lineTo(winX + winW / 2, 120);
  ctx.lineTo(winX + winW - 40, 220);
  // Mid fretwork
  ctx.moveTo(winX, 290);
  ctx.lineTo(winX + 70, 220);
  ctx.lineTo(winX + 140, 290);
  ctx.lineTo(winX + 70, 360);
  ctx.lineTo(winX, 290);

  ctx.moveTo(winX + winW, 290);
  ctx.lineTo(winX + winW - 70, 220);
  ctx.lineTo(winX + winW - 140, 290);
  ctx.lineTo(winX + winW - 70, 360);
  ctx.lineTo(winX + winW, 290);
  ctx.stroke();

  ctx.restore();

  // 6. Heavy Dark Aged Timber Window Frame Outline & Highlights
  ctx.strokeStyle = '#1D120B';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(winX, sillY);
  ctx.lineTo(winX, 220);
  ctx.arc(winX + winW / 2, 220, winW / 2, Math.PI, 0, false);
  ctx.lineTo(winX + winW, sillY);
  ctx.stroke();

  ctx.strokeStyle = '#5E3927';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(winX + 4, sillY);
  ctx.lineTo(winX + 4, 220);
  ctx.arc(winX + winW / 2, 220, winW / 2 - 4, Math.PI, 0, false);
  ctx.lineTo(winX + winW - 4, sillY);
  ctx.stroke();

  // 7. Polished Dark Aged Timber Windowsill (Y = 496, height = 24)
  ctx.fillStyle = '#3A2015';
  ctx.fillRect(winX - 20, sillY, winW + 40, 24);
  ctx.strokeStyle = '#1D120B';
  ctx.lineWidth = 4;
  ctx.strokeRect(winX - 20, sillY, winW + 40, 24);
  ctx.fillStyle = '#87553A'; // Windowsill top highlight
  ctx.fillRect(winX - 20, sillY + 2, winW + 40, 4);

  // 8. Windowsill Props (Celadon Pot + Porcelain Plum Blossom Vase + Bamboo Roll)
  drawCeladonJar(ctx, winX + 40, sillY, 44, 52, true);
  drawQinghuaPorcelainJar(ctx, winX + 130, sillY, 46, 56);
  drawBambooCanister(ctx, winX + 270, sillY, 34, 58);
}

// 18. Imperial Blue-and-White Porcelain Jardinière (Corner Planters)
function drawImperialCornerPlanter(ctx, x, y, width = 352, height = 352) {
  const potW = 160;
  const potH = 90;
  const potX = x + (width - potW) / 2;
  const potY = y + height - potH - 12;

  // Carved Dark Rosewood Pedestal Stand
  ctx.fillStyle = '#1D120B';
  ctx.fillRect(potX - 10, y + height - 16, potW + 20, 16);
  ctx.fillStyle = '#44281B';
  ctx.fillRect(potX - 6, y + height - 14, potW + 12, 10);
  ctx.fillStyle = '#C99B3B'; // Gold pedestal feet
  ctx.fillRect(potX - 8, y + height - 8, 12, 8);
  ctx.fillRect(potX + potW - 4, y + height - 8, 12, 8);

  // Porcelain Jardinière Body (Blue and White Qinghua)
  ctx.fillStyle = '#1D120B';
  ctx.fillRect(potX, potY, potW, potH);

  ctx.fillStyle = '#EDF2F4'; // White porcelain
  ctx.fillRect(potX + 4, potY + 4, potW - 8, potH - 8);

  // Blue Cobalt Imperial Dragon / Floral Motifs
  ctx.fillStyle = '#224870';
  ctx.fillRect(potX + 4, potY + 4, potW - 8, 8); // Rim border
  ctx.fillRect(potX + 20, potY + 24, potW - 40, 10);
  ctx.fillRect(potX + 35, potY + 42, potW - 70, 16);
  ctx.fillRect(potX + 4, potY + potH - 12, potW - 8, 6);

  // Porcelain highlights & shading
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(potX + 8, potY + 12, 12, potH - 24);
  ctx.fillStyle = '#CAD5D8';
  ctx.fillRect(potX + potW - 20, potY + 12, 12, potH - 24);

  // Lush Sacred Bamboo (Nandina) & Medicinal Red Berries
  const stems = [
    { bx: potX + 40, tx: x + 60, h: 280 },
    { bx: potX + 70, tx: x + 150, h: 320 },
    { bx: potX + 90, tx: x + 200, h: 340 },
    { bx: potX + 120, tx: x + 290, h: 290 }
  ];

  stems.forEach(st => {
    // Bamboo Stem
    ctx.strokeStyle = '#1D120B';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(st.bx, potY + 4);
    ctx.quadraticCurveTo(st.bx + (st.tx - st.bx) * 0.5, potY - st.h * 0.5, st.tx, potY - st.h + 50);
    ctx.stroke();

    ctx.strokeStyle = '#6E8A42';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(st.bx, potY + 4);
    ctx.quadraticCurveTo(st.bx + (st.tx - st.bx) * 0.5, potY - st.h * 0.5, st.tx, potY - st.h + 50);
    ctx.stroke();

    // Delicate Feathered Leaf Sprays
    for (let ly = potY - 40; ly > potY - st.h + 60; ly -= 35) {
      ctx.fillStyle = '#4D754B';
      ctx.beginPath();
      ctx.ellipse(st.tx + (ly % 20 === 0 ? 25 : -25), ly, 22, 7, (ly % 20 === 0 ? 0.35 : -0.35), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#78A86B';
      ctx.beginPath();
      ctx.ellipse(st.tx + (ly % 20 === 0 ? 22 : -22), ly - 2, 16, 4.5, (ly % 20 === 0 ? 0.35 : -0.35), 0, Math.PI * 2);
      ctx.fill();

      // Clusters of Sacred Bamboo Red Berries
      ctx.fillStyle = '#C42828';
      ctx.beginPath();
      ctx.arc(st.tx + (ly % 20 === 0 ? 12 : -12), ly + 8, 4, 0, Math.PI * 2);
      ctx.arc(st.tx + (ly % 20 === 0 ? 18 : -18), ly + 13, 3.5, 0, Math.PI * 2);
      ctx.arc(st.tx + (ly % 20 === 0 ? 8 : -8), ly + 14, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFA8A8'; // Berry shine
      ctx.fillRect(st.tx + (ly % 20 === 0 ? 11 : -13), ly + 7, 1.5, 1.5);
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHARED APOTHECARY FLOOR RENDERER (ROOM 1 & ROOM 2 MATCHED)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function drawApothecaryFloor(ctx, startY, endY) {
  const rowHeight = 86;
  const numRows = Math.ceil((endY - startY) / rowHeight);
  const plankRows = [];

  for (let r = 0; r < numRows; r++) {
    const y = startY + r * rowHeight;
    const joints = r % 2 === 0 ? [500, 1300] : [350, 1050, 1600];
    plankRows.push({ y, joints });
  }

  plankRows.forEach((row, rowIndex) => {
    const nextY = rowIndex === plankRows.length - 1 ? endY : row.y + rowHeight;
    const currentHeight = nextY - row.y;
    if (currentHeight <= 0) return;

    const joints = [0, ...row.joints, CANVAS_WIDTH];

    for (let i = 0; i < joints.length - 1; i++) {
      const startX = joints[i];
      const endX = joints[i + 1];
      const width = endX - startX;

      const seed = Math.sin(startX * 0.03 + row.y * 0.07) * 10000;
      const rand = seed - Math.floor(seed);

      // Historical aged wood palette: Dark Walnut, Rosewood, Polished Elm, Teak
      let plankColor = '#44281B';
      if (rand < 0.15) plankColor = '#321D13'; // Very dark aged timber
      else if (rand < 0.35) plankColor = '#503222'; // Warm rosewood
      else if (rand < 0.60) plankColor = '#5C3927'; // Polished honey teak
      else plankColor = '#44281B'; // Rich dark walnut

      ctx.fillStyle = plankColor;
      ctx.fillRect(startX, row.y, width, currentHeight);

      // Wood Grain Lines
      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#22130C';
      [0.25, 0.5, 0.75].forEach((offset, gIdx) => {
        const grainY = row.y + currentHeight * offset;
        const startOffset = ((rand * (gIdx + 1) * 7.7) % 1) * (width * 0.4);
        const grainWidth = (0.4 + ((rand * (gIdx + 1) * 3.3) % 0.5)) * width;
        ctx.beginPath();
        ctx.moveTo(startX + startOffset, grainY);
        ctx.lineTo(startX + startOffset + grainWidth, grainY);
        ctx.stroke();
      });
      ctx.restore();

      // Top Highlight & Bottom Crevice
      ctx.fillStyle = 'rgba(242, 232, 213, 0.12)';
      ctx.fillRect(startX, row.y, width, 2.5);
      ctx.fillStyle = '#180D08';
      ctx.fillRect(startX, row.y + currentHeight - 3, width, 3);
      ctx.fillRect(endX - 3, row.y, 3, currentHeight);
    }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN SHOP & LABORATORY CARPET / RUG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function drawTraditionalRug(ctx, x, y, width, height) {
  // Shadow under rug
  ctx.fillStyle = 'rgba(18, 10, 6, 0.45)';
  ctx.fillRect(x - 4, y - 4, width + 8, height + 8);

  // Outer dark wood/charcoal border
  ctx.fillStyle = '#2A1810';
  ctx.fillRect(x, y, width, height);

  // Muted Dark Cinnabar Red Body
  ctx.fillStyle = '#6E241A';
  ctx.fillRect(x + 6, y + 6, width - 12, height - 12);

  // Faded Gold Geometric Key Fret (Leiwen) Border
  ctx.strokeStyle = '#C99B3B';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 14, y + 14, width - 28, height - 28);

  // Inner Cream Border
  ctx.strokeStyle = '#E5DEC9';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 22, y + 22, width - 44, height - 44);

  // Corner Gold Accents
  ctx.fillStyle = '#C99B3B';
  ctx.fillRect(x + 12, y + 12, 6, 6);
  ctx.fillRect(x + width - 18, y + 12, 6, 6);
  ctx.fillRect(x + 12, y + height - 18, 6, 6);
  ctx.fillRect(x + width - 18, y + height - 18, 6, 6);

  // Subtle Center Medallion in Muted Jade / Gold
  const cx = x + width / 2;
  const cy = y + height / 2;
  ctx.fillStyle = '#3F5E4D';
  ctx.beginPath();
  ctx.ellipse(cx, cy, width * 0.14, height * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#C99B3B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, width * 0.14, height * 0.22, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#E5DEC9';
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  // Subtle linen edge fringes (Left and Right)
  ctx.fillStyle = '#C4B89F';
  for (let fy = y + 4; fy < y + height - 4; fy += 6) {
    ctx.fillRect(x - 5, fy, 5, 2);
    ctx.fillRect(x + width, fy, 5, 2);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SMALL TRADITIONAL MEDICINAL HERB POT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function drawSmallHerbPot(ctx, x, y, size = 48) {
  const potW = size * 0.85;
  const potH = size * 0.55;
  const startX = x - potW / 2;
  const startY = y - potH;

  // Shadow
  ctx.fillStyle = 'rgba(29, 18, 11, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y, potW * 0.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Celadon / Terracotta Ceramic Pot
  ctx.fillStyle = '#1D120B';
  ctx.fillRect(startX, startY, potW, potH);

  ctx.fillStyle = '#6B9E8A'; // Celadon glaze
  ctx.fillRect(startX + 2, startY + 2, potW - 4, potH - 4);
  ctx.fillStyle = '#9EC7B5'; // Rim highlight
  ctx.fillRect(startX + 1, startY, potW - 2, 4);

  // Dark Soil
  ctx.fillStyle = '#3A2416';
  ctx.fillRect(startX + 3, startY + 2, potW - 6, 3);

  // Tiny delicate medicinal herb sprig with jade leaves and berries
  ctx.strokeStyle = '#4D754B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, startY + 2);
  ctx.lineTo(x - 6, startY - 14);
  ctx.moveTo(x, startY + 2);
  ctx.lineTo(x + 8, startY - 18);
  ctx.stroke();

  // Leaves
  ctx.fillStyle = '#6BA382';
  ctx.beginPath();
  ctx.ellipse(x - 10, startY - 14, 6, 3, -0.4, 0, Math.PI * 2);
  ctx.ellipse(x + 12, startY - 18, 7, 3.5, 0.4, 0, Math.PI * 2);
  ctx.ellipse(x - 2, startY - 22, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tiny red medicinal berries
  ctx.fillStyle = '#C42828';
  ctx.beginPath();
  ctx.arc(x - 6, startY - 10, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 6, startY - 14, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUBTLE HANGING DRIED MEDICINAL HERBS (SPARSE ON WALLS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function drawSubtleHangingHerb(ctx, x, y, type = 'roots') {
  // Small Dark Wooden Peg
  ctx.fillStyle = '#1D120B';
  ctx.fillRect(x - 3, y - 3, 6, 6);
  ctx.fillStyle = '#5A3825';
  ctx.fillRect(x - 2, y - 2, 4, 4);

  // Thin Hemp String
  ctx.strokeStyle = '#8C6239';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 12);
  ctx.stroke();

  if (type === 'roots') {
    // Small Bundle of Dried Thin Roots / Ginseng (height ~ 45px)
    ctx.strokeStyle = '#1D120B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x - 4, y + 36);
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + 3, y + 42);
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + 6, y + 32);
    ctx.stroke();

    ctx.strokeStyle = '#D8BA8C'; // Dried root beige
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x - 4, y + 36);
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + 3, y + 42);
    ctx.moveTo(x, y + 12);
    ctx.lineTo(x + 6, y + 32);
    ctx.stroke();

    // Red cord tie
    ctx.fillStyle = '#8B2626';
    ctx.fillRect(x - 3, y + 14, 6, 2.5);
  } else if (type === 'flowers') {
    // Small Bundle of Dried Safflower / Chrysanthemum (height ~ 40px)
    ctx.fillStyle = '#1D120B';
    ctx.beginPath();
    ctx.ellipse(x, y + 24, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#C45228'; // Burnt orange/saffron
    ctx.beginPath();
    ctx.ellipse(x, y + 24, 5.5, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8B2626'; // Red tie
    ctx.fillRect(x - 4, y + 14, 8, 2.5);
  } else {
    // Small Bundle of Dried Medicinal Leaves / Stems (height ~ 42px)
    ctx.fillStyle = '#1D120B';
    ctx.beginPath();
    ctx.ellipse(x, y + 22, 6, 9, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5B7A4E'; // Muted olive green
    ctx.beginPath();
    ctx.ellipse(x, y + 22, 4.5, 7.5, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8B2626';
    ctx.fillRect(x - 3, y + 14, 6, 2.5);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BOTANICAL MEDICINE CHART SCROLL (LABORATORY WALL)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function drawBotanicalMedicineChart(ctx, x, y, width = 56, height = 76) {
  // Shadow
  ctx.fillStyle = 'rgba(20, 11, 7, 0.35)';
  ctx.fillRect(x + 2, y + 2, width, height);

  // Aged Mulberry Paper Scroll Body
  ctx.fillStyle = '#E8DEC8';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#9A8E72';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Dark Wood Scroll Rollers (Top and Bottom)
  ctx.fillStyle = '#3A2015';
  ctx.fillRect(x - 3, y - 2, width + 6, 4);
  ctx.fillRect(x - 3, y + height - 2, width + 6, 4);

  // Top Hanging Cord
  ctx.strokeStyle = '#8B2626';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 4, y);
  ctx.lineTo(x + width / 2, y - 8);
  ctx.lineTo(x + width - 4, y);
  ctx.stroke();

  // Botanical Herbal Brush Sketch (Center)
  ctx.strokeStyle = '#3F5E4D';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + width * 0.45, y + height * 0.7);
  ctx.quadraticCurveTo(x + width * 0.4, y + height * 0.4, x + width * 0.5, y + height * 0.22);
  ctx.stroke();

  // Leaves
  ctx.fillStyle = '#4D754B';
  ctx.beginPath();
  ctx.ellipse(x + width * 0.38, y + height * 0.4, 7, 3, -0.5, 0, Math.PI * 2);
  ctx.ellipse(x + width * 0.58, y + height * 0.32, 8, 3.5, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Red flower blossom
  ctx.fillStyle = '#C43838';
  ctx.beginPath();
  ctx.arc(x + width * 0.5, y + height * 0.2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Vertical Calligraphy Notes Columns
  ctx.fillStyle = '#3A281E';
  ctx.fillRect(x + width * 0.75, y + 14, 2, height * 0.55);
  ctx.fillRect(x + width * 0.85, y + 14, 2, height * 0.45);

  // Cinnabar Red Herbalist Seal Stamp
  ctx.fillStyle = '#A82828';
  ctx.fillRect(x + 8, y + height - 16, 8, 8);
  ctx.fillStyle = '#E8DEC8';
  ctx.fillRect(x + 10, y + height - 14, 4, 4);
}

function drawShopBackground() {
  // 1. Dark Aged Walnut / Rosewood Wall Panelling
  ctx.fillStyle = '#2A1810';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle Wall Panelling & Carved Beam Lines
  ctx.strokeStyle = '#1D1009';
  ctx.lineWidth = 4;
  for (let x = 120; x < CANVAS_WIDTH; x += 240) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT * 0.6);
    ctx.stroke();
  }

  // Upper Carved Lattice Frieze Beam along the top of the room
  ctx.fillStyle = '#3A2015';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 28);
  ctx.fillStyle = '#87553A';
  ctx.fillRect(0, 26, CANVAS_WIDTH, 2);

  // 1.5. Subtle Traditional Hanging Dried Medicinal Herbs (Sparse & Natural)
  drawSubtleHangingHerb(ctx, 95, 120, 'roots');
  drawSubtleHangingHerb(ctx, 120, 240, 'flowers');
  drawSubtleHangingHerb(ctx, 770, 180, 'leaves');
  drawSubtleHangingHerb(ctx, 1150, 180, 'roots');
  drawSubtleHangingHerb(ctx, 1790, 120, 'leaves');
  drawSubtleHangingHerb(ctx, 1815, 240, 'flowers');

  // 2. Wall Light Falloff (Warm golden pools radiating behind lanterns)
  lightSources.forEach(src => {
    if (src.type === 'lantern') {
      const grad = ctx.createRadialGradient(src.x, src.y, 0, src.x, src.y, 110);
      grad.addColorStop(0, 'rgba(244, 192, 94, 0.45)');
      grad.addColorStop(0.5, 'rgba(222, 148, 56, 0.2)');
      grad.addColorStop(1, 'rgba(244, 192, 94, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(src.x, src.y, 110, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 3. Aged Dark Timber Floorboards (MATCHED FLOOR RENDERER)
  drawApothecaryFloor(ctx, CANVAS_HEIGHT * 0.6, CANVAS_HEIGHT);

  // 4. Central Traditional Chinese Lattice Moon Window (Unobstructed & Open)
  drawChineseLatticeWindow(ctx);

  // 5. Left & Right Hundred-Drawer Apothecary Cabinets (Baizigui 百子柜)
  drawBaiziguiCabinet(ctx, 150, 750);
  drawBaiziguiCabinet(ctx, 1170, 1770);

  // 6. Shelves Items (Authentic Ancient Chinese Ceramics, Herbs, Books, Gourds)
  // Left Cabinet:
  // Shelf 1 (y = 160)
  drawQinghuaPorcelainJar(ctx, 195, 160, 48, 62);
  drawSprite(ctx, lanternSprite, lanternColorMap, 250, 160 - 120, 8); // Lantern 1
  drawThreadBoundBooks(ctx, 350, 160, 54, 64, true); // Horizontal book stack
  drawGourdBottle(ctx, 430, 160, 1.05); // Calabash bottle
  drawCeladonJar(ctx, 500, 160, 46, 56, true);
  drawGinsengBundle(ctx, 570, 160, 1.0);
  drawQinghuaPorcelainJar(ctx, 640, 160, 50, 64);
  drawHerbPaperPacket(ctx, 710, 160, 1.0);

  // Shelf 2 (y = 280)
  drawBambooCanister(ctx, 190, 280, 36, 62);
  drawLingzhiDish(ctx, 260, 280, 1.0);
  drawCeladonJar(ctx, 330, 280, 48, 58, false);
  drawThreadBoundBooks(ctx, 400, 280, 36, 64, false, false); // Vertical indigo book
  drawSprite(ctx, lanternSprite, lanternColorMap, 470, 280 - 120, 8); // Lantern 2
  drawCeramicHerbBowl(ctx, 555, 280, 1.0, '#DE8A24'); // Saffron bowl
  drawClayHerbPot(ctx, 630, 280, 44, 54);
  drawGourdBottle(ctx, 700, 280, 0.95);

  // Shelf 3 (y = 400)
  drawThreadBoundBooks(ctx, 190, 400, 36, 64, false, true); // Leaning book
  drawQinghuaPorcelainJar(ctx, 260, 400, 52, 66);
  drawSteelyardScale(ctx, 340, 400, 1.0); // Apothecary balance scale
  drawGinsengBundle(ctx, 420, 400, 1.05);
  drawBambooCanister(ctx, 490, 400, 34, 58);
  drawCeladonJar(ctx, 560, 400, 48, 58, true);
  drawSprite(ctx, lanternSprite, lanternColorMap, 640, 400 - 120, 8); // Lantern 3
  drawHerbPaperPacket(ctx, 710, 400, 1.0);

  // Right Cabinet:
  // Shelf 1 (y = 160)
  drawGourdBottle(ctx, 1210, 160, 1.05);
  drawQinghuaPorcelainJar(ctx, 1280, 160, 50, 64);
  drawCeramicHerbBowl(ctx, 1360, 160, 1.0, '#C84024'); // Goji berries bowl
  drawCeladonJar(ctx, 1435, 160, 48, 58, true);
  drawThreadBoundBooks(ctx, 1515, 160, 54, 64, true); // Horizontal stack
  drawSprite(ctx, lanternSprite, lanternColorMap, 1600, 160 - 120, 8); // Lantern 4
  drawClayHerbPot(ctx, 1685, 160, 46, 56);

  // Shelf 2 (y = 280)
  drawSprite(ctx, lanternSprite, lanternColorMap, 1210, 280 - 120, 8); // Lantern 5
  drawThreadBoundBooks(ctx, 1290, 280, 36, 64, false, false);
  drawBambooCanister(ctx, 1360, 280, 34, 60);
  drawLingzhiDish(ctx, 1435, 280, 1.05);
  drawQinghuaPorcelainJar(ctx, 1515, 280, 52, 66);
  drawGinsengBundle(ctx, 1590, 280, 1.0);
  drawCeladonJar(ctx, 1665, 280, 48, 58, false);

  // Shelf 3 (y = 400)
  drawClayHerbPot(ctx, 1215, 400, 44, 54);
  drawSteelyardScale(ctx, 1290, 400, 1.0);
  drawGourdBottle(ctx, 1365, 400, 1.0);
  drawThreadBoundBooks(ctx, 1435, 400, 36, 64, false, true);
  drawSprite(ctx, lanternSprite, lanternColorMap, 1520, 400 - 120, 8); // Lantern 6
  drawCeramicHerbBowl(ctx, 1605, 400, 1.0, '#4E7A4A'); // Ground herbal powder
  drawQinghuaPorcelainJar(ctx, 1680, 400, 50, 64);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COUNTERTOP AND COUNTER PROPS RENDERING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function drawCounterAndItems() {
  const counterHeight = 160;

  // Counter Shadow on Floor
  ctx.fillStyle = 'rgba(20, 11, 7, 0.45)';
  ctx.fillRect(100, counterY + counterHeight - 8, CANVAS_WIDTH - 200, 30);

  // 1. Counter Wooden Base (Rich Aged Rosewood)
  ctx.fillStyle = '#3D2418';
  ctx.fillRect(100, counterY, CANVAS_WIDTH - 200, counterHeight);

  // Countertop Light Pools under candles
  ctx.save();
  ctx.beginPath();
  ctx.rect(100, counterY, CANVAS_WIDTH - 200, counterHeight);
  ctx.clip();
  lightSources.forEach(src => {
    if (src.type === 'candle') {
      const grad = ctx.createRadialGradient(src.x, counterY + 12, 0, src.x, counterY + 12, 95);
      grad.addColorStop(0, '#7A482A');
      grad.addColorStop(0.6, '#4E2C1B');
      grad.addColorStop(1, '#3D2418');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(src.x, counterY + 12, 95, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();

  // 2. Polished Dark Aged Countertop Slab
  ctx.fillStyle = '#5A3825';
  ctx.fillRect(100, counterY, CANVAS_WIDTH - 200, 32);
  ctx.fillStyle = '#87553A'; // Countertop highlight line
  ctx.fillRect(100, counterY + 2, CANVAS_WIDTH - 200, 4);

  // 3. Counter Outer Bevels & Inset Panels
  ctx.strokeStyle = '#1D120B';
  ctx.lineWidth = 6;
  ctx.strokeRect(100, counterY, CANVAS_WIDTH - 200, counterHeight);
  ctx.beginPath();
  ctx.moveTo(100, counterY + 32);
  ctx.lineTo(CANVAS_WIDTH - 100, counterY + 32);
  ctx.stroke();

  // Traditional Carved Chinese Panel Insets with Gold Corner Accents
  for (let x = 250; x < CANVAS_WIDTH - 200; x += 300) {
    // Inset panel frame
    ctx.fillStyle = '#2A1810';
    ctx.fillRect(x, counterY + 48, 200, 84);
    ctx.strokeStyle = '#180D08';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, counterY + 48, 200, 84);

    // Carved cloud / fretwork border line
    ctx.strokeStyle = '#5E3927';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 8, counterY + 56, 184, 68);

    // Gold Corner Accents on panel
    ctx.fillStyle = '#C99B3B';
    ctx.fillRect(x + 4, counterY + 52, 6, 6);
    ctx.fillRect(x + 190, counterY + 52, 6, 6);
    ctx.fillRect(x + 4, counterY + 124, 6, 6);
    ctx.fillRect(x + 190, counterY + 124, 6, 6);
  }

  // 4. Authentic Ancient Chinese Countertop Props
  // Bronze Lotus Candle 1 (Left)
  drawSprite(ctx, candleSprite, candleColorMap, 300 - 8, counterY - 104, 8);

  // Potted Miniature Chinese Bonsai in Celadon Planter 1
  drawChineseBonsai(ctx, 460, counterY, 110, 120);

  // Ancient Chinese Abacus (Suanpan 算盘)
  drawAbacus(ctx, 640, counterY, 78, 38);

  // Mountain-Shaped Jade Brush Rest & Calligraphy Brushes
  drawBrushRestAndInk(ctx, 760, counterY, 68, 38);

  // Stack of Folded Paper Herb Packets tied with red cord
  drawHerbPaperPacket(ctx, 860, counterY, 1.1);

  // Ancient Medical Compendium / Recipe Book (Interactable - keeps exact coordinates X: 950, Y: 485)
  if (bookImage.complete) {
    ctx.drawImage(bookImage, 950, 485, 96, 96);
  } else {
    // Fallback Thread-Bound Prescription Guide
    ctx.fillStyle = '#1D120B';
    ctx.fillRect(948, counterY - 28, 100, 28);
    ctx.fillStyle = '#243A52'; // Indigo silk
    ctx.fillRect(950, counterY - 26, 96, 24);
    ctx.fillStyle = '#F5EBD0'; // Title slip
    ctx.fillRect(960, counterY - 24, 30, 20);
    ctx.fillStyle = '#8B2626'; // Ribbon bookmark
    ctx.fillRect(995, counterY - 26, 4, 32);
  }

  // Bronze Lotus Candle 2 (Right)
  drawSprite(ctx, candleSprite, candleColorMap, 1300 - 8, counterY - 104, 8);

  // Stack of Folded Paper Packets
  drawHerbPaperPacket(ctx, 1390, counterY, 1.15);

  // Potted Miniature Chinese Bonsai in Celadon Planter 2
  drawChineseBonsai(ctx, 1520, counterY, 110, 120);
}

function drawGlows() {
  const t = Date.now() / 1000;

  ctx.globalCompositeOperation = 'screen';

  lightSources.forEach((src, idx) => {
    // Atmospheric slow flicker and warmth breathing
    const t_i = t + idx * 1.7;
    const flicker = 0.95 + 0.05 * Math.sin(t_i * 2.8) + 0.02 * Math.cos(t_i * 7.4) + 0.01 * Math.sin(t_i * 15.3);
    const radius = src.radius * flicker * 1.15;

    // Rich Amber-Gold atmospheric halo
    const grad = ctx.createRadialGradient(src.x, src.y, 0, src.x, src.y, radius);

    const maxOpacity = src.type === 'candle' ? 0.55 : 0.45;
    grad.addColorStop(0, `rgba(255, 200, 90, ${maxOpacity})`);
    grad.addColorStop(0.35, `rgba(235, 150, 50, ${maxOpacity * 0.5})`);
    grad.addColorStop(1, 'rgba(220, 130, 40, 0)');

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
    // 1. Base Wall, Floor, Baizigui Hundred-Drawer Cabinets, Window, Subtle Hanging Herbs, Jars, Lanterns
    drawShopBackground();

    // 1.2. Main Shop Traditional Chinese Carpet / Rug (between counter and hotbar)
    drawTraditionalRug(ctx, 560, 680, 800, 180);

    // 2. Draw Apothecary behind the counter
    const shopShadowScale = Math.max(0.4, 1 - Math.abs(player.jumpOffset) / 350);
    ctx.fillStyle = 'rgba(29, 18, 11, 0.45)';
    ctx.beginPath();
    ctx.ellipse(player.x + player.renderWidth / 2, player.baseY + player.renderHeight, (player.renderWidth / 2) * shopShadowScale, 10 * shopShadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    drawPlayerImage(ctx, player.x, player.y);

    // 3. Draw Rosewood Counter, Abacus, Brush Rest, Prescription Book, Bonsai, Candles
    drawCounterAndItems();

    // 4. Draw NPC Customer in front of the counter
    if (npc.active) {
      ctx.fillStyle = 'rgba(29, 18, 11, 0.45)';
      ctx.beginPath();
      ctx.ellipse(npc.x + npc.renderWidth / 2, npc.y + npc.renderHeight, npc.renderWidth / 2, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      drawSprite(ctx, playerSprite, npcColorMap, npc.x, npc.y, pixelScale);
    }

    // 4.5. Small Traditional Medicinal Herb Pots (Neatly against corners, clean of UI)
    drawSmallHerbPot(ctx, 70, CANVAS_HEIGHT - 35, 44);
    drawSmallHerbPot(ctx, CANVAS_WIDTH - 70, CANVAS_HEIGHT - 35, 44);

    // 5. Draw Ambient shadowy room tint overlay
    ctx.fillStyle = 'rgba(25, 18, 28, 0.22)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 6. Draw Warm Amber Glow Halos
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

    // 6. Barrel progress indicator
    const distToBarrel = Math.sqrt(Math.pow((player.x + player.renderWidth / 2) - 750, 2) + Math.pow((player.y + player.renderHeight / 2) - 463, 2));
    const isHoldingEOnBarrel = (distToBarrel < 180 && keys.e && !inventory.includes('Water'));
    const isHoldingMouseOnBarrel = (activeHoldBarrel && isMouseDown && !inventory.includes('Water'));
    if (holdTime > 0 && (isHoldingEOnBarrel || isHoldingMouseOnBarrel)) {
      const barrelCenterX = 750;
      const barrelCenterY = 463;
      const progress = holdTime / 1.0;

      ctx.beginPath();
      ctx.arc(barrelCenterX, barrelCenterY, 70, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(29, 21, 17, 0.4)';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(barrelCenterX, barrelCenterY, 70, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.strokeStyle = '#F4C05E'; // glowing gold Progress Arc
      ctx.lineWidth = 8;
      ctx.stroke();
    }

    // 7. Stove brewing progress indicator
    if (isBrewing && brewingTime > 0) {
      const stoveCenterX = 360;
      const stoveCenterY = 443;
      const progress = brewingTime / 1.5;

      ctx.beginPath();
      ctx.arc(stoveCenterX, stoveCenterY, 70, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(29, 21, 17, 0.4)';
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(stoveCenterX, stoveCenterY, 70, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.strokeStyle = '#F4C05E'; // glowing gold Progress Arc
      ctx.lineWidth = 8;
      ctx.stroke();
    }
  }

  // Worktable View Overlay
  if (currentState === GameState.WORKTABLE) {
    drawWorktableView();
  }

  // Cabinet View Overlay
  if (currentState === GameState.CABINET) {
    drawCabinetView();
  }

  // Inventory Hotbar (visible in both rooms during gameplay/cabinet/worktable)
  if (currentState === GameState.GAMEPLAY || currentState === GameState.CABINET || currentState === GameState.WORKTABLE) {
    drawInventoryHotbar();
  }

  // Active Slide Animations
  drawActiveAnimations();

  // Dragged Item
  if (draggedItemIndex !== null) {
    drawInventoryItem(ctx, inventory[draggedItemIndex], draggedItemX, draggedItemY, 4);
  }
  if (isDraggingFromMortar) {
    drawDraggedMixture(ctx, draggedItemX, draggedItemY);
  }

  // Transition Overlay
  if (transitionAlpha > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
}

function drawDraggedMixture(ctx, x, y) {
  ctx.save();
  // 1. Soft glowing aura around dragged mixture
  const auraGrad = ctx.createRadialGradient(x, y, 6, x, y, 48);
  auraGrad.addColorStop(0, 'rgba(212, 140, 80, 0.75)');
  auraGrad.addColorStop(0.5, 'rgba(160, 82, 45, 0.4)');
  auraGrad.addColorStop(1, 'rgba(139, 69, 19, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(x, y, 48, 0, Math.PI * 2);
  ctx.fill();

  // 2. Translucent drop shadow under mixture
  ctx.fillStyle = 'rgba(20, 12, 8, 0.55)';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 32, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Rich brown herbal paste blob (organic shape)
  ctx.fillStyle = '#6E2D1F'; // Deep rich brown herbal paste
  ctx.beginPath();
  ctx.ellipse(x, y, 30, 22, -0.08, 0, Math.PI * 2);
  ctx.fill();

  // Highlighted texture layers
  ctx.fillStyle = '#9C422A';
  ctx.beginPath();
  ctx.ellipse(x - 4, y - 3, 20, 13, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#B8583B';
  ctx.beginPath();
  ctx.ellipse(x - 2, y - 5, 12, 7, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Botanical grain specks & extract flecks
  ctx.fillStyle = '#E8B67D';
  ctx.beginPath();
  ctx.arc(x - 8, y - 5, 3.5, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 3, 3, 0, Math.PI * 2);
  ctx.arc(x + 2, y + 5, 3, 0, Math.PI * 2);
  ctx.arc(x - 3, y + 3, 2.5, 0, Math.PI * 2);
  ctx.arc(x - 11, y + 2, 2.2, 0, Math.PI * 2);
  ctx.arc(x + 10, y + 4, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Organic outline
  ctx.strokeStyle = 'rgba(45, 18, 10, 0.75)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, 30, 22, -0.08, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// --- WORKTABLE CLOSE-UP VIEW ---
function drawWorktableView() {
  // 1. Draw table closeup background (full-screen without distortion)
  if (tableCloseupImage.complete) {
    ctx.drawImage(tableCloseupImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    ctx.fillStyle = '#4A2E1B';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // Clean ambient lighting
  ctx.fillStyle = 'rgba(25, 20, 35, 0.1)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Ensure completely solid, opaque rendering
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';

  // 2. Positions and proportions for Mortar & Pestle and Copper Basin (aspect ratio 693:360)
  const mortarCenterX = 580;
  const mortarCenterY = 480;
  const mortarH = 300; // Only a little smaller than copper basin (340)
  const mortarW = mortarH * (693 / 360); // 577.5 (exact 693:360 ratio preserved)

  const bowlCenterX = 1260;
  const bowlCenterY = 480;
  const bowlH = 340;
  const bowlW = bowlH * (693 / 360); // 654.5

  // Grounding soft shadows under props
  // Shadow under Mortar & Pestle
  ctx.fillStyle = 'rgba(15, 10, 7, 0.6)';
  ctx.beginPath();
  ctx.ellipse(mortarCenterX, mortarCenterY + 115, 180, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shadow under Copper Basin (only if present on table)
  if (copperBowlState !== 'COLLECTED') {
    ctx.fillStyle = 'rgba(27, 19, 14, 0.45)';
    ctx.beginPath();
    ctx.ellipse(bowlCenterX, bowlCenterY + 115, 160, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Solid Mortar & Pestle (as-is, unaltered)
  let currentMortarImg = mortarEmptyImage;
  if (mortarState === 'EMPTY') {
    currentMortarImg = mortarEmptyImage;
  } else if (mortarState === 'HALF') {
    currentMortarImg = mortarHalfImage;
  } else if (mortarState === 'FULL' || mortarState === 'MIXED') {
    currentMortarImg = mortarFull1Image;
  } else if (mortarState === 'MIXING') {
    const isFrame1 = Math.floor(mortarMixingTime / 0.2) % 2 === 0;
    currentMortarImg = isFrame1 ? mortarFull1Image : mortarFull2Image;
  }

  if (currentMortarImg && currentMortarImg.complete) {
    ctx.drawImage(currentMortarImg, mortarCenterX - mortarW / 2, mortarCenterY - mortarH / 2, mortarW, mortarH);
  }

  // Draw Solid Copper Basin (only if not collected)
  if (copperBowlState !== 'COLLECTED') {
    let currentBowlImg = copperBowlState === 'FULL' ? copperBowlFullImage : copperBowlEmptyImage;
    if (currentBowlImg && currentBowlImg.complete) {
      ctx.drawImage(currentBowlImg, bowlCenterX - bowlW / 2, bowlCenterY - bowlH / 2, bowlW, bowlH);
    }
  }

  // Status tag: Only display "Drop mixture here" above Copper Basin after grinding finishes and bowl is empty
  if (mortarState === 'MIXED' && copperBowlState === 'EMPTY') {
    ctx.save();
    ctx.font = 'bold 22px "EB Garamond", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const bowlStatusText = "Drop mixture here";
    const bLabelW = ctx.measureText(bowlStatusText).width + 28;
    ctx.fillStyle = '#F5F2EB';
    ctx.fillRect(bowlCenterX - bLabelW / 2, bowlCenterY - 180, bLabelW, 36);
    ctx.strokeStyle = '#1d1511';
    ctx.lineWidth = 3;
    ctx.strokeRect(bowlCenterX - bLabelW / 2, bowlCenterY - 180, bLabelW, 36);
    ctx.fillStyle = '#4A3B32';
    ctx.fillText(bowlStatusText, bowlCenterX, bowlCenterY - 162);
    ctx.restore();
  }

  // 3. Mixing Progress Arc during 5-second mixing
  if (mortarState === 'MIXING') {
    const progress = mortarMixingTime / 5.0;

    ctx.beginPath();
    ctx.arc(mortarCenterX, mortarCenterY, 70, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(29, 21, 17, 0.5)';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(mortarCenterX, mortarCenterY, 70, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.strokeStyle = '#F4C05E'; // glowing gold Progress Arc
    ctx.lineWidth = 10;
    ctx.stroke();
  }

  // 4. Close Button [Esc]
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

// --- WORKROOM RENDER HELPERS ---

// --- WORKROOM DETAILED ART RENDERING HELPERS ---

function drawShelfBottle(ctx, x, y, width, height, liquidColor) {
  // Bottle outline
  ctx.fillStyle = '#1B130E';
  ctx.fillRect(x, y, width, height);
  // Bottle body (glass highlights)
  ctx.fillStyle = '#E5DEC9';
  ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
  // Liquid content
  if (liquidColor) {
    ctx.fillStyle = liquidColor;
    ctx.fillRect(x + 2, y + Math.floor(height / 2), width - 4, Math.floor(height / 2) - 2);
    // Liquid shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(x + 3, y + Math.floor(height / 2) + 2, 2, 2);
  }
}

function drawShelfBook(ctx, x, y, width, height, color, slant = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (slant !== 0) {
    ctx.rotate(slant);
  }
  // Outline
  ctx.fillStyle = '#1B130E';
  ctx.fillRect(0, 0, width, height);
  // Book spine
  ctx.fillStyle = color;
  ctx.fillRect(2, 2, width - 4, height - 4);
  // Page lines or details
  ctx.fillStyle = '#D9C1A0';
  ctx.fillRect(4, 5, width - 8, 3);
  ctx.fillRect(4, height - 8, width - 8, 3);
  ctx.restore();
}

function drawShelfMortar(ctx, x, y) {
  // Bowl shape
  ctx.fillStyle = '#1B130E';
  ctx.fillRect(x, y + 8, 20, 12);
  ctx.fillStyle = '#808080'; // Grey stone bowl
  ctx.fillRect(x + 2, y + 10, 16, 8);
  // Bowl top lip
  ctx.fillStyle = '#1B130E';
  ctx.fillRect(x - 2, y + 6, 24, 4);
  ctx.fillStyle = '#A0A0A0';
  ctx.fillRect(x, y + 8, 20, 2);
  // Pestle
  ctx.strokeStyle = '#1B130E';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 16, y);
  ctx.lineTo(x + 6, y + 12);
  ctx.stroke();

  ctx.strokeStyle = '#D0D0D0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 16, y);
  ctx.lineTo(x + 6, y + 12);
  ctx.stroke();
}

function drawShelfBalance(ctx, x, y) {
  ctx.strokeStyle = '#1B130E';
  ctx.lineWidth = 4;
  // Outline center stand
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 20);
  ctx.lineTo(x + 12, y + 2);
  ctx.stroke();
  // Outline cross beam
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 5);
  ctx.lineTo(x + 22, y + 5);
  ctx.stroke();

  ctx.strokeStyle = '#D9C1A0'; // Gold/brass color
  ctx.lineWidth = 2;
  // Center stand
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 20);
  ctx.lineTo(x + 12, y + 2);
  ctx.stroke();
  // Cross beam
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 5);
  ctx.lineTo(x + 22, y + 5);
  ctx.stroke();

  // Left pan
  ctx.strokeStyle = '#1B130E';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 5);
  ctx.lineTo(x + 3, y + 15);
  ctx.stroke();
  ctx.strokeStyle = '#D9C1A0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 5);
  ctx.lineTo(x + 3, y + 15);
  ctx.stroke();
  ctx.fillStyle = '#1B130E';
  ctx.fillRect(x + 1, y + 14, 5, 3);
  ctx.fillStyle = '#D9C1A0';
  ctx.fillRect(x + 2, y + 15, 3, 1);

  // Right pan
  ctx.strokeStyle = '#1B130E';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 21, y + 5);
  ctx.lineTo(x + 21, y + 15);
  ctx.stroke();
  ctx.strokeStyle = '#D9C1A0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 21, y + 5);
  ctx.lineTo(x + 21, y + 15);
  ctx.stroke();
  ctx.fillStyle = '#1B130E';
  ctx.fillRect(x + 19, y + 14, 5, 3);
  ctx.fillStyle = '#D9C1A0';
  ctx.fillRect(x + 20, y + 15, 3, 1);
}

function drawShelfCactus(ctx, x, y) {
  // Pot
  ctx.fillStyle = '#1B130E';
  ctx.fillRect(x + 2, y + 10, 16, 10);
  ctx.fillStyle = '#AC7A52'; // terracotta pot
  ctx.fillRect(x + 4, y + 12, 12, 7);
  ctx.fillStyle = '#8B5E3C'; // dark soil rim
  ctx.fillRect(x + 3, y + 10, 14, 2);

  // Cactus green
  ctx.fillStyle = '#1B130E';
  ctx.fillRect(x + 7, y + 1, 6, 9);
  ctx.fillRect(x + 4, y + 3, 5, 5);
  ctx.fillRect(x + 11, y + 4, 5, 4);

  ctx.fillStyle = '#2E7D32'; // cactus main green
  ctx.fillRect(x + 8, y + 2, 4, 8);
  ctx.fillRect(x + 5, y + 4, 3, 3);
  ctx.fillRect(x + 12, y + 5, 3, 2);
}

function drawShelfScrollStack(ctx, x, y) {
  const drawScroll = (sx, sy) => {
    ctx.fillStyle = '#1B130E';
    ctx.fillRect(sx, sy, 26, 9);
    ctx.fillStyle = '#F0E4CC'; // aged paper
    ctx.fillRect(sx + 1, sy + 1, 24, 7);
    ctx.fillStyle = '#C0392B'; // red ribbon tie
    ctx.fillRect(sx + 11, sy + 1, 4, 7);
  };
  drawScroll(x, y + 11);
  drawScroll(x + 5, y + 4);
}

function drawPinnedPaper(ctx, x, y) {
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(x + 2, y + 2, 44, 56);
  // Paper
  ctx.fillStyle = '#E5DEC9';
  ctx.fillRect(x, y, 44, 56);
  ctx.strokeStyle = '#9A8E72';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, 44, 56);

  // Pin
  ctx.fillStyle = '#555555';
  ctx.fillRect(x + 20, y - 3, 4, 4);

  // Cursive writing lines
  ctx.fillStyle = '#5A4E3B';
  ctx.fillRect(x + 6, y + 12, 32, 2);
  ctx.fillRect(x + 6, y + 20, 26, 2);
  ctx.fillRect(x + 6, y + 28, 30, 2);
  ctx.fillRect(x + 6, y + 36, 16, 2);

  // Tiny sketch
  ctx.fillStyle = '#556B2F'; // green leaf
  ctx.fillRect(x + 24, y + 36, 4, 4);
  ctx.fillRect(x + 26, y + 38, 4, 4);
  ctx.fillRect(x + 28, y + 42, 6, 2);
}

function drawHangingHerbs(ctx, x, y) {
  // Nail/peg
  ctx.fillStyle = '#4A3B32';
  ctx.fillRect(x - 2, y - 2, 4, 4);

  // Hanging string
  ctx.strokeStyle = '#8C6239';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 15);
  ctx.stroke();

  // Herb bundle silhouette outline
  ctx.fillStyle = '#1D1511';
  ctx.fillRect(x - 10, y + 14, 20, 48);

  // Herb leaves (varying shades of green and purple)
  ctx.fillStyle = '#556B2F'; // olive green
  ctx.fillRect(x - 8, y + 16, 16, 24);
  ctx.fillStyle = '#8FBC8F'; // light sage green
  ctx.fillRect(x - 5, y + 24, 10, 20);
  ctx.fillStyle = '#8A739C'; // lavender flowers
  ctx.fillRect(x - 6, y + 32, 12, 28);
  ctx.fillRect(x - 4, y + 44, 8, 16);
}

function drawStoneChimney(ctx) {
  const startX = 250;
  const endX = 470;
  const width = endX - startX;
  const wallH = 500;

  // Base chimney fill
  ctx.fillStyle = '#4A3E36';
  ctx.fillRect(startX, 0, width, wallH);

  // Draw individual bricks
  const rowHeight = 20;
  for (let y = 0; y < wallH; y += rowHeight) {
    const isEven = (y / rowHeight) % 2 === 0;
    const offset = isEven ? 0 : 25;

    for (let x = startX - 25; x < endX + 25; x += 50) {
      const bx = x + offset;
      const drawX = Math.max(startX, bx);
      const drawW = Math.min(endX, bx + 50) - drawX;

      if (drawW <= 0) continue;

      const seed = Math.sin(drawX * 0.05 + y * 0.1) * 10000;
      const rand = seed - Math.floor(seed);

      let brickColor = '#4F433B';
      if (rand < 0.15) brickColor = '#3C322C';
      else if (rand < 0.3) brickColor = '#5E4A40';
      else if (rand < 0.45) brickColor = '#5F524A';

      ctx.fillStyle = brickColor;
      ctx.fillRect(drawX, y, drawW, rowHeight);

      // Brick mortar line
      ctx.strokeStyle = '#27201C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(drawX, y + rowHeight);
      ctx.lineTo(drawX + drawW, y + rowHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(drawX + drawW, y);
      ctx.lineTo(drawX + drawW, y + rowHeight);
      ctx.stroke();

      // Brick highlight edges
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(drawX + 1, y + rowHeight - 1);
      ctx.lineTo(drawX + 1, y + 1);
      ctx.lineTo(drawX + drawW - 1, y + 1);
      ctx.stroke();
    }
  }

  // Border pillars
  ctx.fillStyle = '#3C322C';
  ctx.fillRect(startX - 8, 0, 8, wallH);
  ctx.fillRect(endX, 0, 8, wallH);

  ctx.fillStyle = '#5A4A40';
  ctx.fillRect(startX - 6, 0, 2, wallH);
  ctx.fillRect(endX + 4, 0, 2, wallH);

  ctx.strokeStyle = '#27201C';
  ctx.lineWidth = 2;
  for (let y = 0; y < wallH; y += 40) {
    ctx.beginPath();
    ctx.moveTo(startX - 8, y);
    ctx.lineTo(startX, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, y);
    ctx.lineTo(endX + 8, y);
    ctx.stroke();
  }
}

function drawWorkroomBackground() {
  // 1. Draw outer backdrop color (paneled wall background)
  ctx.fillStyle = '#2A1E17'; // Rich dark wood tone
  ctx.fillRect(0, 0, CANVAS_WIDTH, 500);

  // Wall panel vertical lines
  ctx.strokeStyle = '#1B130E'; // Dark panel shadow lines
  ctx.lineWidth = 4;
  for (let x = 120; x < CANVAS_WIDTH; x += 240) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 500);
    ctx.stroke();
  }

  // Highlight line next to the shadow lines for depth
  ctx.strokeStyle = '#3E2D23';
  ctx.lineWidth = 2;
  for (let x = 122; x < CANVAS_WIDTH; x += 240) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 500);
    ctx.stroke();
  }

  // Draw wainscoting horizontal beam at Y=380
  ctx.fillStyle = '#3E2F25';
  ctx.fillRect(0, 380, CANVAS_WIDTH, 24);
  // Highlight
  ctx.fillStyle = '#5A4233';
  ctx.fillRect(0, 380, CANVAS_WIDTH, 3);
  // Shadow
  ctx.fillStyle = '#1D140F';
  ctx.fillRect(0, 401, CANVAS_WIDTH, 3);
  // Wainscoting panel seams below the beam
  ctx.strokeStyle = '#1D140F';
  ctx.lineWidth = 2;
  for (let x = 60; x < CANVAS_WIDTH; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 404);
    ctx.lineTo(x, 500);
    ctx.stroke();
  }

  // 2. Draw Stone Chimney behind the Stove
  drawStoneChimney(ctx);

  // 3. Draw Background wall decorations
  // Pinned Recipe sheets
  drawPinnedPaper(ctx, 510, 90);
  drawPinnedPaper(ctx, 1120, 80);

  // Hanging Herbs
  drawHangingHerbs(ctx, 580, 70);
  drawHangingHerbs(ctx, 620, 75);

  // 4. Draw Background Shelves
  const drawShelfBoard = (x, y, w) => {
    // Shelf outline
    ctx.fillStyle = '#1B130E';
    ctx.fillRect(x - 2, y, w + 4, 16);
    // Shelf wood body
    ctx.fillStyle = '#5A3E2B';
    ctx.fillRect(x, y + 2, w, 12);
    // Top highlight
    ctx.fillStyle = '#80593E';
    ctx.fillRect(x, y + 2, w, 3);
    // Bottom shadow
    ctx.fillStyle = '#3B281B';
    ctx.fillRect(x, y + 11, w, 3);
    // Metal Brackets/supports underneath
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(x + 12, y + 16, 6, 12);
    ctx.fillRect(x + w - 18, y + 16, 6, 12);
  };

  // Shelf A: Left wall (X=24 to 230)
  drawShelfBoard(24, 220, 206);
  drawShelfBoard(24, 340, 206);

  // Shelf A1 Items
  drawShelfBottle(ctx, 40, 192, 10, 28, 'rgba(46, 204, 113, 0.85)'); // green
  drawShelfBottle(ctx, 55, 196, 12, 24, 'rgba(231, 76, 60, 0.85)');  // red
  drawShelfBook(ctx, 80, 172, 12, 48, '#8E44AD'); // purple book
  drawShelfBook(ctx, 95, 172, 14, 48, '#D35400', 0.12); // tilted brown book
  drawShelfScrollStack(ctx, 130, 200);
  drawShelfBalance(ctx, 170, 200);

  // Shelf A2 Items
  drawShelfCactus(ctx, 40, 320);
  drawShelfMortar(ctx, 75, 320);
  drawShelfBottle(ctx, 105, 312, 12, 28, 'rgba(52, 152, 219, 0.85)'); // blue
  drawShelfBottle(ctx, 122, 316, 10, 24, 'rgba(155, 89, 182, 0.85)'); // purple
  drawShelfBottle(ctx, 137, 312, 14, 28, 'rgba(241, 196, 15, 0.85)'); // gold/yellow
  drawShelfBook(ctx, 165, 292, 12, 48, '#27AE60'); // green book
  drawShelfBook(ctx, 180, 292, 10, 48, '#2C3E50'); // dark blue book

  // Shelf B: Mid wall (X=490 to 650)
  drawShelfBoard(490, 220, 160);
  drawShelfBook(ctx, 505, 172, 12, 48, '#C0392B'); // red book
  drawShelfBook(ctx, 520, 172, 14, 48, '#7F8C8D'); // grey book
  drawShelfCactus(ctx, 545, 200);
  drawShelfBottle(ctx, 580, 192, 12, 28, 'rgba(52, 152, 219, 0.85)'); // blue
  drawShelfBottle(ctx, 597, 196, 10, 24, 'rgba(235, 104, 160, 0.85)'); // pink
  drawShelfBottle(ctx, 612, 192, 14, 28, 'rgba(241, 196, 15, 0.85)'); // yellow

  // Shelf C: Right wall (X=1090 to 1430)
  drawShelfBoard(1090, 180, 340);
  drawShelfBoard(1090, 320, 340);

  // Shelf C1 Items (y=180)
  drawShelfBottle(ctx, 1105, 152, 12, 28, 'rgba(231, 76, 60, 0.85)'); // red
  drawShelfBottle(ctx, 1122, 156, 10, 24, 'rgba(52, 152, 219, 0.85)'); // blue
  drawShelfBottle(ctx, 1137, 152, 14, 28, 'rgba(46, 204, 113, 0.85)'); // green
  drawShelfMortar(ctx, 1165, 160);
  drawShelfBook(ctx, 1205, 132, 12, 48, '#2C3E50');
  drawShelfBook(ctx, 1220, 132, 14, 48, '#D35400', 0.15);
  drawShelfBook(ctx, 1240, 132, 10, 48, '#7F8C8D');
  drawShelfBottle(ctx, 1265, 152, 12, 28, 'rgba(155, 89, 182, 0.85)'); // purple
  drawShelfCactus(ctx, 1300, 160);
  drawShelfBottle(ctx, 1340, 152, 12, 28, 'rgba(241, 196, 15, 0.85)'); // yellow
  drawShelfScrollStack(ctx, 1375, 160);

  // Shelf C2 Items (y=320)
  drawShelfScrollStack(ctx, 1105, 300);
  drawShelfBottle(ctx, 1145, 292, 12, 28, 'rgba(231, 76, 60, 0.85)');
  drawShelfBottle(ctx, 1162, 296, 10, 24, 'rgba(46, 204, 113, 0.85)');
  // We draw the candle on C2 shelf: it's at X=1180, base Y=320. Candle Sprite handles drawing itself, but we use drawSprite:
  drawSprite(ctx, candleSprite, candleColorMap, 1195, 320 - 88, 8); // Candle 1

  drawShelfBook(ctx, 1230, 272, 12, 48, '#16A085'); // teal book
  drawShelfBook(ctx, 1245, 272, 14, 48, '#E67E22'); // orange book
  drawShelfBook(ctx, 1262, 272, 10, 48, '#8E44AD'); // purple book
  drawShelfBook(ctx, 1275, 272, 12, 48, '#2C3E50'); // navy book
  drawShelfMortar(ctx, 1305, 300);
  drawShelfBottle(ctx, 1345, 292, 10, 28, 'rgba(52, 152, 219, 0.85)');
  drawShelfCactus(ctx, 1380, 300);

  // Draw Lanterns on the wall
  drawSprite(ctx, lanternSprite, lanternColorMap, 180, 112, 8); // Lantern 1
  drawSprite(ctx, lanternSprite, lanternColorMap, 1350, 62, 8); // Lantern 2

  // Draw background sacks and crates at wall base (X=600 and X=1380)
  // Sacks
  const drawSack = (sx, sy) => {
    ctx.fillStyle = '#1B130E';
    ctx.fillRect(sx, sy, 32, 42);
    ctx.fillStyle = '#C4B49A'; // Tan burlap
    ctx.fillRect(sx + 2, sy + 2, 28, 38);
    // Tie
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(sx + 6, sy + 10, 20, 4);
  };
  drawSack(610, 460);
  drawSack(630, 468);

  // Crates
  const drawCrate = (cx, cy) => {
    ctx.fillStyle = '#1B130E';
    ctx.fillRect(cx, cy, 54, 52);
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(cx + 2, cy + 2, 50, 48);
    // Planks details
    ctx.fillStyle = '#1B130E';
    ctx.fillRect(cx + 2, cy + 16, 50, 3);
    ctx.fillRect(cx + 2, cy + 32, 50, 3);
    // Cross boards
    ctx.strokeStyle = '#1B130E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy + 2);
    ctx.lineTo(cx + 52, cy + 50);
    ctx.stroke();
  };
  drawCrate(1380, 450);

  // 5. Draw floor planks (Cozy Dark Wood planks of height rowHeight)
  const floorStartY = 500;
  const floorEndY = CANVAS_HEIGHT;
  const rowHeight = 86;
  const plankRows = [
    { y: floorStartY, joints: [500, 1300] },
    { y: floorStartY + rowHeight, joints: [250, 1050, 1600] },
    { y: floorStartY + rowHeight * 2, joints: [700, 1400] },
    { y: floorStartY + rowHeight * 3, joints: [400, 1150] },
    { y: floorStartY + rowHeight * 4, joints: [600, 1500] },
    { y: floorStartY + rowHeight * 5, joints: [300, 1200] },
    { y: floorStartY + rowHeight * 6, joints: [800] }
  ];

  plankRows.forEach((row, rowIndex) => {
    const nextY = rowIndex === plankRows.length - 1 ? floorEndY : row.y + rowHeight;
    const currentHeight = nextY - row.y;
    if (currentHeight <= 0) return;

    const joints = [0, ...row.joints, CANVAS_WIDTH];

    for (let i = 0; i < joints.length - 1; i++) {
      const startX = joints[i];
      const endX = joints[i + 1];
      const width = endX - startX;

      const seed = Math.sin(startX * 0.03 + row.y * 0.07) * 10000;
      const rand = seed - Math.floor(seed);

      // Stagger colors for worn vintage wooden floor look
      let plankColor = '#8B5E3C'; // Deeper walnut brown
      if (rand < 0.15) {
        plankColor = '#6E472D'; // Very dark oak
      } else if (rand < 0.35) {
        plankColor = '#9A6B3E'; // Medium warm brown
      } else if (rand < 0.60) {
        plankColor = '#B57F4F'; // Muted caramel
      } else {
        plankColor = '#8B5E3C'; // Deep walnut
      }

      ctx.fillStyle = plankColor;
      ctx.fillRect(startX, row.y, width, currentHeight);

      // Draw Wood Grains
      ctx.save();
      ctx.lineWidth = 1.5;
      let grainColor = '#5c3d25';
      if (plankColor === '#6E472D') grainColor = '#462d1d';
      if (plankColor === '#9A6B3E') grainColor = '#6b4929';
      if (plankColor === '#B57F4F') grainColor = '#8a5c34';
      ctx.strokeStyle = grainColor;

      const grainOffsets = [0.25, 0.5, 0.75];
      grainOffsets.forEach((offset, gIdx) => {
        const grainY = row.y + currentHeight * offset;
        const startOffset = ((rand * (gIdx + 1) * 7.7) % 1) * (width * 0.4);
        const grainWidth = (0.35 + ((rand * (gIdx + 1) * 3.3) % 0.45)) * width;

        ctx.beginPath();
        ctx.moveTo(startX + startOffset, grainY);
        ctx.lineTo(startX + startOffset + grainWidth, grainY);
        ctx.stroke();
      });
      ctx.restore();

      // Top highlight line for 3D depth of planks
      ctx.fillStyle = 'rgba(239, 227, 211, 0.15)';
      ctx.fillRect(startX, row.y, width, 2);

      // Bottom crevice shadow line
      ctx.fillStyle = '#27190F';
      ctx.fillRect(startX, row.y + currentHeight - 3, width, 3);
    }
  });

  // Draw Vintage Rug under the Worktable (from X=770 to 1150, Y=735 to 880 - shifted down 100px)
  const rx = 770;
  const ry = 735;
  const rw = 380;
  const rh = 145;

  // Rug base outline shadow
  ctx.fillStyle = 'rgba(15, 10, 8, 0.45)';
  ctx.fillRect(rx - 4, ry - 4, rw + 8, rh + 8);

  // Rug base fill (terracotta red)
  ctx.fillStyle = '#7C3D32';
  ctx.fillRect(rx, ry, rw, rh);

  // Rug border (cream)
  ctx.fillStyle = '#E5DEC9';
  ctx.fillRect(rx + 8, ry + 8, rw - 16, 6);
  ctx.fillRect(rx + 8, ry + rh - 14, rw - 16, 6);
  ctx.fillRect(rx + 8, ry + 8, 6, rh - 16);
  ctx.fillRect(rx + rw - 14, ry + 8, 6, rh - 16);

  // Rug inner accent lines (navy blue)
  ctx.fillStyle = '#2E4057';
  ctx.fillRect(rx + 18, ry + 18, rw - 36, 4);
  ctx.fillRect(rx + 18, ry + rh - 22, rw - 36, 4);
  ctx.fillRect(rx + 18, ry + 18, 4, rh - 36);
  ctx.fillRect(rx + rw - 22, ry + 18, 4, rh - 36);

  // Fringes (left and right)
  ctx.fillStyle = '#D5CBB5';
  for (let y = ry + 4; y < ry + rh - 4; y += 4) {
    ctx.fillRect(rx - 6, y, 6, 2);
    ctx.fillRect(rx + rw, y, 6, 2);
  }

  // Soft junction shadow separating Wall and Floor (Y=500)
  const junctionGrad = ctx.createLinearGradient(0, 500, 0, 515);
  junctionGrad.addColorStop(0, 'rgba(27, 19, 14, 0.6)');
  junctionGrad.addColorStop(1, 'rgba(27, 19, 14, 0)');
  ctx.fillStyle = junctionGrad;
  ctx.fillRect(0, 500, CANVAS_WIDTH, 15);

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
        // Draw Stove grounding shadow
        ctx.fillStyle = 'rgba(27, 19, 14, 0.45)';
        ctx.fillRect(300, 480, 120, 10);
        // Draw Stove (Y=310, bottom Y=486)
        drawSprite(ctx, stoveSprite, stoveColorMap, 300, 310, pixelScale);
      }
    },
    {
      y: 543,
      draw: () => {
        // Draw Barrel grounding shadow
        ctx.fillStyle = 'rgba(27, 19, 14, 0.45)';
        ctx.beginPath();
        ctx.ellipse(750, 538, 72, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Draw Barrel (Y=383, bottom Y=543, size: 160x160)
        if (barrelImage.complete) {
          ctx.drawImage(barrelImage, 670, 383, 160, 160);
        } else {
          ctx.fillStyle = '#8C6239';
          ctx.fillRect(670, 383, 160, 160);
        }
      }
    },
    {
      y: 543,
      draw: () => {
        // Draw Main Cabinet grounding shadow
        ctx.fillStyle = 'rgba(27, 19, 14, 0.45)';
        ctx.fillRect(850, 532, 220, 14);
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
        // Draw Second Cabinet grounding shadow
        ctx.fillStyle = 'rgba(27, 19, 14, 0.45)';
        ctx.fillRect(1460, 480, 120, 10);
        // Draw Second Cabinet (Y=310, bottom Y=486)
        drawSprite(ctx, secondCabinetSprite, secondCabinetColorMap, 1460, 310, pixelScale);
      }
    },
    {
      y: 486,
      draw: () => {
        // Draw Potted Plant grounding shadow
        ctx.fillStyle = 'rgba(27, 19, 14, 0.45)';
        ctx.beginPath();
        ctx.ellipse(1650, 482, 48, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Draw Potted Plant beside Second Cabinet (bottom Y=486, size 120x156)
        if (pottedPlantImage.complete) {
          ctx.drawImage(pottedPlantImage, 1590, 330, 120, 156);
        }
      }
    },
    {
      y: 838,
      draw: () => {
        // Draw Worktable grounding shadow (shifted down 100px)
        ctx.fillStyle = 'rgba(27, 19, 14, 0.45)';
        ctx.beginPath();
        ctx.ellipse(958, 832, 120, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // Draw Worktable (Y=710, bottom Y=838 - shifted down 100px)
        drawSprite(ctx, worktableSprite, worktableColorMap, 830, 710, pixelScale);
      }
    },
    {
      y: player.baseY + player.renderHeight,
      draw: () => {
        // Draw Player Shadow on ground
        const workroomShadowScale = Math.max(0.4, 1 - Math.abs(player.jumpOffset) / 350);
        ctx.fillStyle = 'rgba(27, 19, 14, 0.45)';
        ctx.beginPath();
        ctx.ellipse(player.x + player.renderWidth / 2, player.baseY + player.renderHeight, (player.renderWidth / 2) * workroomShadowScale, 10 * workroomShadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        // Draw Player
        drawPlayerImage(ctx, player.x, player.y);
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

  // 1. Draw glowing lights (screen mode)
  ctx.globalCompositeOperation = 'screen';

  // Define workroom glowing lights:
  const glows = [
    { x: 216, y: 200, r: 100, color: 'rgba(244, 192, 94, 0.45)' },   // Lantern 1
    { x: 1386, y: 150, r: 100, color: 'rgba(244, 192, 94, 0.45)' },  // Lantern 2
    { x: 1223, y: 270, r: 55, color: 'rgba(244, 192, 94, 0.45)' },   // Candle 1 on Shelf C2
    { x: 1538, y: 250, r: 55, color: 'rgba(244, 192, 94, 0.45)' },   // Candle 2 on Cabinet
    { x: 360, y: 430, r: 160, color: 'rgba(220, 70, 50, 0.45)' }     // Stove furnace red/orange glow
  ];

  glows.forEach((src, idx) => {
    const t_i = t + idx * 1.3;
    const flicker = 0.94 + 0.06 * Math.sin(t_i * 3.1) + 0.02 * Math.cos(t_i * 8.2);
    const radius = src.r * flicker;

    const grad = ctx.createRadialGradient(src.x, src.y, 0, src.x, src.y, radius);
    grad.addColorStop(0, src.color);
    grad.addColorStop(0.35, src.color.replace(/[\d\.]+\)$/, '0.15)'));
    grad.addColorStop(1, 'rgba(244, 192, 94, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(src.x, src.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalCompositeOperation = 'source-over';

  // 2. Cinematic Vignette (multiply mode to darken borders in a warm sepia tone)
  ctx.globalCompositeOperation = 'multiply';
  const vignetteGrad = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 3,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 1.15
  );
  vignetteGrad.addColorStop(0, '#ffffff'); // Center unchanged
  vignetteGrad.addColorStop(1, '#A09085'); // Edges darkened warmly
  ctx.fillStyle = vignetteGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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
  ctx.fillText(titleText, CANVAS_WIDTH / 2, 40);

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
    ctx.fillRect(jarX - labelW / 2, ly, labelW, labelH);
    ctx.strokeRect(jarX - labelW / 2, ly, labelW, labelH);

    ctx.fillStyle = '#4A3B32';
    ctx.font = 'bold 20px "EB Garamond", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(list[i].name, jarX, ly + labelH / 2);

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

const slotSize = 80;
const slotSpacing = 16;
const hotbarY = 920;

// Drag and drop state variables
let draggedItemIndex = null;
let draggedItemX = 0;
let draggedItemY = 0;

function drawInventoryItem(ctx, name, x, y, scale) {
  const ing = ingredients.find(i => i.name === name);
  if (ing) {
    drawCabinetJar(ctx, ing, x, y, scale);
    return;
  }
  const b = bottles.find(i => i.name === name);
  if (b) {
    drawCabinetJar(ctx, b, x, y, scale);
    return;
  }
  if (name === "Willow Bark Mixture") {
    // Draw full copper basin with mixture
    if (copperBowlFullImage && copperBowlFullImage.complete) {
      const w = 68;
      const h = 68 * (360 / 693);
      ctx.drawImage(copperBowlFullImage, x - w / 2, y - h / 2, w, h);
    } else {
      ctx.fillStyle = '#1B130E';
      ctx.fillRect(x - 22, y - 8, 44, 22);
      ctx.fillStyle = '#B57F4F';
      ctx.fillRect(x - 20, y - 6, 40, 18);
      ctx.fillStyle = '#D9C1A0';
      ctx.fillRect(x - 18, y - 4, 36, 3);
      ctx.fillStyle = '#8A3B2B'; // reddish brown ground mixture
      ctx.fillRect(x - 14, y - 1, 28, 11);
      ctx.fillStyle = '#B05535';
      ctx.fillRect(x - 10, y + 1, 20, 7);
    }
    return;
  }
  if (name === "Willow Bark Decoction") {
    drawFlask(ctx, 'red', x - 44, y - 44);
  }
}

function drawInventoryHotbar() {
  // Wooden plank backer (holds 1 row, height 120px, width 984px centered)
  ctx.fillStyle = '#8C6239';
  ctx.fillRect(468, hotbarY, 984, 120);

  ctx.strokeStyle = '#1d1511';
  ctx.lineWidth = 6;
  ctx.strokeRect(468, hotbarY, 984, 120);

  ctx.fillStyle = '#C89A6A';
  ctx.fillRect(468, hotbarY + 2, 984, 4);

  // Draw 10 slots
  for (let i = 0; i < 10; i++) {
    const slotX = 488 + i * (slotSize + slotSpacing);
    const slotY = hotbarY + 20;

    // Slot frame
    ctx.fillStyle = '#4A2E1B';
    ctx.fillRect(slotX, slotY, slotSize, slotSize);

    ctx.strokeStyle = '#1d1511';
    ctx.lineWidth = 4;
    ctx.strokeRect(slotX, slotY, slotSize, slotSize);

    // Draw item in slot if exists, and not currently being dragged
    if (i < inventory.length) {
      if (draggedItemIndex !== i) {
        drawInventoryItem(ctx, inventory[i], slotX + slotSize / 2, slotY + slotSize / 2, 4);
      }
    }
  }
}

function drawActiveAnimations() {
  activeAnimations.forEach(anim => {
    if (anim.type === 'collect_slide') {
      const scale = 8 - 4 * anim.progress;
      drawInventoryItem(ctx, anim.itemName, anim.x, anim.y, scale);
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
      "Collect ingredients",
      "Crush ingredients using mortar pestel on working table",
      "Transfer to copper basin",
      "Boil mixture on stove",
      "Deliver to customer"
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

  if (currentCustomerState === CustomerState.STEPS) {
    hasOpenedBookInStepsState = true;
  }

  renderBookPage();
}

function closeBookView() {
  currentState = GameState.GAMEPLAY;
  document.getElementById('book-ui').classList.add('hidden');
}

function checkIngredientsCollected() {
  if (currentCustomerState !== CustomerState.INGREDIENTS) return;

  const targetPage = ailmentToRecipePage[activeAilmentType];
  const recipeIngredientsMap = {
    1: ["Willow Bark", "Water"],
    2: ["Beeswax", "Fats", "Herbal Extract"],
    3: ["Tulsi", "Ginger", "Black Pepper", "Jaggery", "Honey"]
  };

  const reqList = recipeIngredientsMap[targetPage];
  if (!reqList) return;

  const allPresent = reqList.every(ingName => inventory.includes(ingName));
  if (allPresent) {
    currentCustomerState = CustomerState.STEPS;
    updateObjective();
    hasOpenedBookInStepsState = false;
  }
}

function renderBookPage() {
  const recipe = recipes[activeRecipePage];
  const isAcquired = acquiredRecipes.includes(activeRecipePage);
  const targetPage = ailmentToRecipePage[activeAilmentType];

  // Highlight active page in Left Page Index
  document.querySelectorAll('.recipe-index .index-item').forEach(item => {
    const pageNum = parseInt(item.getAttribute('data-page'));
    if (pageNum === activeRecipePage) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }

    // Page lookup indicator (STATE 2)
    if (currentCustomerState === CustomerState.LOOKUP && pageNum === targetPage) {
      item.classList.add('lookup-indicator');
    } else {
      item.classList.remove('lookup-indicator');
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

  // Helper to check if a recipe ingredient is in the player's inventory
  function isIngredientInInventory(recipeIngString) {
    const normalized = recipeIngString.toLowerCase();
    if (normalized.includes("willow bark") && inventory.includes("Willow Bark")) return true;
    if (normalized.includes("water") && inventory.includes("Water")) return true;
    if (normalized.includes("beeswax") && inventory.includes("Beeswax")) return true;
    if (normalized.includes("fat") && inventory.includes("Fats")) return true;
    if (normalized.includes("herbal extract") && inventory.includes("Herbal Extract")) return true;
    if (normalized.includes("tulsi") && inventory.includes("Tulsi")) return true;
    if (normalized.includes("ginger") && inventory.includes("Ginger")) return true;
    if (normalized.includes("long pepper") || normalized.includes("pippali") || normalized.includes("black pepper")) {
      if (inventory.includes("Black Pepper")) return true;
    }
    if (normalized.includes("jaggery") && inventory.includes("Jaggery")) return true;
    if (normalized.includes("honey") && inventory.includes("Honey")) return true;
    return false;
  }

  // Right Page HTML content
  const container = document.getElementById('right-page-content');
  container.innerHTML = `
    <div class="recipe-header">
      <h3 class="recipe-usage">${recipe.usage}</h3>
      <div class="recipe-title-row" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
        <h2 class="recipe-title" style="margin: 0; font-size: 2.2rem;">${recipe.title}</h2>
        <button id="lets-make-btn" class="lets-make-btn small-btn ${isAcquired ? 'unacquire' : ''}">
          ${isAcquired ? 'Unacquire' : "Acquire"}
        </button>
      </div>
      <div class="book-divider" style="margin: 10px 0 15px;"></div>
    </div>
    
    <h4 class="recipe-section-title">Ingredients</h4>
    <ul class="recipe-ingredients-list">
      ${recipe.ingredients.map(ing => {
    const isPresent = isIngredientInInventory(ing);
    return `<li style="display: flex; align-items: center; gap: 8px;">${ing} ${isPresent ? '<span class="ing-check" style="font-size: 1.2rem;">✅</span>' : ''}</li>`;
  }).join('')}
    </ul>
    
    <h4 class="recipe-section-title">Preparation Steps</h4>
    <ol class="recipe-steps-list">
      ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
    </ol>
  `;

  // Bind actions
  const letsMakeBtn = document.getElementById('lets-make-btn');
  if (letsMakeBtn) {
    letsMakeBtn.onclick = (e) => {
      e.stopPropagation();
      if (isAcquired) {
        unacquireRecipe(activeRecipePage);
      } else {
        const targetPage = ailmentToRecipePage[activeAilmentType];
        if (targetPage && activeRecipePage !== targetPage) {
          // Attempting to acquire incorrect recipe: trigger horizontal shake animation
          letsMakeBtn.classList.remove('btn-shake-incorrect');
          void letsMakeBtn.offsetWidth; // force reflow
          letsMakeBtn.classList.add('btn-shake-incorrect');
          return;
        }
        acquireRecipe(activeRecipePage);
        if (currentCustomerState === CustomerState.LOOKUP) {
          currentCustomerState = CustomerState.INGREDIENTS;
          updateObjective();
          checkIngredientsCollected();
        }
      }
    };
  }

  const unacquireLink = document.getElementById('unacquire-link');
  if (unacquireLink) {
    unacquireLink.onclick = (e) => {
      e.stopPropagation();
      unacquireRecipe(activeRecipePage);
    };
  }
}

function acquireRecipe(page) {
  const pageNum = parseInt(page);
  const targetPage = ailmentToRecipePage[activeAilmentType];
  if (targetPage && pageNum !== targetPage) {
    return;
  }
  // Only one recipe can be acquired at a time
  acquiredRecipes = [pageNum];
  renderBookPage();
  renderAcquiredRecipes();
  if (document.getElementById('manuscript-ui') && !document.getElementById('manuscript-ui').classList.contains('hidden')) {
    renderManuscriptPage();
  }
}

function unacquireRecipe(page) {
  acquiredRecipes = [];
  renderBookPage();
  renderAcquiredRecipes();
  if (document.getElementById('manuscript-ui') && !document.getElementById('manuscript-ui').classList.contains('hidden')) {
    closeManuscriptView();
  }
}

function renderAcquiredRecipes() {
  const panel = document.getElementById('acquired-recipes-container');
  if (!panel) return;
  panel.innerHTML = '';
  if (acquiredRecipes.length === 0) return;

  acquiredRecipes.forEach(page => {
    const recipe = recipes[page];
    if (!recipe) return;
    const badge = document.createElement('div');
    badge.className = 'acquired-recipe-badge';
    badge.setAttribute('data-tooltip', recipe.title);

    // Roman Numeral corresponding to volume / page number
    const romanNumerals = { 1: "I", 2: "II", 3: "III" };
    const roman = romanNumerals[page] || page;

    // Crisp book SVG icon with Roman volume numeral (no emojis)
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

function openManuscriptView(page = 1) {
  currentState = GameState.BOOK;
  activeRecipePage = parseInt(page) || 1;
  interactionPrompt.classList.add('hidden');
  document.getElementById('manuscript-ui').classList.remove('hidden');
  renderManuscriptPage();
}

function closeManuscriptView() {
  currentState = GameState.GAMEPLAY;
  document.getElementById('manuscript-ui').classList.add('hidden');
}

function renderManuscriptPage() {
  const pageNum = parseInt(activeRecipePage) || 1;
  const recipe = recipes[pageNum] || recipes[1];
  const isAcquired = acquiredRecipes.includes(pageNum);

  const container = document.getElementById('manuscript-page-content');
  if (!container) return;

  function isIngredientInInventory(recipeIngString) {
    const normalized = recipeIngString.toLowerCase();
    if (normalized.includes("willow bark") && inventory.includes("Willow Bark")) return true;
    if (normalized.includes("water") && inventory.includes("Water")) return true;
    if (normalized.includes("beeswax") && inventory.includes("Beeswax")) return true;
    if (normalized.includes("fat") && inventory.includes("Fats")) return true;
    if (normalized.includes("herbal extract") && inventory.includes("Herbal Extract")) return true;
    if (normalized.includes("tulsi") && inventory.includes("Tulsi")) return true;
    if (normalized.includes("ginger") && inventory.includes("Ginger")) return true;
    if (normalized.includes("long pepper") || normalized.includes("pippali") || normalized.includes("black pepper")) {
      if (inventory.includes("Black Pepper")) return true;
    }
    if (normalized.includes("jaggery") && inventory.includes("Jaggery")) return true;
    if (normalized.includes("honey") && inventory.includes("Honey")) return true;
    return false;
  }

  container.innerHTML = `
    <div class="recipe-header">
      <h3 class="recipe-usage">${recipe.usage}</h3>
      <div class="recipe-title-row" style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
        <h2 class="recipe-title" style="margin: 0; font-size: 2.4rem;">${recipe.title}</h2>
      </div>
      <div class="book-divider" style="background: #c2b59b; margin: 15px 0 20px;"></div>
    </div>
    
    <h4 class="recipe-section-title">Ingredients</h4>
    <ul class="recipe-ingredients-list">
      ${recipe.ingredients.map(ing => {
    const isPresent = isIngredientInInventory(ing);
    return `<li style="display: flex; align-items: center; gap: 8px;">${ing} ${isPresent ? '<span class="ing-check" style="font-size: 1.2rem;">✅</span>' : ''}</li>`;
  }).join('')}
    </ul>
    
    <h4 class="recipe-section-title">Preparation Steps</h4>
    <ol class="recipe-steps-list">
      ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
    </ol>
    
    ${isAcquired ? `
    <div class="lets-make-container" style="padding-top: 25px; margin-top: auto;">
      <button id="manuscript-unacquire-link" class="unacquire-link">Unacquire recipe</button>
    </div>
    ` : ''}
  `;

  // Bind unacquire action
  const unacquireLink = document.getElementById('manuscript-unacquire-link');
  if (unacquireLink) {
    unacquireLink.onclick = (e) => {
      e.stopPropagation();
      unacquireRecipe(pageNum);
    };
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

  // Manuscript close listeners
  const manuscriptCloseBtn = document.getElementById('manuscript-close-btn');
  if (manuscriptCloseBtn) {
    manuscriptCloseBtn.addEventListener('click', closeManuscriptView);
  }
  const manuscriptOverlayBg = document.querySelector('#manuscript-ui .book-overlay-bg');
  if (manuscriptOverlayBg) {
    manuscriptOverlayBg.addEventListener('click', closeManuscriptView);
  }

  // Dialogue click / tap listeners
  if (dialogueUI) {
    dialogueUI.addEventListener('click', advanceDialogue);
    dialogueUI.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      advanceDialogue();
    });
  }
}

// Initialize book events on load
initBookUIEvents();

requestAnimationFrame((time) => {
  lastTime = time;
  requestAnimationFrame(gameLoop);
});
