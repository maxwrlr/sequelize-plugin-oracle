const fs = require('fs');
const { Sequelize } = require('..');

const sequelize = new Sequelize(
	fs.readFileSync('.dbconfig', 'utf8').trim()
);

sequelize.authenticate().then(() => {
	console.log('authenticated successfully!');
	sequelize.close();
});
