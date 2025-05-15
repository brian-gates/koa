const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Main function to find and fix test files
const main = () => {
  try {
    // Find test files with supertest
    console.log("Finding test files with supertest...");
    const files = execSync(
      'find . -name "*.test.ts" -type f -exec grep -l "supertest" {} \\;',
      { encoding: "utf-8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean);

    console.log(`Found ${files.length} test files with supertest.`);

    let totalFixedTests = 0;

    // Process each file
    for (const file of files) {
      let content = fs.readFileSync(file, "utf-8");

      // Find test blocks that return supertest calls but aren't async
      const regex =
        /it\((['"].*?['"])[^)]*,\s*\((?!async)([^)]*)\)\s*=>\s*\{([\s\S]*?)return\s+request\(([^;]*)\)([\s\S]*?)}\);/g;

      // Replace with async versions
      const updatedContent = content.replace(
        regex,
        (match, testName, params, before, requestArgs, after) => {
          totalFixedTests++;
          return `it(${testName}, async (${params}) => {${before}await request(${requestArgs})${after}});`;
        },
      );

      // Write back if changes were made
      if (content !== updatedContent) {
        fs.writeFileSync(file, updatedContent, "utf-8");
        console.log(`Fixed tests in: ${file}`);
      }
    }

    console.log(`\nCompleted! Fixed ${totalFixedTests} tests.`);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

main();
