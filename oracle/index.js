'use strict';
const _ = require('lodash');
const AbstractDialect = require('../abstract');
const oracle_connection_manager_1 = require('./connection-manager');
const oracle_query_1 = require('./query');
const oracle_query_generator_1 = require('./query-generator');
const oracle_query_interface_1 = require('./query-interface');
const DataTypes = require('../../data-types').oracle;
const Globals = require('./globals');

class OracleDialect extends AbstractDialect {
	constructor(sequelize) {
		super();
		this.sequelize = sequelize;
		this.connectionManager = new oracle_connection_manager_1.OracleConnectionManager(this, sequelize);
		this.connectionManager.initPools();
		this.queryGenerator = new oracle_query_generator_1.OracleQueryGenerator({
			options: sequelize.options,
			_dialect: this,
			sequelize
		});
		this.queryInterface = this.createQueryInterface();
		this.connectionManager.defaultVersion = '12.1.0.2.0';
		this.Query = oracle_query_1.OracleQuery;
		if(sequelize.options.dialectOptions) {
			const noTimezone = sequelize.options.dialectOptions.noTimezone || false;
			Globals.dialectOptions = {
				oracle: {
					noTimezone
				}
			};
			delete sequelize.options.dialectOptions.noTimezone;
		}
		this.DataTypes = DataTypes;
		this.name = 'oracle';
		this.TICK_CHAR = '';
		this.TICK_CHAR_LEFT = this.TICK_CHAR;
		this.TICK_CHAR_RIGHT = this.TICK_CHAR;
		this.supports = _.merge(_.cloneDeep(AbstractDialect.prototype.supports), {
			'VALUES ()': true,
			'LIMIT ON UPDATE': true,
			'IGNORE': ' IGNORE',
			'lock': false,
			'forShare': ' IN SHARE MODE',
			'index': {
				collate: false,
				length: false,
				parser: false,
				type: false,
				using: false
			},
			'constraints': {
				restrict: false
			},
			'returnValues': false,
			'ORDER NULLS': true,
			'ignoreDuplicates': false,
			'schemas': true,
			'updateOnDuplicate': false,
			'indexViaAlter': false,
			'NUMERIC': true,
			'upserts': true,
			'GEOMETRY': false
		});
	}

	createQueryInterface() {
		return new oracle_query_interface_1.OracleQueryInterface(this.sequelize, this.queryGenerator);
	}
}

module.exports = OracleDialect;
//# sourceMappingURL=oracle-dialect.js.map