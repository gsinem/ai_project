#  Pathfinding Algorithms: A* vs Dijkstra Smart Route Navigator

This project implements and compares two fundamental graph search algorithms — **A\*** and **Dijkstra's Algorithm** — using an interactive **map interface**.  
Users can select start, end, and waypoint nodes directly on the map and see real-time pathfinding results along with detailed performance comparisons.


## Preview

![Project Screenshot](ai_project_ss.png)

##  Features
- **Interactive Map:** Select nodes (e.g., Cafes, Libraries, Museums).
- **A\* and Dijkstra Algorithms:** Choose between two search strategies.
- **Real-time Calculation:** Displays path, total distance, and travel time.
- **Waypoint Support:** A\* ensures waypoints are visited.
- **Performance Comparison Panel:** Highlights algorithm differences.
- **Local Storage:** Saves selections between sessions.

## 📚 Technologies Used
- HTML5, CSS3, JavaScript 
- Leaflet.js 

  

## ⚡ Algorithms Explained

### A* Algorithm
- Combines **actual cost** and **estimated cost to goal** using the **Haversine formula**.
- Optimized for **speed and efficiency** on large maps.

### Dijkstra's Algorithm
- Finds the **shortest path** without using a heuristic.
- Slower compared to A* in large graphs but always finds the optimal path.

## 📊 Performance Comparison

| Metric               | A* Algorithm  | Dijkstra Algorithm |
| :------------------- | :-----------: | :----------------: |
| Computation Time      | 🔥 Low         | 🐢 High             |
| Memory Usage          | Moderate      | High                |
| Scalability           | Excellent     | Poor                |
| Real-time Suitability | Very High     | Low                 |
| Path Accuracy         | Optimal       | Optimal             |


## How to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/gsinem/ai_project.git
      ```
2.Navigate into the project directory:
 ```bash
cd ai_project
   ```
## License
This project is licensed under the MIT License.

## Contact
For any questions, please reach out me.


