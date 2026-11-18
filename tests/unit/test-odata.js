import assert from "node:assert";
import { assertGuid, assertIdentifier, odataStringLiteral } from "../../dist/odata.js";

assert.strictEqual(assertIdentifier("account", "entity set"), "account");
assert.throws(() => assertIdentifier("account')/x", "entity set"));
assert.throws(() => assertIdentifier("a,b", "column"));
assert.strictEqual(assertGuid("00000000-0000-0000-0000-000000000000"), "00000000-0000-0000-0000-000000000000");
assert.throws(() => assertGuid("1) or (1"));
assert.strictEqual(odataStringLiteral("o'brien"), "o''brien");
assert.strictEqual(odataStringLiteral("aassert.strictEqual(odataStringLiteral("o'brien"), "o''brien".replace(/'/g, "%27"));b"), "a%26b");
console.log("✓ OData input escaping");
