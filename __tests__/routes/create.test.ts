import { server } from "../../src";

describe("Create", () => {
	it("should create short url", async () => {
		const res = await server.inject({
			method: "GET",
			url: `/create/http://google.com?alias=${"a".repeat(256)}`
		});

		expect(res.statusCode).toBe(200);
	});

	it("should not create short url if url is invalid", async () => {
		const res1 = await server.inject({
			method: "GET",
			url: "/create/"
		});
		expect(res1.statusCode).toBe(400);
		expect(res1.body).toBe("Invalid URL");

		const res2 = await server.inject({
			method: "GET",
			url: `/create/${"a".repeat(256)}`
		});

		expect(res2.statusCode).toBe(400);
		expect(res2.body).toBe("Invalid URL");
	});

	it("should not create short url if url is too short", async () => {
		const res = await server.inject({
			method: "GET",
			url: "/create/https://google.com/"
		});
		expect(res.statusCode).toBe(400);
		expect(res.body).toBe("URL is too short");
	});
});
