const http = require('http');
const https = require('https');

function getMetadataToken() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'metadata.google.internal',
      path: '/computeMetadata/v1/instance/service-accounts/default/token',
      headers: { 'Metadata-Flavor': 'Google' }
    };
    const req = http.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(data));
        else reject(new Error(`Status ${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
  });
}

const candidateBuckets = [
  'ais-source-a83d1cd8-f462-4b95-9b52-9dd679d8af95',
  'ais-build-a83d1cd8-f462-4b95-9b52-9dd679d8af95',
  'ais-user-a83d1cd8-f462-4b95-9b52-9dd679d8af95',
  'ais-applet-a83d1cd8-f462-4b95-9b52-9dd679d8af95',
  'a83d1cd8-f462-4b95-9b52-9dd679d8af95',
  'ais-ypdw2ash5mbha7uo32n2ls',
  'ais-source-ypdw2ash5mbha7uo32n2ls',
  'ypdw2ash5mbha7uo32n2ls',
];

getMetadataToken().then(async (token) => {
  for (const bucket of candidateBuckets) {
    try {
      console.log(`Checking bucket: ${bucket}...`);
      await new Promise((resolve) => {
        const url = `https://storage.googleapis.com/storage/v1/b/${bucket}`;
        https.get(url, { headers: { 'Authorization': `Bearer ${token.access_token}` } }, (res) => {
          let body = '';
          res.on('data', d => body += d);
          res.on('end', () => {
            console.log(`  -> Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
              console.log(`  -> SUCCESS! Bucket ${bucket} is accessible.`);
              console.log(`  -> Metadata:`, body);
              
              // Now list objects in this bucket
              const listUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o`;
              https.get(listUrl, { headers: { 'Authorization': `Bearer ${token.access_token}` } }, (resList) => {
                let listBody = '';
                resList.on('data', dl => listBody += dl);
                resList.on('end', () => {
                  console.log(`  -> Objects response status: ${resList.statusCode}`);
                  try {
                    const parsedList = JSON.parse(listBody);
                    console.log(`  -> Objects:`, (parsedList.items || []).map(o => o.name));
                  } catch (err) {
                    console.log('  -> Failed to parse objects body:', err.message);
                  }
                  resolve();
                });
              });
            } else {
              resolve();
            }
          });
        });
      });
    } catch (e) {
      console.error(`Error checking ${bucket}:`, e.message);
    }
  }
});
