import "source-map-support/register.js";

import fastify from "fastify";
import multipart from "@fastify/multipart";
import Redis from "ioredis";

import getCloudFlareAddr from "./functions/getCloudFlareAddr.js";
import getGoogleAddr from "./functions/getGoogleAddr.js";
import { CIDR } from "./functions/isInCIDRRange.js";
import create from "./routes/create.js";
import redirect from "./routes/redirect.js";
import createBase64 from "./routes/create/base64.js";
import createImage from "./routes/create/image.js";

if (process.env.NODE_ENV !== "production")
	(await import("dotenv")).config({ path: "../.env" });

if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL)
	throw Error("Environment variable REDIS_URL is not set");

if (!process.env.BASE_URL && process.env.NODE_ENV !== "test")
	throw Error("Environment variable BASE_URL is not set");

export const redis = new Redis(
		process.env.REDIS_URL || "redis://localhost:6379",
		{
			lazyConnect: true
		}
	),
	MIN30 = 1_800_000,
	MIN30SEC = MIN30 / 1000,
	server = fastify({
		trustProxy: true
	});

server.register(multipart);

server.addHook("onRequest", async (_, res) => {
	res.headers({
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers":
			"Origin, X-Requested-With, Content-Type, Accept"
	});
	return;
});

server.post("/create/image", createImage);
server.post("/create/base64", createBase64);
server.get("/create/*", create);
server.get("/*", redirect);

export let GoogleCIDRs: CIDR, CloudFlareCIDRs: CIDR;

export async function run() {
	const url = await server.listen({ port: 3001, host: "0.0.0.0" });
	console.log(`Server listening on ${url}`);

	setInterval(updateAddresses, MIN30);
}

async function updateAddresses() {
	const res = await Promise.all([getGoogleAddr(), getCloudFlareAddr()]);

	GoogleCIDRs = res[0];
	CloudFlareCIDRs = res[1];
}

if (process.env.NODE_ENV !== "test") redis.once("ready", run);

await updateAddresses();
await redis.connect();
