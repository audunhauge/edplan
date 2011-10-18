var crypto = require('crypto');

module.exports.connectionString = "postgres://admin:somepassword@localhost/planner";
module.exports.supwd = crypto.createHash('md5').update('somesimplething').digest("hex");
module.exports.startpwd = crypto.createHash('md5').update('abasicpwd').digest("hex");
/*
module.exports.setup = function (client) {
  client.user = 'username';
  client.password = 'password';
  client.database = 'planner';
  client.host = 'planner.mysqlhost.org';
}
*/
