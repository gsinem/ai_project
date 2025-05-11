class AStar {
    constructor(graph, coordinates) {
        this.graph = graph;
        this.coordinates = coordinates;
    }

    // Calculate heuristic (Euclidean distance)
    heuristic(node1, node2) {
        const [lat1, lon1] = this.coordinates[node1];
        const [lat2, lon2] = this.coordinates[node2];
        
        // Convert to kilometers (approximate)
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    findPath(start, end) {
        const openSet = new Set([start]);
        const closedSet = new Set();
        const cameFrom = {};
        const gScore = {};
        const fScore = {};
        
        // Initialize scores
        for (const node in this.graph) {
            gScore[node] = Infinity;
            fScore[node] = Infinity;
        }
        
        gScore[start] = 0;
        fScore[start] = this.heuristic(start, end);
        
        while (openSet.size > 0) {
            // Find node with lowest fScore
            let current = null;
            let lowestFScore = Infinity;
            
            for (const node of openSet) {
                if (fScore[node] < lowestFScore) {
                    lowestFScore = fScore[node];
                    current = node;
                }
            }
            
            if (current === end) {
                return this.reconstructPath(cameFrom, current);
            }
            
            openSet.delete(current);
            closedSet.add(current);
            
            for (const neighbor in this.graph[current]) {
                if (closedSet.has(neighbor)) continue;
                
                const tentativeGScore = gScore[current] + this.graph[current][neighbor];
                
                if (!openSet.has(neighbor)) {
                    openSet.add(neighbor);
                } else if (tentativeGScore >= gScore[neighbor]) {
                    continue;
                }
                
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentativeGScore;
                fScore[neighbor] = gScore[neighbor] + this.heuristic(neighbor, end);
            }
        }
        
        return null; // No path found
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom[current]) {
            current = cameFrom[current];
            path.unshift(current);
        }
        return path;
    }
}
