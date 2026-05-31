const fs = require('fs');

function patchSwarmRoom(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const oldFuncRegex = /export const processIncomingData = \(promptText: string\) => \{[\s\S]*?return \{ data, keys, keysStr \};\n\};/g;

  const newFunc = `export const processIncomingData = (promptText: string) => {
  let data: any[] = [];
  let parsedSuccessfully = false;

  // Strategy 1: Find the first array of objects using lazy regex
  try {
    const arrayMatch = promptText.match(/\\[\\s*\\{[\\s\\S]*?\\}\\s*\\]/);
    if (arrayMatch) {
      data = JSON.parse(arrayMatch[0]);
      parsedSuccessfully = true;
      console.log("Extracted via Regex (Array of Objects):", arrayMatch[0].substring(0, 50) + "...");
    }
  } catch (e) {}

  // Strategy 2: Brute force finding matching brackets (innermost/outermost valid JSON)
  if (!parsedSuccessfully) {
    try {
      const startIndex = promptText.indexOf('[');
      let endIndex = promptText.lastIndexOf(']');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        // Try parsing from the last bracket backwards to find the valid closing bracket for the first array
        let jsonString = promptText.substring(startIndex, endIndex + 1);
        
        while (jsonString.length > 0) {
          try {
            data = JSON.parse(jsonString);
            parsedSuccessfully = true;
            console.log("Extracted via Brute Force:", jsonString.substring(0, 50) + "...");
            break;
          } catch(e) {
            // Shrink the end boundary to the previous ]
            endIndex = promptText.lastIndexOf(']', startIndex + jsonString.length - 2);
            if (endIndex <= startIndex) break;
            jsonString = promptText.substring(startIndex, endIndex + 1);
          }
        }
      }
    } catch(err) {}
  }

  // Strategy 3: Object array without brackets (fallback)
  if (!parsedSuccessfully) {
     try {
       const objMatch = promptText.match(/\\{[\\s\\S]*?\\}/g);
       if (objMatch && objMatch.length > 0) {
          let assembled = "[" + objMatch.join(",") + "]";
          data = JSON.parse(assembled);
          parsedSuccessfully = true;
          console.log("Extracted via Object Assembly");
       }
     } catch(e) {}
  }

  if (!parsedSuccessfully) {
    console.error("JSON Parse Error: Could not extract valid JSON array/objects.");
    return null;
  }

  if (!Array.isArray(data)) data = [data];

  // UNIVERSAL KEY IDENTIFICATION
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  const keysStr = keys.join("_").toLowerCase();
  
  console.log("Data Detected:", data.length, "rows");
  
  return { data, keys, keysStr };
};`;

  content = content.replace(oldFuncRegex, newFunc);
  fs.writeFileSync(filePath, content);
  console.log('Patched ' + filePath);
}

patchSwarmRoom('src/cores/live/components/Shared/SwarmRoom.tsx');
patchSwarmRoom('src/cores/dummy/components/Shared/SwarmRoom.tsx');
