import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanupTestStorage, setupTestStorage } from "./helpers/test-utils";

beforeAll(async () => {
	await setupTestStorage();
});

afterEach(async () => {
	await setupTestStorage();
});

afterAll(async () => {
	await cleanupTestStorage();
});
