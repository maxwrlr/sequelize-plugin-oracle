const fs = require('fs');
const path = require('path');

function paste(filepath, reference, fragment) {
	let content = fs.readFileSync(filepath, 'utf8');
	const index = content.indexOf(reference);
	content = content.substr(0, index) + fragment + content.substr(index);
	fs.writeFileSync(filepath, content, 'utf8');
}

function install(force) {
	const sequelizeDir = path.dirname(require.resolve('sequelize'));
	const target = path.join(sequelizeDir, 'lib/dialects/oracle');
	const source = path.join(__dirname, 'oracle');

	if(force) {
		// for testing
		try {
			require('fs-extra').removeSync(target);
		} catch(exc) {
		}
	} else if(fs.existsSync(target)) {
		// don't copy if already copied
		return;
	}

	// copy all files
	fs.mkdirSync(target);
	for(const filename of fs.readdirSync(source)) {
		fs.copyFileSync(path.join(source, filename), path.join(target, filename));
	}

	// make sure oracle dialect wil be required
	paste(
		path.join(sequelizeDir, 'lib/sequelize.js'),
		'case \'mariadb\':',
		'case \'oracle\': Dialect = require(\'./dialects/oracle\'); break;'
	);
	paste(
		path.join(sequelizeDir, 'lib/data-types.js'),
		'dialectMap.mariadb',
		'dialectMap.oracle = require(\'./dialects/oracle/data-types\')(DataTypes);'
	)
}

install();

module.exports.install = install;
