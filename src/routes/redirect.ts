import { RouteHandlerMethod } from "fastify/types/route";

import isInCIDRRange from "../functions/isInCIDRRange.js";
import { CloudFlareCIDRs, GoogleCIDRs, MIN30, MIN30SEC, redis } from "../index.js";

const redirect: RouteHandlerMethod = async (req, reply) => {
	console.log(
		req.socket.remoteAddress,
		req.headers["cf-connecting-ip"],
		req.headers["x-forwarded-for"],
		req.headers
	);

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

	if (id.length !== 10) {
		reply.code(404).send("Invalid ID");
		return;
	}

	const multi = redis.multi();
	multi.get(id);
	multi.pExpire(id, MIN30);
	const url = (await multi.exec())[0] as string;

	await redis.pExpire(url, MIN30);

	reply.header("Cache-control", `public, max-age=${MIN30SEC}`);
	return reply.redirect(url);
};

export default redirect;
