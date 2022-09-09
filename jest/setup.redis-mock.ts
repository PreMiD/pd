import.meta.jest.mock("ioredis", () =>
	import.meta.jest.requireActual("ioredis-mock")
);
