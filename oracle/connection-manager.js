'use strict';
const sequelizeErrors = require('../../errors/index');
const AbstractConnectionManager = require('../abstract/connection-manager');
const ParserStore = require('../parserStore');
exports.store = ParserStore('oracle');

class OracleConnectionManager extends AbstractConnectionManager {
	constructor(dialect, sequelize) {
		super(dialect, sequelize);
		this.sequelize = sequelize;
		this.sequelize.config.port = this.sequelize.config.port || 1521;
		try {
			if(sequelize.config.dialectModulePath) {
				this.lib = require(sequelize.config.dialectModulePath);
			} else {
				this.lib = require('oracledb');
				this.lib.maxRows = 1000;
				if(sequelize.config && 'dialectOptions' in sequelize.config) {
					const dialectOptions = sequelize.config.dialectOptions;
					if(dialectOptions && 'maxRows' in dialectOptions) {
						this.lib.maxRows = sequelize.config.dialectOptions.maxRows;
					}
					if(dialectOptions && 'fetchAsString' in dialectOptions) {
						this.lib.fetchAsString = sequelize.config.dialectOptions.fetchAsString;
					} else {
						this.lib.fetchAsString = [this.lib.CLOB];
					}
				}
			}
		} catch(err) {
			if(err.code === 'MODULE_NOT_FOUND') {
				throw new Error('Please install oracledb package manually');
			}
			throw err;
		}
	}

	/**
	 * Method for checking the config object passed and generate the full database if not fully passed
	 * With dbName, host and port, it generates a string like this : 'host:port/dbname'
	 * @hidden
	 */
	checkConfigObject(config) {
		//A connectString should be defined
		if(config.database.length === 0) {
			let errorToThrow = 'The database cannot be blank, you must specify the database name (which correspond to the service name';
			errorToThrow += '\n from tnsnames.ora : (HOST = mymachine.example.com)(PORT = 1521)(SERVICE_NAME = orcl)';
			throw new Error(errorToThrow);
		}
		if(!config.host || config.host.length === 0) {
			throw new Error('You have to specify the host');
		}
		//The connectString has a special format, we check it
		//ConnectString format is : host:[port]/service_name
		if(!config.dialectOptions || config.dialectOptions.validate !== false && config.database.indexOf('/') === -1) {
			let connectString = config.host;
			if(config.port && config.port !== 0) {
				connectString += `:${config.port}`;
			} else {
				connectString += ':1521'; //Default port number
			}
			connectString += `/${config.database}`;

			config = Object.assign({}, config);
			config.database = connectString;
		}

		return config;
	}

	/**
	 * Expose this as a method so that the parsing may be updated when the user has added additional, custom types
	 */
	_refreshTypeParser(dataType) {
		exports.store.refresh(dataType);
	}

	/**
	 * clear all type parser
	 */
	_clearTypeParser() {
		exports.store.clear();
	}

	_onProcessExit() {
		// copied from AbstractConnectionManager
		if(!this.pool) {
			return Promise.resolve();
		}

		if(this.pool && this.pool.terminate) {
			this.pool.terminate();
		}
	}

	initPools() {
		const config = this.checkConfigObject(this.config);

		this.pool = (this.lib || require('oracledb')).createPool({
			connectString: config.database,
			user: config.username,
			password: config.password,
			poolMax: config.pool.max || 10,
			poolMin: config.pool.min || 1,
			queueTimeout: Math.min(30000, config.pool.acquire),
			poolTimeout: Math.min(30, config.pool.idle / 1000)
		}).then((pool) => this.pool = pool);
	}

	/**
	 * connect to the database
	 */
	connect(config) {
		const self = this;
		return new Promise(async(resolve, reject) => {
			await self.pool; // Ensure pool is ready
			return self.pool.getConnection().then(connection => {
				//Not relevant, node-oracledb considers it if multiple connections are opened / closed; while testing, a few connections are created and closed.
				//We change the session NLS_COMP and NLS_SORT to allow search case insensitive (http://stackoverflow.com/questions/5391069/case-insensitive-searching-in-oracle)
				const alterSessionQry = 'BEGIN EXECUTE IMMEDIATE \'ALTER SESSION SET NLS_COMP=LINGUISTIC\'; EXECUTE IMMEDIATE \'ALTER SESSION SET NLS_SORT=BINARY_CI\'; END;';
				return connection.execute(alterSessionQry).then(() => {
					return connection.commit().then(() => {
						resolve(connection);
					});
				});
			}).catch(err => {
				if(err) {
					//We split to get the error number; it comes as ORA-XXXXX:
					let errorCode = err.message.split(':');
					errorCode = errorCode[0];
					switch(errorCode) {
						case 'ORA-28000'://Account locked
							reject(new sequelizeErrors.ConnectionRefusedError(err));
						case 'ORA-01017'://ORA-01017: invalid username/password; logon denied
							reject(new sequelizeErrors.AccessDeniedError(err));
						case 'ORA-12154'://ORA-12154: TNS:could not resolve the connect identifier specified
							reject(new sequelizeErrors.HostNotReachableError(err));
						case 'ORA-12514':// ORA-12514: TNS:listener does not currently know of service requested in connect descriptor
							reject(new sequelizeErrors.HostNotFoundError(err));
						case 'ORA-12541'://ORA-12541: TNS:No listener
							reject(new sequelizeErrors.HostNotFoundError(err));
						default:
							reject(new sequelizeErrors.ConnectionError(err));
					}
				}
			}).tap(connection => {
				return Promise.resolve(connection);
			});
		});
	}

	/**
	 * @param options
	 * @return {Promise<any>}
	 */
	getConnection(options) {
		return new Promise(async(resolve, reject) => {
			try {
				await this.pool;
				resolve(await this.pool.getConnection());
			} catch(err) {
				reject(new sequelizeErrors.ConnectionError(err));
			}
		});
	}

	releaseConnection(connection, force) {
		return new Promise(async(resolve) => {
			await connection.release();
			resolve();
		});
	}

	/**
	 * disconnect of the database
	 */
	disconnect(connection) {
		return new Promise((resolve, reject) => {
			return connection.close().then(resolve)
				.catch(err => {
					reject(new sequelizeErrors.ConnectionError(err));
				});
		});
	}

	/**
	 * validate the connection
	 */
	validate(connection) {
		return connection && ['disconnected', 'protocol_error'].indexOf(connection.state) === -1;
	}
}

exports.OracleConnectionManager = OracleConnectionManager;
//# sourceMappingURL=oracle-connection-manager.js.map
