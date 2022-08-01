module.exports = {
  files: ["src/**/*.test.ts"],
  extensions: ["ts"],
  require: ["esbuild-register"],
  ignoredByWatcher: [".next"],
  snapshotDir: "src/tests/snapshots",
}
