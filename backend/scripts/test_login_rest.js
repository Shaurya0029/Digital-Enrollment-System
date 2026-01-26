const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}

(async () => {
  try {
    console.log('Testing HR login...');
    const hr = await post('/auth/login', { emailOrId: 'hr@example.com', password: 'password123', role: 'HR' });
    console.log('HR ->', hr.status, hr.body);

    console.log('Testing Employee login...');
    const emp = await post('/auth/login', { emailOrId: 'employee@example.com', password: 'password123', role: 'EMPLOYEE' });
    console.log('EMP ->', emp.status, emp.body);
  } catch (e) {
    console.error('Test error', e);
  }
})();
