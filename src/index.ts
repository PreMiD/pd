import "source-map-support/register.js";

import fastify from "fastify";
import { createClient } from "redis";

import getCloudFlareAddr from "./functions/getCloudFlareAddr.js";
import getGoogleAddr from "./functions/getGoogleAddr.js";
import create from "./routes/create.js";
import redirect from "./routes/redirect.js";

if (process.env.NODE_ENV !== "production")
	(await import("dotenv")).config({ path: "../.env" });

if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL)
	throw Error("Environment variable REDIS_URL is not set");

if (!process.env.BASE_URL)
	throw Error("Environment variable BASE_URL is not set");

export const redis = createClient({
		url: process.env.REDIS_URL || "redis://localhost:6379"
	}),
	MIN30 = 1_800_000,
	MIN30SEC = MIN30 / 1000,
	server = fastify({
		trustProxy: true
	});

server.get("/create/*", create);
server.get("/*", redirect);

export let GoogleCIDRs = await getGoogleAddr(),
	CloudFlareCIDRs = await getCloudFlareAddr();

redis.on("ready", () => {
	server.listen(3001, "0.0.0.0");
});

try {
	await redis.connect();
} catch (e) {
	throw Error("Failed to connect to redis");
}

setInterval(async () => {
	GoogleCIDRs = await getGoogleAddr();
	CloudFlareCIDRs = await getCloudFlareAddr();
	//* 30 mins
}, MIN30);
