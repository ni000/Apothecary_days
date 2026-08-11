const fs = require('fs');
const code = fs.readFileSync('main.js', 'utf8');

try {
  // Use node's vm module to check for syntax errors
  const vm = require('vm');
  const script = new vm.Script(code, { filename: 'main.js' });
  console.log("Syntax check passed!");
} catch (err) {
  console.error("Syntax Error found:", err);
}
