// Tạo ADMIN_PASSWORD_HASH: npm run hash-password -- "mat-khau-cua-ban"
const bcrypt = require('bcryptjs');
const pw = process.argv[2];
if (!pw || pw.length < 10) {
  console.error('Dùng: npm run hash-password -- "mật khẩu ít nhất 10 ký tự"');
  process.exit(1);
}
console.log(bcrypt.hashSync(pw, 12));
