module.exports = {
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "api/src/**/*.{controller.ts,dto.ts}": [
    "node api/scripts/check-swagger.js"
  ]
};