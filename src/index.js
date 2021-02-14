const makeSession = require("./makeSession").default;
const fetch = require("node-fetch").default;
const xmlParser = require("fast-xml-parser");
const fs = require("fs");
const app = require("express")();

const ip = process.env.GIGACUBE_IP;
const user = "admin";

const password = process.env.GIGACUBE_PASSWORD;

async function getTrafficStatistics(session) {
  return await fetch(`http://${ip}/api/monitoring/traffic-statistics`, {
    headers: { Cookie: `SessionID=${session}` },
  })
    .then((t) => t.text())
    .then((t) => xmlParser.parse(t)?.response);
}

async function getStatus(session) {
  return await fetch(`http://${ip}/api/monitoring/status`, {
    headers: { Cookie: `SessionID=${session}` },
  })
    .then((t) => t.text())
    .then((t) => xmlParser.parse(t)?.response);
}

async function getMonthStatistics(session) {
  return await fetch(`http://${ip}/api/monitoring/month_statistics`, {
    headers: { Cookie: `SessionID=${session}` },
  })
    .then((t) => t.text())
    .then((t) => xmlParser.parse(t)?.response);
}

async function getSignal(session) {
  return await fetch(`http://${ip}/api/device/signal`, {
    headers: { Cookie: `SessionID=${session}` },
  })
    .then((t) => t.text())
    .then((t) => xmlParser.parse(t)?.response);
}

let stats = {
  traffic: [],
  status: [],
  signal: [],
  monthStatistics: [],
};

if (!fs.existsSync(__dirname + "/stats.json")) {
  fs.writeFileSync(__dirname + "/stats.json", JSON.stringify(stats));
} else {
  stats = JSON.parse(fs.readFileSync(__dirname + "/stats.json").toString());
}

setInterval(() => {
  console.log("WRITE STATS TO FILE.");
  fs.writeFileSync(__dirname + "/stats.json", JSON.stringify(stats));
}, 60000);

const limitEntries = 500;

(async () => {
  while (true) {
    const session = await makeSession(ip, user, password);
    if (!session) {
      throw new Error("Unable to get session.");
    }
    try {
      while (true) {
        const traffic = await getTrafficStatistics(session);
        //const status = await getStatus(session);
        const signal = await getSignal(session);
        const monthStatistics = await getMonthStatistics(session);

        if (
          !stats.traffic[stats.traffic.length - 1] ||
          stats.traffic[stats.traffic.length - 1].CurrentConnectTime !==
            traffic.CurrentConnectTime
        ) {
          stats.traffic.push({ ...traffic, date: new Date() });
        }

        stats.signal.push({ ...signal, date: new Date() });
        // stats.monthStatistics.push({ ...monthStatistics, date: new Date() });

        Object.keys(stats).forEach((t) => {
          if (stats[t].length > limitEntries) {
            stats[t] = stats[t].slice(100);
          }
        });

        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      console.log(err);
      await new Promise((r) => setTimeout(r, 5000));
      //
    }
  }
})().catch((err) => {
  console.log(err);
  process.exit(7);
});

app.get("/", (req, res) => {
  res.send(fs.readFileSync(__dirname + "/index.html").toString());
});
app.get("/data", (req, res) => {
  res.send(stats);
});

app.listen(3000);
