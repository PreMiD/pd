import { RouteHandlerMethod } from "fastify/types/route";
import { nanoid } from "nanoid";

import { MIN30, MIN30SEC, redis } from "../index.js";

const create: RouteHandlerMethod = async (req, reply) => {
	const url = req.url.replace("/create/", "").trim();

	if (!url.length) return reply.status(400).send("Invalid URL");

	if (url.length < 256) return reply.status(400).send("URL is too short");

	try {
		new URL(url);
	} catch {
		return reply.status(400).send("Invalid URL");
	}
	//* Ratelimit pwease

	const redisUrl = await redis.get(url);

	if (redisUrl) {
		const multi = redis.multi();
		multi.pexpire(redisUrl, MIN30);
		multi.pexpire(url, MIN30);
		await multi.exec();

		reply.header("Cache-control", `public, max-age=${MIN30SEC}`);
		return reply.send(process.env.BASE_URL + redisUrl);
	}

	const uniqueId = nanoid(10);

	const multi = redis.multi();
	multi.psetex(url, MIN30, uniqueId);
	multi.psetex(uniqueId, MIN30, url);
	await multi.exec();

	reply.header("Cache-control", `public, max-age=${MIN30SEC}`);
	return reply.send((process.env.BASE_URL ?? "/") + uniqueId);
};

export default create;
