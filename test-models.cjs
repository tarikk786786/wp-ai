const { execSync } = require('child_process');

try {
  // We can write a small Node script that calls the SDK or just fetches via curl to see what models are allowed for this key!
  const apiKey = 'AIzaSyAXy42Ua7q19KwSH1FlVcl5ik5ZqGggI6Q';
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const cmd = `curl -s "${url}"`;
  console.log("Fetching allowed models from Google API...");
  const response = execSync(cmd, { encoding: 'utf8' });
  const data = JSON.parse(response);
  if (data.models) {
    console.log("Allowed models list:");
    data.models.forEach(m => {
      console.log(`- Name: ${m.name}, DisplayName: ${m.displayName}, SupportedMethods: ${m.supportedGenerationMethods.join(', ')}`);
    });
  } else {
    console.log("No models returned or error:", data);
  }
} catch (e) {
  console.error("Error:", e.message);
}
