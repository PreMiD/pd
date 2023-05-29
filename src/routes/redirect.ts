import { RouteHandlerMethod } from "fastify/types/route";

import isInCIDRRange from "../functions/isInCIDRRange.js";
import {
	CloudFlareCIDRs,
	GoogleCIDRs,
	MIN30,
	MIN30SEC,
	redis
} from "../index.js";

const redirect: RouteHandlerMethod = async (req, reply) => {
	//* Check if cloudflare is connecting (Or someone pretending to be cloudflare)
	if (
		req.headers["cf-connecting-ip"]?.toString() &&
		!isInCIDRRange(CloudFlareCIDRs, req.headers["x-forwarded-for"]?.toString()!)
	)
		return reply.status(401).send("Fake Cloudflare IP");

	if (
		!isInCIDRRange(
			GoogleCIDRs,
			req.headers["cf-connecting-ip"]?.toString()! || req.socket.remoteAddress!
		)
	)
		return reply.status(401).send("Not a Google Cloud IP");

	const id = (req.params as { "*": string })["*"].trim();

	if (id.split(".")[0].length !== 10) return reply.code(404).send("Invalid ID");

	const multi = redis.multi();
	multi.get(id);
	multi.pexpire(id, MIN30);
	const url = (await multi.exec())?.[0];
	if (!url || url[0] || (!url[0] && !url[1]))
		return reply.code(404).send("Unknown ID");

	const finalUrl = url[1] as string;
	await redis.pexpire(finalUrl, MIN30);

	reply.header("Cache-control", `public, max-age=${MIN30SEC}`);

	//* If it is not a base64 string, redirect to it
	if (!finalUrl.startsWith("data:image")) return reply.redirect(finalUrl);

	const image = Buffer.from(
			finalUrl.replace(/^data:image\/\w+;base64,/, ""),
			"base64"
		),
		mime = finalUrl.split(";")[0].split(":")[1];
	return reply.type(mime).send(image);
};

export default redirect;
