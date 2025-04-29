function dijkstra(graph, start, end, speed = 60) {
  const distances = {};
  const previous = {};
  const queue = new Set(graph.nodes);
  const steps = []; // To collect the steps (nodes visited in the correct order)

  // Initialize distances and previous nodes
  for (let node of graph.nodes) {
    distances[node] = Infinity;
    previous[node] = null;
  }

  distances[start] = 0;

  // While there are still nodes to process
  while (queue.size > 0) {
    // Get the node with the smallest distance
    const current = [...queue].reduce((a, b) =>
      distances[a] < distances[b] ? a : b
    );

    queue.delete(current);

    // If we reach the end node, stop
    if (current === end) break;

    // Visit each neighbor of the current node
    for (let neighbor of graph.edges[current]) {
      const alt = distances[current] + neighbor.weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = current;
      }
    }
  }

  // Reconstruct the path
  const path = [];
  let u = end;
  while (previous[u]) {
    path.unshift(u);
    u = previous[u];
  }

  // If a path exists, calculate distance and time
  if (u === start) {
    path.unshift(start);

    // Collect steps (nodes visited)
    for (let i = 0; i < path.length; i++) {
      steps.push(path[i]);
    }

    // Calculate total distance
    const totalDistance = distances[end];
    
    // Calculate total time, assuming speed is in km/saat and totalDistance in km
    const totalTime = (totalDistance / speed) * 60; // Time in minutes

    return { path, distance: totalDistance, time: totalTime, steps };
  } else {
    // If no path found, return empty values
    return { path: [], distance: Infinity, time: Infinity, steps: [] };
  }
}
