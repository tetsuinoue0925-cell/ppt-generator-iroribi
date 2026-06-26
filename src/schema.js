// ajv による入力 JSON のスキーマ検証。
const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");

const schemaPath = path.join(__dirname, "..", "schema", "slides.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

const ajv = new Ajv({ allErrors: true });
const validateFn = ajv.compile(schema);

// data を検証して { valid, errors } を返す。
function validate(data) {
  const valid = validateFn(data);
  return { valid, errors: validateFn.errors || [] };
}

// ajv のエラー配列を読みやすい文字列配列に整形する。
function formatErrors(errors) {
  return (errors || []).map((e) => {
    const where = e.instancePath || "(root)";
    return `  ${where} ${e.message}`;
  });
}

module.exports = { validate, formatErrors };
