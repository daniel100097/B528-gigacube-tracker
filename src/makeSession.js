//@ts-check
const fetch = require("node-fetch").default;
const xmlParser = require("fast-xml-parser");
const crypto = require("crypto");

function encodeToken(pass, token, user) {
  const ss =
    user +
    Buffer.from(
      crypto.createHash("sha256").update(pass).digest("hex")
    ).toString("base64") +
    token;

  return Buffer.from(
    crypto.createHash("sha256").update(ss).digest("hex")
  ).toString("base64");
}

exports.default = async function makeSession(ip, user, password) {
  const {
    response: { TokInfo: token, SesInfo: session },
  } = await fetch(`http://${ip}/api/webserver/SesTokInfo`)
    .then((t) => t.text())
    .then((t) => xmlParser.parse(t));

  const c = await fetch(`http://${ip}/api/user/login`, {
    method: "POST",
    headers: { __RequestVerificationToken: token, Cookie: session },
    body: `<?xml version 1.0 encoding=UTF-8?><request><Username>${user}</Username><Password>${encodeToken(
      password,
      token,
      user
    )}</Password><password_type>4</password_type></request>`,
  });

  const sessionId = c?.headers
    ?.get("set-cookie")
    ?.split(";")?.[0]
    ?.split("SessionID=")?.[1];

  if (!sessionId) {
    throw new Error("Unable to make session.");
  }

  return sessionId;
};
