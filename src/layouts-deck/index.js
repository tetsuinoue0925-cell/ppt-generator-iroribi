// リッチデッキ形式の type → 描画関数ディスパッチ。
module.exports = {
  "title-slide": require("./title-slide"),
  toc: require("./toc"),
  closing: require("./closing"),
  "section-title": require("./section-title"),
  "bullet-list": require("./bullet-list"),
  "two-column-mixed": require("./two-column-mixed"),
  "two-column-tiled": require("./two-column-tiled"),
  "tiled-content": require("./tiled-content"),
  table: require("./table"),
  "bleed-image": require("./bleed-image"),
  timeline: require("./timeline"),
  "highlight-numbers": require("./highlight-numbers"),
  "qa-layout": require("./qa-layout"),
};
