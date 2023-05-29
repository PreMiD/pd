import { RouteHandlerMethod } from "fastify/types/route";

import { MIN30, MIN30SEC, redis } from "../../index.js";
import { nanoid } from "nanoid";

const createImage: RouteHandlerMethod = async (req, reply) => {
	const file = await req.file();

	if (!file) return reply.status(400).send("Invalid file");

	//* File must be a png, jpeg, jpg, gif or webp
	const fileRegex = /^image\/(png|jpeg|jpg|gif|webp)$/;
	if (!fileRegex.test(file.mimetype))
		return reply.status(400).send("Invalid file");

	const body = `data:${file.mimetype};base64,${(await file.toBuffer()).toString(
		"base64"
	)}`;

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

	const uniqueId = `${nanoid(10)}.${file.mimetype.split("/")[1]}`;

	const multi = redis.multi();
	multi.psetex(body, MIN30, uniqueId);
	multi.psetex(uniqueId, MIN30, body);
	await multi.exec();

	reply.header("Cache-control", `public, max-age=${MIN30SEC}`);
	return reply.send((process.env.BASE_URL ?? "/") + uniqueId);
};

export default createImage;
