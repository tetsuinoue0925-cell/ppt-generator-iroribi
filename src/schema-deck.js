// リッチデッキ形式（presentation/slides[].type）の ajv 検証。
const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");

const schemaPath = path.join(__dirname, "..", "schema", "deck.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

const ajv = new Ajv({ allErrors: true });
const validateFn = ajv.compile(schema);

function validateDeck(data) {
  const valid = validateFn(data);
  return { valid, errors: validateFn.errors || [] };
}

function formatErrors(errors) {
  return (errors || []).map((e) => {
    const where = e.instancePath || "(root)";
    return `  ${where} ${e.message}`;
  });
}

// 入力データがリッチデッキ形式かを判定する。
// 目印: presentation キー、または slides[].type を持つ。
function isDeckFormat(data) {
  if (!data || typeof data !== "object") return false;
  if (data.presentation) return true;
  const s = Array.isArray(data.slides) ? data.slides[0] : null;
  return !!(s && typeof s.type === "string" && !s.layout);
}

module.exports = { validateDeck, formatErrors, isDeckFormat };
