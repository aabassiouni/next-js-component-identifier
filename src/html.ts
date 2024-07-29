import { SerializedTree } from "./utils";

export function getWebviewContent(currRoute: string, routes: string[], serializedTree: SerializedTree) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Vertical Tree Visualizer</title>
        <script src="https://d3js.org/d3.v7.min.js"></script>
        <style>
          .node rect {
            stroke: #666;
            fill: #ddd;
            stroke-width: 1px;
          }
          .node text {
            font: 10px sans-serif;
          }
          .link {
            fill: none;
            stroke: #ccc;
            stroke-width: 2px;
          }
        </style>
      </head>
      <body>
        <h1>This works!</h1>
        <button id="test-click">Click me</button>
        <select name="cars" id="cars">
        ${routes.map((route) => `<option value="${route}">${route}</option>`).join("\n")}
        </select>
        <p>currRoute: ${currRoute}</p>
        <!-- <div id="container"></div> -->
        <script>

          (function () {
          const vscode = acquireVsCodeApi();

          const selectElement = document.querySelector("#cars");

          console.log(selectElement);

          selectElement.addEventListener("change", (event) => {
            console.log("changed select value", event.target.value);
            vscode.postMessage({
                command: "change-route",
                route: event.target.value,
              });
          });
        
          // Set the dimensions and margins of the diagram
          var margin = { top: 20, right: 120, bottom: 20, left: 120 },
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

          // Append the svg object to the body of the page
          var svg = d3
            .select("body")
            .append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          var treemap = d3.tree().size([height, width]);

          // Sample tree data
          var treeData = ${JSON.stringify(serializedTree, null, 2)};

          var root = d3.hierarchy(treeData, function (d) {
            return d.children;
          });

          treemap(root);

          var nodes = root.descendants(),
            links = root.descendants().slice(1);

          // Links
          svg
            .selectAll(".link")
            .data(links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", function (d) {
              return (
                "M" +
                d.x +
                "," +
                d.y +
                "C" +
                d.x +
                "," +
                (d.y + d.parent.y) / 2 +
                " " +
                d.parent.x +
                "," +
                (d.y + d.parent.y) / 2 +
                " " +
                d.parent.x +
                "," +
                d.parent.y
              );
            });

          // Nodes
          var node = svg
            .selectAll(".node")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
              return "translate(" + d.x + "," + d.y + ")";
            });

          // Rectangles for the nodes
          node.append("rect").attr("width", 100).attr("height", 50).attr("x", -30).attr("y", -10);

          // Labels for the nodes
          node
            .append("text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function (d) {
              return d.data.name;
            });
          })();
        </script>
      </body>
    </html>
`;

  return html;
}
