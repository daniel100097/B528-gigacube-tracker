const makeSession = require("./makeSession").default;
const fetch = require("node-fetch").default;
const xmlParser = require("fast-xml-parser");
const fs = require("fs/promises");

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

(async () => {
  const session = await makeSession(ip, user, password);

  const traffic = await getTrafficStatistics(session);
  const status = await getStatus(session);
  const monthStatistics = await getMonthStatistics(session);

  console.log(monthStatistics);
})();
