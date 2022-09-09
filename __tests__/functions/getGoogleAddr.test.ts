import getGoogleAddr from "../../src/functions/getGoogleAddr";

describe("Fetch Google IP addresses", () => {
	it("should return an array of IP addresses", async () => {
		const result = await getGoogleAddr();
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
	});
});
