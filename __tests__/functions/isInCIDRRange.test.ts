import getCloudFlareAddr from "../../src/functions/getCloudFlareAddr";
import getGoogleAddr from "../../src/functions/getGoogleAddr";
import isInCIDRRange, { CIDR } from "../../src/functions/isInCIDRRange";

let GoogleCIDRs: CIDR, CloudFlareCIDRs: CIDR;

describe("Fetch Google IP addresses", () => {
	beforeAll(async () => {
		const res = await Promise.all([getGoogleAddr(), getCloudFlareAddr()]);

		GoogleCIDRs = res[0];
		CloudFlareCIDRs = res[1];
	});

	it("should match Google IP addresses", async () => {
		expect(isInCIDRRange(GoogleCIDRs, "123.123.123.123")).toBe(false);
		expect(
			isInCIDRRange(GoogleCIDRs, "9b8a:0de9:c573:fb10:a30e:2f52:c8f5:e344")
		).toBe(false);

		expect(
			isInCIDRRange(
				GoogleCIDRs,
				GoogleCIDRs.filter(
					(c): c is { ipv4Prefix: string } => "ipv4Prefix" in c
				)[0].ipv4Prefix.split("/")[0]
			)
		).toBe(true);
		expect(
			isInCIDRRange(
				GoogleCIDRs,
				GoogleCIDRs.filter(
					(c): c is { ipv6Prefix: string } => "ipv6Prefix" in c
				)[0].ipv6Prefix.split("/")[0]
			)
		).toBe(true);
	});

	it("should match CloudFlare IP addresses", async () => {
		expect(isInCIDRRange(CloudFlareCIDRs, "123.123.123.123")).toBe(false);
		expect(
			isInCIDRRange(CloudFlareCIDRs, "9b8a:0de9:c573:fb10:a30e:2f52:c8f5:e344")
		).toBe(false);
		expect(
			isInCIDRRange(
				CloudFlareCIDRs,
				CloudFlareCIDRs.filter(
					(c): c is { ipv4Prefix: string } => "ipv4Prefix" in c
				)[0].ipv4Prefix.split("/")[0]
			)
		).toBe(true);
		expect(
			isInCIDRRange(
				CloudFlareCIDRs,
				CloudFlareCIDRs.filter(
					(c): c is { ipv6Prefix: string } => "ipv6Prefix" in c
				)[0].ipv6Prefix.split("/")[0]
			)
		).toBe(true);
	});
});
