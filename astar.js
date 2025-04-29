// A* algorithm
function astar(graph, start, end, maxDistance = Infinity, waypoints = [], speed = 60) {
  const openSet = new Set([start]);
  const cameFrom = {};
  const gScore = {}, fScore = {};

  for (let node in graph.coordinates) {
    gScore[node] = Infinity;
    fScore[node] = Infinity;
  }
  gScore[start] = 0;
  fScore[start] = heuristic(graph.coordinates[start], graph.coordinates[end]);

  while (openSet.size > 0) {
    let current = [...openSet].reduce((a, b) => fScore[a] < fScore[b] ? a : b);

    if (current === end && waypoints.every(wp => cameFrom[wp])) {
      const path = reconstructPath(cameFrom, current);
      const distance = computeDistance(graph, path);
      const time = (distance / speed) * 60;
      return { path, distance, time };
    }

    openSet.delete(current);

    for (let neighborObj of graph.edges[current] || []) {
      const neighbor = neighborObj.node;
      const tentativeG = gScore[current] + neighborObj.weight;

      if (tentativeG < gScore[neighbor]) {
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentativeG;
        fScore[neighbor] = gScore[neighbor] + heuristic(graph.coordinates[neighbor], graph.coordinates[end]);
        openSet.add(neighbor);
      }
    }
  }

  return { path: [], distance: 0, time: 0 };
}

// Heuristic function (Haversine formula)
function heuristic(coord1, coord2) {
  const [lat1, lng1] = coord1, [lat2, lng2] = coord2;
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Reconstruct the path from the end node
function reconstructPath(cameFrom, current) {
  const totalPath = [current];
  while (current in cameFrom) {
    current = cameFrom[current];
    totalPath.unshift(current);
  }
  return totalPath;
}

// Calculate the total distance of the path
function computeDistance(graph, path) {
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const node1 = path[i], node2 = path[i + 1];
    const edge = graph.edges[node1].find(e => e.node === node2);
    totalDistance += edge ? edge.weight : 0;
  }
  return totalDistance;
}
