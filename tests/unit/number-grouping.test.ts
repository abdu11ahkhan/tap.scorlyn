import test from "node:test";
import assert from "node:assert/strict";
import { NUMBER_PICKER_HREF, groupNumberButtons, resolveButtons, resolveButtonsForPreview } from "../../src/lib/card";

test("two phone numbers become one Call button with labelled choices", () => {
  const out = groupNumberButtons(
    resolveButtons([
      { kind: "phone", label: "Pakistani", value: "+92 300 0000001" },
      { kind: "phone", label: "Spanish", value: "+34 600 000 002" },
      { kind: "email", label: "Email", value: "test@example.com" },
    ])
  );
  assert.equal(out.length, 2);
  assert.equal(out[0].href, `${NUMBER_PICKER_HREF}phone`);
  assert.deepEqual(out[0].choices?.map((c) => c.label), ["Pakistani", "Spanish"]);
  assert.deepEqual(out[0].choices?.map((c) => c.href), ["tel:+923000000001", "tel:+34600000002"]);
});

test("a single number is left exactly as it was", () => {
  const one = resolveButtons([{ kind: "phone", label: "Call", value: "+92 300 0000001" }]);
  assert.deepEqual(groupNumberButtons(one), one);
});

test("a default label shows the number instead", () => {
  const out = groupNumberButtons(
    resolveButtons([
      { kind: "whatsapp", label: "", value: "+92 300 0000001" },
      { kind: "whatsapp", label: "Spain", value: "+34 600 000 002" },
    ])
  );
  assert.deepEqual(out[0].choices?.map((c) => c.label), ["+92 300 0000001", "Spain"]);
});

test("unfilled editor rows are not grouped", () => {
  const out = groupNumberButtons(
    resolveButtonsForPreview([
      { kind: "phone", label: "Call", value: "+92 300 0000001" },
      { kind: "phone", label: "Call", value: "" },
    ])
  );
  assert.equal(out.length, 2);
  assert.ok(!out.some((b) => b.choices));
});
