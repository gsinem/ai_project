class Dijkstra {
    constructor(graph) {
        this.graph = graph;
    }

    findShortestPath(start, end) {
        const distances = {};
        const previous = {};
        const unvisited = new Set();
        
        // Initialize distances and unvisited set
        for (const node in this.graph) {
            distances[node] = Infinity;
            previous[node] = null;
            unvisited.add(node);
        }
        
        distances[start] = 0;
        
        while (unvisited.size > 0) {
            // Find the unvisited node with the smallest distance
            let current = null;
            let smallestDistance = Infinity;
            
            for (const node of unvisited) {
                if (distances[node] < smallestDistance) {
                    smallestDistance = distances[node];
                    current = node;
                }
            }
            
            if (current === null || current === end) {
                break;
            }
            
            unvisited.delete(current);
            
            // Update distances to neighbors
            for (const neighbor in this.graph[current]) {
                const distance = distances[current] + this.graph[current][neighbor];
                if (distance < distances[neighbor]) {
                    distances[neighbor] = distance;
                    previous[neighbor] = current;
                }
            }
        }
        
        // Reconstruct the path
        const path = [];
        let current = end;
        
        while (current !== null) {
            path.unshift(current);
            current = previous[current];
        }
        
        return {
            path: path,
            distance: distances[end]
        };
    }
}
