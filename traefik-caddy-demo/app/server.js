const http = require("http");
const os = require("os");

const port = process.env.PORT || 8080;
const projectName = process.env.PROJECT_NAME || "Unknown-Project";

const server = http.createServer((req, res) => {
  // Demo API endpoint
  if (req.url === "/" || req.url === "/api") {
    console.log("Request received");
    for (let i = 0; i < 100000; i++) {
      console.log(i);
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    console.log("Request processed");
    res.end(
      JSON.stringify(
        {
          status: "success",
          project: projectName,
          message: `Request received and processed!`,
          container_id: os.hostname(), // Shows the unique ID of the replica handling the request
          client_ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        },
        null,
        2,
      ),
    );
  } else {
    console.log("Request not found");
    
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

server.listen(port, () => {
  console.log(
    `${projectName} server listening on port ${port}, container ID: ${os.hostname()}`,
  );
});
