// 入力 JSON のスキーマ検証のみを行う（生成はしない）。
//   node src/validate.js [input.json]
const fs = require("fs");
const { validate, formatErrors } = require("./schema");

const inputPath = process.argv[2] || process.env.SLIDES_INPUT || "input/slides.json";

if (!fs.existsSync(inputPath)) {
  console.error(`入力 JSON が見つかりません: ${inputPath}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
} catch (e) {
  console.error(`JSON のパースに失敗しました: ${e.message}`);
  process.exit(1);
}

const { valid, errors } = validate(data);
if (valid) {
  const n = (data.slides || []).length;
  console.log(`OK: スキーマ検証を通過しました（${n} スライド）`);
  process.exit(0);
} else {
  console.error("スキーマ検証に失敗しました:");
  formatErrors(errors).forEach((line) => console.error(line));
  process.exit(1);
}
