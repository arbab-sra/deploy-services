const https = require("https");

// ----- CONFIGURATION -----
// Change these to test different loads and endpoints
const HOSTNAME = "project-a.arbab.fun"; // Test project-a or project-b
const ENDPOINT = "https://project-a.arbab.fun/";
const TOTAL_REQUESTS = 1000;
const CONCURRENCY = 50;
// -------------------------

// Create a custom agent to ignore self-signed (development) certificates
const agent = new https.Agent({
  rejectUnauthorized: false,
});

let activeConnections = 0;
let completedRequests = 0;
let startMs = Date.now();

const results = {
  success: 0,
  failed: 0,
  containers: {},
};

console.log("=============================================");
console.log(`🚀 STARTING CONCURRENT LOAD TEST`);
console.log(`📡 URL: ${ENDPOINT} (Host: ${HOSTNAME})`);
console.log(`⏱  Total Requests: ${TOTAL_REQUESTS}`);
console.log(`⚡️ Concurrency: ${CONCURRENCY} connections at once`);
console.log("=============================================\n");

function printProgress() {
  process.stdout.write(
    `\rProgress: ${completedRequests} / ${TOTAL_REQUESTS} requests completed...`,
  );
}

function printStats() {
  const durationSec = (Date.now() - startMs) / 1000;

  console.log("\n\n✅ LOAD TEST COMPLETE!\n");
  console.log("--- PERFORMANCE STATISTICS ---");
  console.log(`Time Elapsed:       ${durationSec.toFixed(2)} seconds`);
  console.log(
    `Throughput:         ${(TOTAL_REQUESTS / durationSec).toFixed(2)} requests/second`,
  );
  console.log(`Successful:         ${results.success}`);
  console.log(`Failed:             ${results.failed}\n`);

  console.log("--- LOAD DISTRIBUTION (REPLICAS) ---");
  const containerIds = Object.keys(results.containers);
  if (containerIds.length === 0) {
    console.log(
      "No container IDs returned (check if the service is up or routing correctly).",
    );
  } else {
    // Show how strictly the traffic was balanced
    containerIds.forEach((id) => {
      const count = results.containers[id];
      const percentage = ((count / results.success) * 100).toFixed(1);

      // Calculate a visual bar graph
      const barLength = Math.round((count / results.success) * 40);
      const bar = "█".repeat(barLength).padEnd(40, "░");

      console.log(
        `Replica [${id}]: ${count.toString().padEnd(5)} requests | ${bar} ${percentage}%`,
      );
    });
  }
  console.log("=============================================");
}

function createRequest() {
  // If we've dispatched all requests, stop spawning new ones
  if (completedRequests + activeConnections >= TOTAL_REQUESTS) {
    return;
  }

  activeConnections++;

  const options = {
    agent: agent,
    headers: { Host: HOSTNAME },
    method: "GET",
  };

  const req = https.request(ENDPOINT, options, (res) => {
    let rawData = "";
    res.on("data", (chunk) => {
      rawData += chunk;
    });

    res.on("end", () => {
      activeConnections--;
      completedRequests++;

      if (res.statusCode >= 200 && res.statusCode < 400) {
        results.success++;
        try {
          const parsed = JSON.parse(rawData);
          if (parsed.container_id) {
            results.containers[parsed.container_id] =
              (results.containers[parsed.container_id] || 0) + 1;
          }
        } catch (e) {
          /* ignore JSON parse error */
        }
      } else {
        results.failed++;
      }

      printProgress();

      if (completedRequests === TOTAL_REQUESTS) {
        printStats();
      } else {
        createRequest();
      }
    });
  });

  req.on("error", (e) => {
    activeConnections--;
    completedRequests++;
    results.failed++;
    printProgress();

    if (completedRequests === TOTAL_REQUESTS) {
      printStats();
    } else {
      createRequest();
    }
  });

  req.end();
}

// Kick off the initial batch of concurrent workers
for (let i = 0; i < CONCURRENCY; i++) {
  createRequest();
}
