const fs = require('fs');
const path = require('path');

function paste(filepath, reference, fragment) {
	// backup file for future updates on original file
	const backupFile = filepath + '.original';
	if(!fs.existsSync(backupFile)) {
		fs.copyFileSync(filepath, backupFile);
	}

	let content = fs.readFileSync(backupFile, 'utf8');
	const index = Array.isArray(reference)
		? reference.reduce((i, r) => i >= 0 ? i : content.indexOf(r), -1)
		: content.indexOf(reference);

	if(index < 0) {
		console.error('Failed to install oracle dialect.');
		process.exit();
		return;
	}

	content = content.substr(0, index) + fragment + content.substr(index);
	fs.writeFileSync(filepath, content, 'utf8');
}

function installFiles(force) {
	// make file amendments
	const sequelizeDir = path.dirname(require.resolve('sequelize'));
	const target = path.join(sequelizeDir, 'lib/dialects/oracle');
	const source = path.join(__dirname, 'oracle');

	// always update if version of this package changed
	let isUpToDate = false;
	let sourceVersion;
	try {
		sourceVersion = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')).version;
		const targetVersion = fs.readFileSync(path.join(target, '.version'), 'utf8');
		isUpToDate = sourceVersion === targetVersion;
	} catch(exc) {
	}

	if(force) {
		// for testing
		try {
			require('fs-extra').removeSync(target);
		} catch(exc) {
		}
	} else if(isUpToDate && fs.existsSync(target)) {
		// don't copy if already copied
		return;
	}

	// copy all files
	if(!fs.existsSync(target)) {
		fs.mkdirSync(target);
	}
	for(const filename of fs.readdirSync(source)) {
		fs.copyFileSync(path.join(source, filename), path.join(target, filename));
	}

	// make sure oracle dialect wil be required
	paste(
		path.join(sequelizeDir, 'lib/sequelize.js'),
		['case \'mariadb\':', 'case "mariadb":'],
		'case \'oracle\': Dialect = require(\'./dialects/oracle\'); break;\n'
	);
	paste(
		path.join(sequelizeDir, 'lib/data-types.js'),
		'dialectMap.mariadb',
		'dialectMap.oracle = require(\'./dialects/oracle/data-types\')(DataTypes);\n'
	);

	// commit
	fs.writeFileSync(path.join(target, '.version'), sourceVersion, 'utf8');
}

/**
 * Make run-time adjustments. Unfortunately, that's not always easily possible.
 */
function installRuntime() {
	// Install Oracle String escape
	const SqlString = require('sequelize/lib/sql-string');
	const dataTypes = require('sequelize/lib/data-types');
	const originalEscape = SqlString.escape;
	SqlString.escape = function(val, timeZone, dialect, format) {
		if(dialect === 'oracle') {
			if(typeof val === 'string') {
				return val.split(/(\0)/g).map(v => v === '\0' ? 'chr(0)' : `'${v.replace(/'/g, `''`)}'`).join('||');
			}
			if(val instanceof Date) {
				return dataTypes[dialect].DATE.prototype.stringify(val, { timezone: timeZone });
			}
		}
		return originalEscape(val, timeZone, dialect, format);
	};
}

function install(force) {
	installFiles(force);
	installRuntime();
}

install();

module.exports.install = install;
