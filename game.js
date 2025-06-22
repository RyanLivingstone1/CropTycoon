// === Game State ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE_SIZE = 40;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 15;

let farmGrid = [];
let money = 50;
let cropSpeedLevel = 1;
let baseGrowthTime = 10000; // 10 seconds for default crop
const cropCost = 5;
const cropSellValue = 15;
let upgradeCost = 50;
let toolLevel = 1;               // Current tool level (plants this many tiles in a square)
let toolUpgradeCost = 100;       // Cost to upgrade tool first time
const maxToolLevel = 5;          // Max tool level

function updateUI() {
    document.getElementById("money").textContent = money;
    document.getElementById("speedLevel").textContent = cropSpeedLevel;
    document.getElementById("upgradeCost").textContent = upgradeCost;
}

// === Load Image Assets ===
const images = {
    grass: new Image(),
    tilled: new Image(),
    growing: new Image(),
    ready: new Image()
};

images.grass.src = "./assets/tiles/grass.png";
images.tilled.src = "./assets/tiles/tilled.png";
images.growing.src = "./assets/crops/crop_stage1.png";
images.ready.src = "./assets/crops/crop_ready.png";

// === Load Game State if Available ===
loadGame();

// === Create Grid ===
for (let y = 0; y < GRID_HEIGHT; y++) {
    farmGrid[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
        farmGrid[y][x] = {
            planted: false,
            plantedAt: 0,
            ready: false
        };
    }
}

// === UI Elements ===
const moneyDisplay = document.getElementById("money");
const speedLevelDisplay = document.getElementById("speedLevel");
const upgradeBtn = document.getElementById("upgradeSpeedBtn");
const toolLevelDisplay = document.getElementById("toolLevel");
const upgradeToolBtn = document.getElementById("upgradeToolBtn");
// === Event Listeners ===
canvas.addEventListener("click", handleCanvasClick);
upgradeBtn.addEventListener("click", upgradeCropSpeed);
upgradeToolBtn.addEventListener("click", upgradeTool);
// === Game Loop ===
function gameLoop() {
    const now = Date.now();

    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tile = farmGrid[y][x];
            if (tile.planted && !tile.ready) {
                const timePassed = now - tile.plantedAt;
                if (timePassed >= baseGrowthTime / cropSpeedLevel) {
                    tile.ready = true;
                }
            }
        }
    }

    drawGrid();
    requestAnimationFrame(gameLoop);
}

gameLoop();

// === Handle Clicking a Tile ===
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const gridX = Math.floor(mouseX / TILE_SIZE);
    const gridY = Math.floor(mouseY / TILE_SIZE);

    if (
        gridX < 0 || gridX >= GRID_WIDTH ||
        gridY < 0 || gridY >= GRID_HEIGHT
    ) {
        return;
    }

    const radius = Math.floor(toolLevel / 2); // Defines square radius around clicked tile
    let tilesPlanted = 0;
    let totalCost = 0;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = gridX + dx;
        const y = gridY + dy;

        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) continue;

        const tile = farmGrid[y][x];

        if (!tile.planted && (money - totalCost) >= cropCost) {
          tile.planted = true;
          tile.ready = false;
          tile.plantedAt = Date.now();
          totalCost += cropCost;
          tilesPlanted++;
        }
      }
    }

    if (tilesPlanted > 0) {
      money -= totalCost;
      console.log(`Planted ${tilesPlanted} crops`);
    } else {
      // Check if any tile was ready to harvest in the clicked area
      let harvested = false;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = gridX + dx;
          const y = gridY + dy;

          if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) continue;

          const tile = farmGrid[y][x];
          if (tile.ready) {
            tile.planted = false;
            tile.ready = false;
            money += cropSellValue;
            harvested = true;
          }
        }
      }
      if (harvested) {
        console.log("Harvested crops");
      } else {
        console.log("Not enough money to plant crops with current tool or no crops to harvest");
      }
    }

    updateUI();
}

// === Crop Growth ===
function updateCrops() {
    const speedMultiplier = 1 - 0.1 * (cropSpeedLevel - 1);
    const growthTime = baseGrowthTime * speedMultiplier;

    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tile = farmGrid[y][x];
            if (tile.planted && !tile.ready) {
                if (Date.now() - tile.plantedAt >= growthTime) {
                    tile.ready = true;
                }
            }
        }
    }
}

// === Drawing the Grid ===
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tile = farmGrid[y][x];
            const posX = x * TILE_SIZE;
            const posY = y * TILE_SIZE;

            // Draw base tile
            if (tile.planted) {
                ctx.drawImage(images.tilled, posX, posY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.drawImage(images.grass, posX, posY, TILE_SIZE, TILE_SIZE);
            }

            // Draw crop on top (if any)
            if (tile.planted) {
                if (tile.ready) {
                    ctx.drawImage(images.ready, posX, posY, TILE_SIZE, TILE_SIZE);
                } else {
                    ctx.drawImage(images.growing, posX, posY, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
}

// === UI Updates ===
function updateUI() {
    moneyDisplay.textContent = money;
    speedLevelDisplay.textContent = cropSpeedLevel;
    upgradeBtn.textContent = `Upgrade Crop Speed (Cost: ${upgradeCost})`;
    toolLevelDisplay.textContent = toolLevel;
    upgradeToolBtn.textContent = `Upgrade Tool (Cost: ${toolUpgradeCost})`
     if (money < upgradeCost || (money - upgradeCost) < cropCost) {
        upgradeBtn.disabled = true;               // Disable button
        upgradeBtn.style.opacity = 0.5;           // Make button look greyed out
        upgradeBtn.style.cursor = "not-allowed";  // Change cursor to not-allowed
    } else {
        upgradeBtn.disabled = false;              // Enable button
        upgradeBtn.style.opacity = 1;             // Normal opacity
        upgradeBtn.style.cursor = "pointer";      // Normal pointer cursor
    }
      if (money < toolUpgradeCost || toolLevel >= maxToolLevel) {
      upgradeToolBtn.disabled = true;
      upgradeToolBtn.style.opacity = 0.5;
    } else {
      upgradeToolBtn.disabled = false;
      upgradeToolBtn.style.opacity = 1;
    }
}


// === Upgrade Crop Speed ===
function upgradeCropSpeed() {
    console.log("Upgrade cost is:", upgradeCost);
    console.log("Money after upgrade would be:", money - upgradeCost);
    console.log("Crop cost is:", cropCost);

    if (money >= upgradeCost && (money - upgradeCost) >= cropCost) {
        money -= upgradeCost;
        cropSpeedLevel++;
        upgradeCost = Math.floor(upgradeCost * 1.5);
        updateUI();
        console.log("Upgrade successful. New level:", cropSpeedLevel);
    } else {
        console.log("Not enough money to upgrade AND plant at least one crop.");
    }
}
function upgradeTool() {
  if (money >= toolUpgradeCost && toolLevel < maxToolLevel) {
    money -= toolUpgradeCost;
    toolLevel++;
    toolUpgradeCost = Math.floor(toolUpgradeCost * 1.5);
    updateUI();
    console.log("Tool upgraded! New level:", toolLevel);
  } else {
    console.log("Cannot upgrade tool: Not enough money or max level reached");
  }
}