const http = require("http");
const os = require("os");

const port = process.env.PORT || 8080;
const projectName = process.env.PROJECT_NAME || "Unknown-Project";

const server = http.createServer((req, res) => {
  // Demo API endpoint
  if (req.url === "/" || req.url === "/api") {
    // Collect system health metrics to check infrastructure status
    const systemHealth = {
      uptimeSeconds: Math.round(os.uptime()),
      freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
      cpuLoadAvg: os.loadavg(), // 1, 5, and 15 minute load averages
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          status: "success",
          project: projectName,
          message: `Infrastructure health check successful!`,
          container_id: os.hostname(), // Shows the unique ID of the replica handling the request
          client_ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
          system_metrics: systemHealth,
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
