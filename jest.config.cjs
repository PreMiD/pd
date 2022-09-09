/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	preset: "ts-jest/presets/default-esm", // or other ESM presets
	globals: {
		"ts-jest": {
			useESM: true
		}
	},
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1"
	},
	setupFilesAfterEnv: ["./jest/setup.redis-mock.ts"]
};
