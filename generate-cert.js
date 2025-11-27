//自簽SSL憑證 測試使用

// generate-cert.js
const fs = require('fs');
const selfsigned = require('selfsigned');

// 定義憑證主題
const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'organizationName', value: 'Test' }
];

// 生成憑證
const pems = selfsigned.generate(attrs, {
  algorithm: 'sha256',
  days: 365,
  keySize: 2048,
  extensions: [{ name: 'basicConstraints', cA: true }]
});

// 創建 certs 目錄
if (!fs.existsSync('certs')) {
  fs.mkdirSync('certs');
}

// 保存憑證和密鑰
fs.writeFileSync('certs/cert.pem', pems.cert);
fs.writeFileSync('certs/key.pem', pems.private);

console.log('✅ SSL 憑證已生成！');
console.log('   📁 certs/cert.pem');
console.log('   📁 certs/key.pem');
