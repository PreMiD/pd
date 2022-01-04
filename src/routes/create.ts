import { RouteHandlerMethod } from "fastify/types/route";
import { nanoid } from "nanoid";

import { MIN30, MIN30SEC, redis } from "../index.js";

const create: RouteHandlerMethod = async (req, reply) => {
	const url = (req.params as { "*": string })["*"].trim();

	if (!url.length || url.length < 256)
		return reply.status(400).send("Invalid URL");
	//* Ratelimit pwease

	const redisUrl = await redis.get(url);

	if (redisUrl) {
		const multi = redis.multi();
		multi.pExpire(redisUrl, MIN30);
		multi.pExpire(url, MIN30);
		await multi.exec();

		reply.header("Cache-control", `public, max-age=${MIN30SEC}`);
		return reply.send(process.env.BASE_URL + redisUrl);
	}

	const uniqueId = nanoid(10);

	const multi = redis.multi();
	multi.pSetEx(url, MIN30, uniqueId);
	multi.pSetEx(uniqueId, MIN30, url);
	await multi.exec();

	reply.header("Cache-control", `public, max-age=${MIN30SEC}`);
	return reply.send(process.env.BASE_URL + uniqueId);
};

export default create;
