import got from "got";

import { CIDR } from "./isInCIDRRange.js";

export default async function getGoogleAddr(): Promise<CIDR> {
	const { body } = await got.get("https://www.gstatic.com/ipranges/cloud.json"),
		res: GoogleRes = JSON.parse(body);
	return res.prefixes.map(({ ipv4Prefix, ipv6Prefix }) => {
		if (ipv6Prefix) return { ipv6Prefix };
		else return { ipv4Prefix };
	});
}

interface GoogleRes {
	syncToken: string;
	creationTime: string;
	prefixes: GoogleIP[];
}

interface GoogleIP {
	ipv6Prefix: string;
	ipv4Prefix: string;
	service: string;
	scope: string;
}
