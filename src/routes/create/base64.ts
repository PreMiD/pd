import { RouteHandlerMethod } from "fastify/types/route";

import { MIN30, MIN30SEC, redis } from "../../index.js";
import { nanoid } from "nanoid";

const createBase64: RouteHandlerMethod = async (req, reply) => {
	const { body } = req;

	if (!body) return reply.status(400).send("Invalid body");
	if (typeof body !== "string") return reply.status(400).send("Invalid body");

	//* The string must be a valid base64 string (data:image/png;base64,....), for now we will only support png, jpeg, jpg, gif and webp
	const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
	if (!base64Regex.test(body))
		return reply.status(400).send("Invalid base64 string");

	//TODO Ratelimit pwease

	//* Check if it is already cached
	const redisUrl = await redis.get(body);

	if (redisUrl) {
		const multi = redis.multi();
		multi.pexpire(redisUrl, MIN30);
		multi.pexpire(body, MIN30);
		await multi.exec();

		reply.header("Cache-control", `public, max-age=${MIN30SEC}`);
		return reply.send(process.env.BASE_URL + redisUrl);
	}

	const uniqueId = nanoid(10);

	const multi = redis.multi();
	multi.psetex(body, MIN30, uniqueId);
	multi.psetex(uniqueId, MIN30, body);
	await multi.exec();

	reply.header("Cache-control", `public, max-age=${MIN30SEC}`);
	return reply.send((process.env.BASE_URL ?? "/") + uniqueId);
};

export default createBase64;
