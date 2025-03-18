export class Area {
    constructor(name, container_id, gridWidth = 10, gridHeight = 10) {
        this.name = name;
        this.container = document.getElementById(container_id);
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cellWidth = 80; // pixels
        this.cellHeight = 60; // pixels

        // Set container size
        this.container.style.width = `${this.gridWidth * this.cellWidth}px`;
        this.container.style.height = `${this.gridHeight * this.cellHeight}px`;
        this.container.style.position = "relative";

        // Draw grid with linear gradients
        this.container.style.backgroundImage = `
            linear-gradient(to right, black 1px, transparent 1px),
            linear-gradient(to bottom, black 1px, transparent 1px)
        `;
        this.container.style.backgroundSize = `${this.cellWidth}px ${this.cellHeight}px`;

        this.entities = [];
        this.grid = Array.from({ length: this.gridHeight }, () =>
            Array(this.gridWidth).fill(null)
        );
    }

    addEntity(entity) {
        const x = Math.floor(entity.position.x);
        const y = Math.floor(entity.position.y);

        if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
            console.error("Entity position is out of bounds.");
            return;
        }
        if (this.grid[y][x] !== null) {
            console.error("Square is already occupied.");
            return;
        }

        this.entities.push(entity);
        entity.area = this;
        this.grid[y][x] = entity;

        const entityEl = document.createElement("div");
        entityEl.id = `entity-${entity.entity_id}`;
        entityEl.className = "entity";
        this.updateEntityPosition(entity, entityEl);
        entityEl.textContent = `${entity.name} - ${entity.health}/${entity.max_health} HP`;
        entity.dom_element = entityEl;
        this.container.appendChild(entityEl);
    }

    updateEntityPosition(entity, entityEl = null) {
        const el = entity.dom_element || entityEl;
        if (!el) return;
        const x = entity.position.x;
        const y = entity.position.y;
        el.style.left = `${x * this.cellWidth}px`;
        el.style.top = `${y * this.cellHeight}px`;
    }

    updateEntityDisplay(entity) {
        if (entity.dom_element) {
            entity.dom_element.textContent = `${entity.name} - ${Math.floor(
                entity.health
            )}/${Math.floor(entity.max_health)} HP`;
        }
    }

    removeEntity(entity) {
        this.entities = this.entities.filter((e) => e !== entity);
        if (entity.dom_element && this.container.contains(entity.dom_element)) {
            this.container.removeChild(entity.dom_element);
        }
        const x = entity.position.x;
        const y = entity.position.y;
        if (this.grid[y][x] === entity) {
            this.grid[y][x] = null;
        }
    }

    getNeighbors(x, y) {
        const neighbors = [];
        if (x > 0 && this.grid[y][x - 1] === null)
            neighbors.push({ x: x - 1, y });
        if (x < this.gridWidth - 1 && this.grid[y][x + 1] === null)
            neighbors.push({ x: x + 1, y });
        if (y > 0 && this.grid[y - 1][x] === null)
            neighbors.push({ x, y: y - 1 });
        if (y < this.gridHeight - 1 && this.grid[y + 1][x] === null)
            neighbors.push({ x, y: y + 1 });
        return neighbors;
    }

    aStar(start, end) {
        const openSet = [
            {
                x: start.x,
                y: start.y,
                g: 0,
                h: this.heuristic(start, end),
                f: this.heuristic(start, end),
                parent: null,
            },
        ];
        const closedSet = new Set();
        let bestNode = null;

        while (openSet.length > 0) {
            let current = openSet.reduce(
                (minNode, node) => (node.f < minNode.f ? node : minNode),
                openSet[0]
            );

            if (
                current.x === end.x &&
                current.y === end.y &&
                this.grid[end.y][end.x] === null
            ) {
                const path = [];
                let temp = current;
                while (temp) {
                    path.push({ x: temp.x, y: temp.y });
                    temp = temp.parent;
                }
                return path.reverse();
            }

            openSet.splice(openSet.indexOf(current), 1);
            closedSet.add(`${current.x}-${current.y}`);
            if (!bestNode || current.h < bestNode.h) {
                bestNode = current;
            }

            const neighbors = this.getNeighbors(current.x, current.y);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x}-${neighbor.y}`;
                if (closedSet.has(neighborKey)) continue;

                const tentative_g = current.g + 1;
                let neighborNode = openSet.find(
                    (node) => node.x === neighbor.x && node.y === neighbor.y
                );

                if (!neighborNode) {
                    neighborNode = {
                        x: neighbor.x,
                        y: neighbor.y,
                        g: tentative_g,
                        h: this.heuristic(neighbor, end),
                        parent: current,
                    };
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    openSet.push(neighborNode);
                } else if (tentative_g < neighborNode.g) {
                    neighborNode.g = tentative_g;
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    neighborNode.parent = current;
                }
            }
        }

        // Return path to closest node if target is unreachable
        if (bestNode) {
            const path = [];
            let temp = bestNode;
            while (temp) {
                path.push({ x: temp.x, y: temp.y });
                temp = temp.parent;
            }
            return path.reverse();
        }
        return null;
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan distance
    }
}
