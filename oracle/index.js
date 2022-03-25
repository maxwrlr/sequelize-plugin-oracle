'use strict';
const _ = require('lodash');
const AbstractDialect = require('sequelize/lib/dialects/abstract/index');
const { OracleConnectionManager } = require('./connection-manager');
const { OracleQuery } = require('./query');
const { OracleQueryGenerator } = require('./query-generator');
const { OracleQueryInterface } = require('./query-interface');
const DataTypes = require('sequelize/lib/data-types').oracle;
const Globals = require('./globals');

class OracleDialect extends AbstractDialect {
	constructor(sequelize) {
		super();
		this.sequelize = sequelize;
		this.connectionManager = new OracleConnectionManager(this, sequelize);
		this.connectionManager.initPools();
		this.queryGenerator = new OracleQueryGenerator({
			options: sequelize.options,
			_dialect: this,
			sequelize
		});
		this.queryInterface = new OracleQueryInterface(this.sequelize, this.queryGenerator);
		this.connectionManager.defaultVersion = '12.1.0.2.0';
		this.Query = OracleQuery;
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
}

module.exports = OracleDialect;
