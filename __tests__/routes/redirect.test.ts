import { CloudFlareCIDRs, GoogleCIDRs, server } from "../../src";

describe("Redirect", () => {
	it("should redirect to url", async () => {
		const urlToShorten = `http://google.com?alias=${"a".repeat(256)}`;
		const res = await server.inject({
			method: "GET",
			url: `/create/${urlToShorten}`
		});

		expect(res.statusCode).toBe(200);

		const url = res.body;

		const res2 = await server.inject({
			method: "GET",
			url,
			headers: {
				"cf-connecting-ip": GoogleCIDRs.filter(
					(c): c is { ipv4Prefix: string } => "ipv4Prefix" in c
				)[0].ipv4Prefix.split("/")[0],
				"x-forwarded-for": CloudFlareCIDRs.filter(
					(c): c is { ipv4Prefix: string } => "ipv4Prefix" in c
				)[0].ipv4Prefix.split("/")[0]
			}
		});
		expect(res2.statusCode).toBe(302);
		expect(res2.headers.location).toBe(urlToShorten);
	});

	it("should not redirect because IP is not allowed", async () => {
		const res1 = await server.inject({
			method: "GET",
			url: "/abc",
			headers: {
				"cf-connecting-ip": "127.0.0.0",
				"x-forwarded-for": "127.0.0.0"
			}
		});
		expect(res1.statusCode).toBe(401);
		expect(res1.body).toBe("Fake Cloudflare IP");

		const res2 = await server.inject({
			method: "GET",
			url: "/abc",
			headers: {
				"cf-connecting-ip": "127.0.0.0",
				"x-forwarded-for": CloudFlareCIDRs.filter(
					(c): c is { ipv4Prefix: string } => "ipv4Prefix" in c
				)[0].ipv4Prefix.split("/")[0]
			}
		});
		expect(res2.statusCode).toBe(401);
		expect(res2.body).toBe("Not a Google Cloud IP");
	});

	it("should not redirect because ID is not found/invalid", async () => {
		const res1 = await server.inject({
			method: "GET",
			url: "/abc",
			headers: {
				"cf-connecting-ip": GoogleCIDRs.filter(
					(c): c is { ipv4Prefix: string } => "ipv4Prefix" in c
				)[0].ipv4Prefix.split("/")[0],
				"x-forwarded-for": CloudFlareCIDRs.filter(
					(c): c is { ipv4Prefix: string } => "ipv4Prefix" in c
				)[0].ipv4Prefix.split("/")[0]
			}
		});

		expect(res1.statusCode).toBe(404);
		expect(res1.body).toBe("Invalid ID");

		const res2 = await server.inject({
			method: "GET",
			url: `/${"a".repeat(10)}`,
			headers: {
				"cf-connecting-ip": GoogleCIDRs.filter(
					(c): c is { ipv4Prefix: string } => "ipv4Prefix" in c
				)[0].ipv4Prefix.split("/")[0],
				"x-forwarded-for": CloudFlareCIDRs.filter(
					(c): c is { ipv4Prefix: string } => "ipv4Prefix" in c
				)[0].ipv4Prefix.split("/")[0]
			}
		});

		expect(res2.statusCode).toBe(404);
		expect(res2.body).toBe("Unknown ID");
	});
});
