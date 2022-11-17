const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const Module = require('module');

/**
 * Make run-time adjustments to support Oracle.
 * Especially due to data types, installation cannot be done more than once.
 */
function install() {
	/**
	 * install Oracle data types
	 */
	let oracleDataTypes;
	const originalEach = _.each;
	_.each = function(dataTypes) {
		if(dataTypes && dataTypes.ABSTRACT && dataTypes.CITEXT && dataTypes.CITEXT.types) {
			oracleDataTypes = require('./oracle/data-types')(dataTypes);
			_.each = originalEach;
		}
		return originalEach.apply(this, arguments);
	};

	const dataTypes = require('sequelize/lib/data-types');
	_.each(oracleDataTypes, (DataType, key) => {
		if(!DataType.key) {
			DataType.key = DataType.prototype.key = key;
		}
	});

	const { classToInvokable } = require('sequelize/lib/utils/class-to-invokable');
	_.each(oracleDataTypes, (DataType, key) => {
		oracleDataTypes[key] = classToInvokable(DataType);
	});

	dataTypes.oracle = oracleDataTypes;

	/**
	 * install Oracle string escape
	 */
	const SqlString = require('sequelize/lib/sql-string');
	const originalEscape = SqlString.escape;
	SqlString.escape = function(val, timeZone, dialect, format) {
		if(dialect === 'oracle') {
			if(typeof val === 'string') {
				return val.split(/(\0)/g).map(v => v === '\0' ? 'chr(0)' : `'${v.replace(/'/g, `''`)}'`).join('||');
			}
			if(typeof val === 'boolean') {
				return val ? '1' : '0';
			}
			if(val instanceof Date) {
				return dataTypes[dialect].DATE.prototype.stringify(val, { timezone: timeZone });
			}
		}
		return originalEscape(val, timeZone, dialect, format);
	};

	/**
	 * install Oracle dialect loader inside Sequelize class
	 */
	const lib = require('sequelize/lib/sequelize');
	lib.Sequelize = class Oracleize extends lib.Sequelize {
		getDialect() {
			const dialect = super.getDialect();
			if(this.dialect || dialect !== 'oracle') {
				return dialect;
			}

			// require oracledb instead of mariadb
			if(typeof jest !== 'undefined') {
				const prefix = fs.existsSync(path.resolve(__dirname, '../sequelize'))
					? '../' // used for testing the surrounding app
					: ''; // used for local testing
				const moduleName = prefix + 'sequelize/lib/dialects/mariadb';
				jest.mock(moduleName, () => {
					jest.unmock(moduleName);
					return require('./oracle');
				});
			} else {
				const originalRequire = Module.prototype.require;
				Module.prototype.require = function(id) {
					if(id === './dialects/mariadb') {
						Module.prototype.require = originalRequire;
						return require('./oracle');
					}
					return originalRequire.apply(this, arguments);
				};
			}

			return 'mariadb';
		}
	};
}

install();

module.exports = require('sequelize');
