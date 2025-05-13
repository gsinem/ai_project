// Initialize variables
let map, graph, coordinates, landmarks;
let startMarker = null;
let endMarker = null;
let pathLine = null;
let startNode = null;
let endNode = null;
let landmarkMarkers = {};
let routingControl = null;
let selectedAlgorithm = 'dijkstra';
let tempNodeCoordinates = null;
let graphModified = false;

// Custom marker icons
const startIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #2ecc71; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [20, 20]
});

const endIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #e74c3c; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [20, 20]
});

const nodeIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #95a5a6; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [15, 15]
});

const landmarkIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #f1c40f; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [15, 15]
});

// Initialize the application
async function initializeApp() {
    try {
        const response = await fetch('graph-data.json');
        const data = await response.json();
        graph = convertGraphData(data);
        coordinates = data.coordinates;
        landmarks = data.landmarks;
        
        populateNodeDropdowns(data.nodes, data.landmarks);
        initializeMap();
        addNodesToMap();
        addLandmarksToMap();
        setupEventListeners();
    } catch (error) {
        console.error('Error loading graph data:', error);
    }
}

// Populate start and end dropdowns with node and landmark names
function populateNodeDropdowns(nodes = [], landmarks = {}) {
    const startSelect = document.getElementById('start-select');
    const endSelect = document.getElementById('end-select');
    
    if (!startSelect || !endSelect) return;
    
    startSelect.innerHTML = '';
    endSelect.innerHTML = '';
    
    // Get all nodes from the graph if nodes array is empty
    if (nodes.length === 0 && graph) {
        nodes = Object.keys(graph);
    }
    
    nodes.forEach(node => {
        const label = landmarks && landmarks[node] ? `${node} - ${landmarks[node]}` : node;
        const option1 = document.createElement('option');
        option1.value = node;
        option1.textContent = label;
        const option2 = document.createElement('option');
        option2.value = node;
        option2.textContent = label;
        startSelect.appendChild(option1);
        endSelect.appendChild(option2);
    });
    
    // Otomatik olarak ilk değerleri ata
    if (nodes.length > 0) {
        startNode = startSelect.value;
        endNode = endSelect.value;
        updateNodeDisplay();
    }
}

// Convert graph data to the format needed by the algorithms
function convertGraphData(data) {
    const convertedGraph = {};
    
    for (const node in data.edges) {
        convertedGraph[node] = {};
        data.edges[node].forEach(edge => {
            convertedGraph[node][edge.node] = edge.weight;
        });
    }
    
    return convertedGraph;
}

// Initialize the map
function initializeMap() {
    map = L.map('map').setView([41.0082, 28.9784], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Add nodes to map
function addNodesToMap() {
    // Initialize nodeMarkers if it doesn't exist
    if (!window.nodeMarkers) {
        window.nodeMarkers = {};
    }

    // Clear existing markers
    for (const nodeId in window.nodeMarkers) {
        if (window.nodeMarkers[nodeId]) {
            map.removeLayer(window.nodeMarkers[nodeId]);
        }
    }
    window.nodeMarkers = {};

    // Add new markers
    for (const node in coordinates) {
        const [lat, lng] = coordinates[node];
        const marker = L.marker([lat, lng], { 
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: #3498db; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">${node}</div>`,
                iconSize: [20, 20]
            })
        })
        .bindPopup(createNodePopup(node))
        .addTo(map);
            
        marker.on('click', () => handleNodeClick(node, marker));
        window.nodeMarkers[node] = marker;
    }
}

// Create node popup content
function createNodePopup(node) {
    return `
        <div class="landmark-popup">
            <h3>Node ${node}</h3>
            <p>Coordinates: ${coordinates[node][0].toFixed(4)}, ${coordinates[node][1].toFixed(4)}</p>
            <p>Click to select as start/end point</p>
        </div>
    `;
}

// Handle node click
function handleNodeClick(node, marker) {
    if (!startNode) {
        startNode = node;
        startMarker = marker;
        marker.setIcon(startIcon);
        updateNodeDisplay();
    } else if (!endNode) {
        endNode = node;
        endMarker = marker;
        marker.setIcon(endIcon);
        updateNodeDisplay();
    }
}

// Update node display in UI
function updateNodeDisplay() {
    const startSelect = document.getElementById('start-select');
    const endSelect = document.getElementById('end-select');
    
    if (startSelect) {
        startSelect.value = startNode || '';
    }
    if (endSelect) {
        endSelect.value = endNode || '';
    }
}

// Add landmarks to map
function addLandmarksToMap() {
    for (const node in landmarks) {
        const [lat, lng] = coordinates[node];
        landmarkMarkers[node] = L.marker([lat, lng], { icon: landmarkIcon })
            .bindPopup(createLandmarkPopup(node))
            .addTo(map);
    }
}

// Create landmark popup content
function createLandmarkPopup(node) {
    return `
        <div class="landmark-popup">
            <h3>${landmarks[node]}</h3>
            <p>Node: ${node}</p>
        </div>
    `;
}

// Setup event listeners
function setupEventListeners() {
    const findPathBtn = document.getElementById('find-path');
    const clearMapBtn = document.getElementById('clear-map');
    const showAlternativesBtn = document.getElementById('show-alternatives');
    const showLandmarksBtn = document.getElementById('show-landmarks');
    const compareAlgorithmsBtn = document.getElementById('compare-algorithms');
    const dijkstraBtn = document.getElementById('dijkstra-btn');
    const astarBtn = document.getElementById('astar-btn');
    const osrmBtn = document.getElementById('osrm-btn');
    const startSelect = document.getElementById('start-select');
    const endSelect = document.getElementById('end-select');
    const addNodeBtn = document.getElementById('add-node');
    const addEdgeBtn = document.getElementById('add-edge');
    const removeElementBtn = document.getElementById('remove-element-btn');
    const addByClickBtn = document.getElementById('add-by-click');

    if (findPathBtn) findPathBtn.addEventListener('click', handleFindPath);
    if (clearMapBtn) clearMapBtn.addEventListener('click', handleClearMap);
    if (showAlternativesBtn) showAlternativesBtn.addEventListener('click', handleShowAlternatives);
    if (showLandmarksBtn) showLandmarksBtn.addEventListener('click', handleShowLandmarks);
    if (compareAlgorithmsBtn) compareAlgorithmsBtn.addEventListener('click', handleCompareAlgorithms);
    if (dijkstraBtn) dijkstraBtn.addEventListener('click', () => selectAlgorithm('dijkstra'));
    if (astarBtn) astarBtn.addEventListener('click', () => selectAlgorithm('astar'));
    if (osrmBtn) osrmBtn.addEventListener('click', () => selectAlgorithm('osrm'));
    
    if (startSelect) {
        startSelect.addEventListener('change', function() {
            startNode = this.value;
            updateNodeDisplay();
        });
    }
    
    if (endSelect) {
        endSelect.addEventListener('change', function() {
            endNode = this.value;
            updateNodeDisplay();
        });
    }

    // Graph editor event listeners
    if (addNodeBtn) addNodeBtn.addEventListener('click', addNewNode);
    if (addEdgeBtn) addEdgeBtn.addEventListener('click', addOrUpdateEdge);
    if (removeElementBtn) removeElementBtn.addEventListener('click', removeElement);
    if (addByClickBtn) addByClickBtn.addEventListener('click', toggleAddByClick);
}

function handleFindPath() {
    calculatePath();
}
function handleClearMap() {
    clearPath();
}
function handleEditGraph() {
    alert('Graph editing is not implemented yet.');
}
function handleShowAlternatives() {
    alert('Alternative path feature is not implemented yet.');
}
function handleShowLandmarks() {
    alert('Landmark highlighting is not implemented yet.');
}
function handleCompareAlgorithms() {
    alert('Algorithm comparison is not implemented yet.');
}
function selectAlgorithm(algo) {
    document.querySelectorAll('.alg-btn').forEach(btn => btn.classList.remove('active'));
    if (algo === 'dijkstra') document.getElementById('dijkstra-btn').classList.add('active');
    if (algo === 'astar') document.getElementById('astar-btn').classList.add('active');
    if (algo === 'osrm') document.getElementById('osrm-btn').classList.add('active');
    selectedAlgorithm = algo;
}

// Calculate path based on selected algorithm
function calculatePath() {
    if (!startNode || !endNode) {
        alert('Please select both start and end points');
        return;
    }
    const algorithm = selectedAlgorithm;
    const profile = 'driving';

    if (algorithm === 'osrm') {
        setAlgoInfo('Real Roads (OSRM)', '-');
        calculateOSRMRoute(profile);
    } else {
        let path, compTime;
        if (algorithm === 'dijkstra') {
            setAlgoInfo('Dijkstra');
            const dijkstra = new Dijkstra(graph);
            
            // Run multiple times to get average computation time
            const iterations = 5;
            let totalTime = 0;
            
            for (let i = 0; i < iterations; i++) {
                const t1 = performance.now();
                const result = dijkstra.findShortestPath(startNode, endNode);
                totalTime += performance.now() - t1;
                if (i === 0) { // Keep the first result
                    path = result.path;
                }
            }
            
            compTime = (totalTime / iterations).toFixed(2);
            
            // Show route information
            const distance = dijkstra.findShortestPath(startNode, endNode).distance;
            const timeInMinutes = Math.round((distance * 1.5) / 50 * 60);
            const routeInfo = document.getElementById('route-info');
            routeInfo.style.display = 'block';
            document.getElementById('distance').textContent = distance.toFixed(2);
            document.getElementById('total-time').textContent = timeInMinutes;
            document.getElementById('comp-time').textContent = compTime + ' ms';
        } else {
            setAlgoInfo('A*');
            const astar = new AStar(graph, coordinates);
            
            // Run multiple times to get average computation time
            const iterations = 5;
            let totalTime = 0;
            let firstPath = null;
            
            for (let i = 0; i < iterations; i++) {
                const t1 = performance.now();
                const result = astar.findPath(startNode, endNode);
                totalTime += performance.now() - t1;
                if (i === 0) { // Keep the first result
                    firstPath = result;
                }
            }
            
            compTime = (totalTime / iterations).toFixed(2);
            path = firstPath;
            
            if (path) {
                const distance = calculatePathDistance(path);
                const timeInMinutes = Math.round((distance * 1.5) / 50 * 60);
                const routeInfo = document.getElementById('route-info');
                routeInfo.style.display = 'block';
                document.getElementById('distance').textContent = distance.toFixed(2);
                document.getElementById('total-time').textContent = timeInMinutes;
                document.getElementById('comp-time').textContent = compTime + ' ms';
            }
        }
        if (path) {
            displayPath(path, algorithm);
            displaySteps(path);
        }
    }
}

// Calculate route using OSRM
function calculateOSRMRoute(profile) {
    if (routingControl) {
        map.removeControl(routingControl);
    }
    
    const startCoords = coordinates[startNode];
    const endCoords = coordinates[endNode];
    
    const t1 = performance.now();
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(startCoords[0], startCoords[1]),
            L.latLng(endCoords[0], endCoords[1])
        ],
        routeWhileDragging: true,
        router: L.Routing.osrmv1({
            profile: profile
        }),
        createMarker: function() { return null; }
    }).addTo(map);
    
    routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        if (routes && routes.length > 0) {
            const route = routes[0];
            const summary = route.summary;
            const compTime = (performance.now() - t1).toFixed(2);
            
            // Show route information
            const routeInfo = document.getElementById('route-info');
            routeInfo.style.display = 'block';
            const distance = (summary.totalDistance / 1000).toFixed(2);
            const timeInMinutes = Math.round(summary.totalTime / 60);
            
            document.getElementById('distance').textContent = distance;
            document.getElementById('total-time').textContent = timeInMinutes;
            document.getElementById('comp-time').textContent = compTime + ' ms';
            
            // Show steps
            const stepsContainer = document.getElementById('steps');
            stepsContainer.innerHTML = '';
            
            route.instructions.forEach((instruction, index) => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'step-item';
                const stepDistance = (instruction.distance / 1000).toFixed(2);
                const stepTime = Math.round(instruction.time / 60);
                stepDiv.innerHTML = `
                    <strong>Step ${index + 1}:</strong> ${instruction.text}<br>
                    <small>Distance: ${stepDistance} km (Est. Time: ${stepTime} min)</small>
                `;
                stepsContainer.appendChild(stepDiv);
            });
        }
    });
}

// Calculate total distance of path
function calculatePathDistance(path) {
    let distance = 0;
    for (let i = 0; i < path.length - 1; i++) {
        distance += graph[path[i]][path[i + 1]];
    }
    return distance;
}

// Display path on map
function displayPath(path, algorithm) {
    if (pathLine) {
        map.removeLayer(pathLine);
    }
    const pathCoordinates = path.map(node => coordinates[node]);
    pathLine = L.polyline(pathCoordinates, {
        color: algorithm === 'osrm' ? '#ff9800' : '#232323',
        weight: 5,
        opacity: 0.9
    }).addTo(map);
    map.fitBounds(pathLine.getBounds());
}

// Display route steps
function displaySteps(path) {
    const stepsContainer = document.getElementById('steps');
    if (!stepsContainer) return;
    stepsContainer.innerHTML = '';
    
    for (let i = 0; i < path.length - 1; i++) {
        const current = path[i];
        const next = path[i + 1];
        const distance = graph[current][next];
        // Calculate time based on real road conditions
        const timeInMinutes = Math.round((distance * 1.5) / 50 * 60); // Adding 50% more time for traffic and road conditions
        
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step-item';
        stepDiv.innerHTML = `
            <strong>Step ${i + 1}:</strong> From ${landmarks[current] || `Node ${current}`} to ${landmarks[next] || `Node ${next}`}<br>
            <small>Distance: ${distance.toFixed(2)} km (Est. Time: ${timeInMinutes} min)</small>
        `;
        stepsContainer.appendChild(stepDiv);
    }
}

// Update information panel
function updateInfo(distance, compTime) {
    const distSpan = document.getElementById('distance');
    if (distSpan) {
        distSpan.classList.add('highlight');
        setTimeout(() => distSpan.classList.remove('highlight'), 500);
        distSpan.textContent = distance.toFixed(2);
    }
    const timeInHours = distance / 50;
    const timeInMinutes = Math.round(timeInHours * 60);
    const timeSpan = document.getElementById('time');
    if (timeSpan) {
        timeSpan.classList.add('highlight');
        setTimeout(() => timeSpan.classList.remove('highlight'), 500);
        timeSpan.textContent = timeInMinutes;
    }
    const speedSpan = document.getElementById('speed');
    if (speedSpan) {
        speedSpan.classList.add('highlight');
        setTimeout(() => speedSpan.classList.remove('highlight'), 500);
        speedSpan.textContent = '50.0';
    }
    if (compTime !== undefined) {
        const compTimeSpan = document.getElementById('comp-time');
        if (compTimeSpan) {
            compTimeSpan.classList.add('highlight');
            setTimeout(() => compTimeSpan.classList.remove('highlight'), 500);
            compTimeSpan.textContent = compTime.toFixed(2);
        }
    }
}

// Clear path and reset
function clearPath() {
    // Clear markers
    if (startMarker) {
        startMarker.setIcon(nodeIcon);
        startMarker = null;
    }
    if (endMarker) {
        endMarker.setIcon(nodeIcon);
        endMarker = null;
    }
    
    // Clear path line
    if (pathLine) {
        map.removeLayer(pathLine);
        pathLine = null;
    }
    
    // Clear routing control
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
    
    // Reset node selections
    startNode = null;
    endNode = null;
    
    // Update UI
    updateNodeDisplay();
    
    // Clear route information
    const routeInfo = document.getElementById('route-info');
    if (routeInfo) {
        routeInfo.style.display = 'none';
    }
    
    // Clear route stats
    const elements = {
        'distance': '0',
        'total-time': '0',
        'comp-time': '0',
        'algo-name': '-'
    };
    
    for (const [id, defaultValue] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = defaultValue;
        }
    }
    
    // Clear steps
    const stepsContainer = document.getElementById('steps');
    if (stepsContainer) {
        stepsContainer.innerHTML = '';
    }
}

function setAlgoInfo(name, compTime) {
    const algoNameElement = document.getElementById('algo-name');
    const compTimeElement = document.getElementById('comp-time');
    
    if (algoNameElement) {
        algoNameElement.textContent = name;
    }
    
    if (compTimeElement && compTime !== undefined) {
        compTimeElement.textContent = typeof compTime === 'string' ? compTime : compTime.toFixed(2) + ' ms';
    }
}

// Initialize the application
initializeApp();

// Panel toggles and dynamic UI
window.addEventListener('DOMContentLoaded', () => {
    const routePanel = document.getElementById('route-info-panel');
    const toggleBtn = document.getElementById('toggle-route-info');
    if (toggleBtn && routePanel) {
        toggleBtn.onclick = () => {
            routePanel.classList.toggle('closed');
        };
    }
    const toggleStepsBtn = document.getElementById('toggle-steps');
    const stepsDiv = document.getElementById('steps');
    if (toggleStepsBtn && stepsDiv) {
        toggleStepsBtn.onclick = () => {
            stepsDiv.classList.toggle('hidden');
        };
    }
});

let lastHighlightedStep = null;

// Toggle add node by click mode
function toggleAddByClick() {
    const btn = document.getElementById('add-by-click');
    const locationInputs = document.getElementById('location-inputs');
    
    if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        btn.textContent = 'Add by Map Click';
        locationInputs.classList.add('hidden');
        map.off('click', handleMapClick);
    } else {
        btn.classList.add('active');
        btn.textContent = 'Cancel';
        locationInputs.classList.remove('hidden');
        map.on('click', handleMapClick);
    }
}

// Handle map click for adding nodes
function handleMapClick(e) {
    tempNodeCoordinates = [e.latlng.lat, e.latlng.lng];
    document.getElementById('node-lat').value = e.latlng.lat.toFixed(6);
    document.getElementById('node-lng').value = e.latlng.lng.toFixed(6);
    
    // Show temporary marker
    if (window.tempMarker) {
        map.removeLayer(window.tempMarker);
    }
    window.tempMarker = L.marker(e.latlng, {
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #e74c3c; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconSize: [20, 20]
        })
    }).addTo(map);
}

// Add a new node to the graph
function addNewNode() {
    const nodeIdInput = document.getElementById('new-node-id');
    const nodeId = nodeIdInput.value.trim();
    
    if (!nodeId) {
        alert('Please enter a node ID.');
        return;
    }
    
    if (graph[nodeId]) {
        alert(`Node ${nodeId} already exists.`);
        return;
    }
    
    let nodeCoordinates;
    if (tempNodeCoordinates) {
        nodeCoordinates = tempNodeCoordinates;
    } else {
        const latInput = document.getElementById('node-lat');
        const lngInput = document.getElementById('node-lng');
        
        const lat = parseFloat(latInput.value);
        const lng = parseFloat(lngInput.value);
        
        if (isNaN(lat) || isNaN(lng)) {
            alert('Please enter valid coordinates or click on the map.');
            return;
        }
        
        nodeCoordinates = [lat, lng];
    }
    
    // Add node to the graph
    graph[nodeId] = {};
    coordinates[nodeId] = nodeCoordinates;
    
    // Initialize nodeMarkers if it doesn't exist
    if (!window.nodeMarkers) {
        window.nodeMarkers = {};
    }
    
    // Add marker to map
    const marker = L.marker(nodeCoordinates, {
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: #3498db; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">${nodeId}</div>`,
            iconSize: [20, 20]
        })
    })
    .bindPopup(createNodePopup(nodeId))
    .addTo(map);
    
    marker.on('click', () => handleNodeClick(nodeId, marker));
    window.nodeMarkers[nodeId] = marker;
    
    // Center map on new node
    map.setView(nodeCoordinates, 13);
    
    // Update UI
    updateEditorDropdowns();
    populateNodeDropdowns();
    
    // Reset form
    nodeIdInput.value = '';
    document.getElementById('node-lat').value = '';
    document.getElementById('node-lng').value = '';
    document.getElementById('location-inputs').classList.add('hidden');
    tempNodeCoordinates = null;
    
    // Remove temporary marker if exists
    if (window.tempMarker) {
        map.removeLayer(window.tempMarker);
        window.tempMarker = null;
    }
    
    // Deactivate add-by-click
    const addByClickBtn = document.getElementById('add-by-click');
    addByClickBtn.classList.remove('active');
    addByClickBtn.textContent = 'Add by Map Click';
    
    graphModified = true;
    
    // Show success message
    alert(`Node ${nodeId} has been added successfully.`);
}




// Update editor dropdowns
function updateEditorDropdowns() {
    const fromNode = document.getElementById('from-node');
    const toNode = document.getElementById('to-node');
    const removeElement = document.getElementById('remove-element');
    
    // Clear existing options
    fromNode.innerHTML = '';
    toNode.innerHTML = '';
    removeElement.innerHTML = '<option value="">Select element to remove</option>';
    
    // Add node options
    for (const nodeId in graph) {
        // Add to from-node and to-node dropdowns
        const option1 = document.createElement('option');
        option1.value = nodeId;
        option1.textContent = nodeId;
        fromNode.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = nodeId;
        option2.textContent = nodeId;
        toNode.appendChild(option2);
        
        // Add to remove-element dropdown
        const removeOption = document.createElement('option');
        removeOption.value = `node:${nodeId}`;
        removeOption.textContent = `Node: ${nodeId}`;
        removeElement.appendChild(removeOption);
        
        // Add edges to remove-element dropdown
        for (const targetNode in graph[nodeId]) {
            if (nodeId < targetNode) { // Only add each edge once
                const edgeOption = document.createElement('option');
                edgeOption.value = `edge:${nodeId}:${targetNode}`;
                edgeOption.textContent = `Edge: ${nodeId} - ${targetNode}`;
                removeElement.appendChild(edgeOption);
            }
        }
    }
}
