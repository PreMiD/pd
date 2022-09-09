import { RouteHandlerMethod } from "fastify/types/route";

import isInCIDRRange from "../functions/isInCIDRRange.js";
import { CloudFlareCIDRs, GoogleCIDRs, MIN30, MIN30SEC, redis } from "../index.js";

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

	if (id.length !== 10) return reply.code(404).send("Invalid ID");

	const multi = redis.multi();
	multi.get(id);
	multi.pexpire(id, MIN30);
	const url = (await multi.exec())?.[0];
	if (!url || url[0] || (!url[0] && !url[1]))
		return reply.code(404).send("Unknown ID");

	await redis.pexpire(url[1] as string, MIN30);

	reply.header("Cache-control", `public, max-age=${MIN30SEC}`);
	return reply.redirect(url[1] as string);
};

export default redirect;
