// Simple test script to check SWMS API connectivity
const https = require('https');

const testPayload = {
  "userId": "OPS$TEST0100",
  "opcoNumber": "swms",
  "type": "PDF",
  "equipId": null,
  "zoneId": null,
  "printerName": null,
  "reportValue": "me1ra"
};

const options = {
  hostname: 'lx739q60-swms-service-layer.swms-np.us-east-1.aws.sysco.net',
  port: 443,
  path: '/report/equipment-overview',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/pdf, application/json',
    'syy-site-id': 'LX739Q60',
    'x-session-user-id': 'OPS$TEST0100',
    'x-opco-number': 'swms',
    'x-swms-version': '61.0.0',
    'syy-swms-version': '61.0.0',
    'x-bff-version': '2.1.0',
    'x-fe-version': '1.1.4',
    'origin': 'https://lx739q60-swms-frontend-layer.swms-np.us-east-1.aws.sysco.net',
    'referer': 'https://lx739q60-swms-frontend-layer.swms-np.us-east-1.aws.sysco.net',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'cookie': '_ga=GA1.1.1134090752.1749581339; _ga_ML9Z3SL0FP=GS2.1.s1751296511$o15$g1$t1751296678$j60$l0$h0; swmslx739q60=57a435884badce034a9613a194b9cace71b8dec0d4d7b2e30206fa77a013a378'
  }
};

console.log('Testing SWMS API connectivity...');
console.log('URL:', `https://${options.hostname}${options.path}`);
console.log('Headers:', options.headers);
console.log('Payload:', testPayload);

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response length:', data.length);
    if (res.statusCode !== 200) {
      console.log('Error response body:', data);
    } else {
      console.log('Success! PDF data received, length:', data.length);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(JSON.stringify(testPayload));
req.end();
