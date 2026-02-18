const https = require('https');

const API_URL = 'https://co.wuk.sh/api/json';
const targetUrl = 'https://youtube.com/clip/UgkxUHqD-GL0aubK11BeQIDDox97EcbGbprq?si=cLnMgmGQVf0TCwnw';

const requestBody = JSON.stringify({
    url: targetUrl,
    vQuality: '720',
    filenamePattern: 'nerdy',
    isAudioOnly: false,
    disableMetadata: true
});

const options = {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': requestBody.length
    }
};

const req = https.request(API_URL, options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        try {
            const parsed = JSON.parse(data);
            console.log('Response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('Raw Body:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

req.write(requestBody);
req.end();
