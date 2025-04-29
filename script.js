let map;
let markers = [];
let graph;
let popups = [];
let currentPopup;
let astarPath;
let dijkstraPath;
let currentPath;
let addMode = false;
let removeMode = false;

const landmarks = [
  { name: "Cafe", coords: [51.508, -0.11] },
  { name: "Library", coords: [51.503, -0.08] },
  { name: "Museum", coords: [51.51, -0.1] }
];

fetch("graph-data.json")
  .then(res => res.json())
  .then(data => {
    graph = data;
    initMap();
    restoreSelections();
  });

function initMap() {
  map = L.map("map").setView([51.505, -0.09], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  for (let node in graph.coordinates) {
    const [lat, lng] = graph.coordinates[node];
    const marker = L.circleMarker([lat, lng], {
      radius: 6,
      color: "blue",
      fillColor: "#30f",
      fillOpacity: 0.6
    }).addTo(map).bindTooltip(node, { permanent: true, direction: "right" });

    marker.on("click", () => {
      if (!addMode && !removeMode) { 
        onNodeClick(node); 
      }
    });
  }

  landmarks.forEach(lm => {
    L.marker(lm.coords)
      .addTo(map)
      .bindPopup(`📌 ${lm.name}`);
  });
}

function onNodeClick(node) {
  if (markers.length === 2) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    if (currentPath) {
      map.removeLayer(currentPath);
      currentPath = null;
    }
  }

  const marker = L.marker(graph.coordinates[node]).addTo(map);
  markers.push(marker);

  const popup = L.popup({
    autoClose: false,
    closeOnClick: false
  })
    .setLatLng(graph.coordinates[node])
    .setContent(`Selected: ${node}`)
    .openOn(map);
  popups.push(popup);

  currentPopup = popup;

  saveSelections();

  if (markers.length >= 2) {
    setTimeout(() => {
      const nodeIds = markers.map(m => findNearestNode(m.getLatLng()));
      const start = nodeIds[0];
      const end = nodeIds[nodeIds.length - 1];
      const waypoints = nodeIds.slice(1, -1);

      const startTime = performance.now();

      const astarResult = astar(graph, start, end, 10, waypoints);
      const dijkstraResult = dijkstra(graph, start, end, 10, waypoints);

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      if (astarResult.path.length > 0 || dijkstraResult.path.length > 0) {
        drawPath(astarResult.path);
        setTimeout(() => {
          alert(
            `A* Algorithm:\nPath: ${astarResult.path.join(" ➡ ")}\nTotal Distance: ${astarResult.distance} km\nTotal Time: ${astarResult.time.toFixed(2)} minutes\n\nDijkstra Algorithm:\nPath: ${dijkstraResult.path.join(" ➡ ")}\nTotal Distance: ${dijkstraResult.distance} km\nTotal Time: ${dijkstraResult.time.toFixed(2)} minutes\n\nComputation Time: ${duration} ms`
          );
          resetMapState();
        }, 100);
        
        
        
        
      } else {
        alert("No path found!");
        resetMapState();
      }
    }, 300);
  }
}

function findNearestNode(latlng) {
  let minDist = Infinity;
  let nearest = null;

  for (let node in graph.coordinates) {
    const coord = L.latLng(graph.coordinates[node]);
    const dist = latlng.distanceTo(coord);
    if (dist < minDist) {
      minDist = dist;
      nearest = node;
    }
  }
  return nearest;
}

function drawPath(path) {
  const latlngs = path.map(node => graph.coordinates[node]);
  currentPath = L.polyline(latlngs, { color: "red", weight: 4 }).addTo(map);
}

function resetMapState() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  if (currentPath) {
    map.removeLayer(currentPath);
    currentPath = null;
  }

  popups.forEach(p => map.closePopup(p));
  popups = [];
  currentPopup = null;

  localStorage.removeItem('selectedNodes');
}

function saveSelections() {
  const selectedNodes = markers.map(m => findNearestNode(m.getLatLng()));
  localStorage.setItem('selectedNodes', JSON.stringify(selectedNodes));
}

function restoreSelections() {
  const saved = JSON.parse(localStorage.getItem('selectedNodes'));
  if (saved && saved.length > 0) {
    saved.forEach(node => {
      const marker = L.marker(graph.coordinates[node]).addTo(map);
      markers.push(marker);

      const popup = L.popup({
        autoClose: false,
        closeOnClick: false
      })
        .setLatLng(graph.coordinates[node])
        .setContent(`Selected node: ${node}`)
        .openOn(map);
      popups.push(popup);
    });

    if (saved.length >= 2) {
      drawPath(saved);
    }
  }
}

document.getElementById("clearSelectionsBtn").addEventListener("click", () => {
  resetMapState();
  alert("Selections cleared!");
});

// ADD NODE
document.getElementById("addNodeBtn").addEventListener("click", () => {
  addMode = !addMode;
  if (addMode) {
    removeMode = false;
    map.once("click", (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const nodeName = prompt("Enter new node name:");
      if (nodeName) {
        graph.coordinates[nodeName] = [lat, lng];

        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          color: "blue",
          fillColor: "#30f",
          fillOpacity: 0.6
        }).addTo(map).bindTooltip(nodeName, { permanent: true, direction: "right" });

        marker.on("click", () => {
          if (!addMode && !removeMode) {
            onNodeClick(nodeName);
          }
        });

        alert(`Node '${nodeName}' added!`);
      }
      addMode = false;
    });
  }
});

// REMOVE NODE
document.getElementById("removeNodeBtn").addEventListener("click", () => {
  removeMode = !removeMode;
  if (removeMode) {
    addMode = false;
    map.once("click", (e) => {
      let nearestNode = findNearestNode(e.latlng);
      if (nearestNode) {
        const targetLatLng = L.latLng(graph.coordinates[nearestNode]); // koordinatı kaydet
        delete graph.coordinates[nearestNode]; // grafikten sil

        map.eachLayer(layer => {
          if (layer.getLatLng && layer.getLatLng().equals(targetLatLng)) {
            map.removeLayer(layer);
          }
        });

        alert(`Node '${nearestNode}' removed!`);
      } else {
        alert("No node found near the click.");
      }
      removeMode = false;
    });
  }
});
