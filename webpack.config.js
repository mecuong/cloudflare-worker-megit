module.exports = {
  context: __dirname,
  target: "webworker",
  entry: "./index.js",
  stats: {
    errorDetails: true
  }
}