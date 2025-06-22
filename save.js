console.log("save.js loaded");
function saveGame() {
    const saveData = {
        money,
        cropSpeedLevel,
        farmGrid
    };
    localStorage.setItem("cropTycoonSave", JSON.stringify(saveData));
}

function loadGame() {
    const saveData = localStorage.getItem("cropTycoonSave");
    if (saveData) {
        const data = JSON.parse(saveData);
        money = data.money || 0;
        cropSpeedLevel = data.cropSpeedLevel || 1;

        // Only proceed if saved farmGrid exists and is a proper 2D array
        if (Array.isArray(data.farmGrid)) {
            for (let y = 0; y < GRID_HEIGHT; y++) {
                for (let x = 0; x < GRID_WIDTH; x++) {
                    if (!farmGrid[y]) farmGrid[y] = [];

                    // Only copy tile data if it exists
                    const savedTile = data.farmGrid[y]?.[x];
                    if (savedTile) {
                        farmGrid[y][x] = {
                            ...farmGrid[y][x],
                            ...savedTile
                        };
                    }
                }
            }
        }
    }
}