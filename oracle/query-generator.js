'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
/* jshint -W110 */
const jscrc = require('js-crc');
const _ = require('lodash');
const oracleDb = require('oracledb');
const semver = require('semver');
const uuid = require('uuid');
const Utils = require('sequelize/lib/utils');
const AbstractQueryGenerator = require('sequelize/lib/dialects/abstract/query-generator');
const { Op, DataTypes } = require('sequelize');
const crc32 = jscrc.crc32;
//List of Oracle reserved words https://docs.oracle.com/cd/B19306_01/em.102/b40103/app_oracle_reserved_words.htm
const oracleReservedWords = ['ACCESS', 'ACCOUNT', 'ACTIVATE', 'ADD', 'ADMIN', 'ADVISE', 'AFTER', 'ALL', 'ALL_ROWS', 'ALLOCATE', 'ALTER', 'ANALYZE', 'AND', 'ANY', 'ARCHIVE',
	'ARCHIVELOG', 'ARRAY', 'AS', 'ASC', 'AT', 'AUDIT', 'AUTHENTICATED', 'AUTHORIZATION', 'AUTOEXTEND', 'AUTOMATIC', 'BACKUP', 'BECOME', 'BEFORE', 'BEGIN', 'BETWEEN', 'BFILE',
	'BITMAP', 'BLOB', 'BLOCK', 'BODY', 'BY', 'CACHE', 'CACHE_INSTANCES', 'CANCEL', 'CASCADE', 'CAST', 'CFILE', 'CHAINED', 'CHANGE', 'CHAR', 'CHAR_CS', 'CHARACTER', 'CHECK', 'CHECKPOINT',
	'CHOOSE', 'CHUNK', 'CLEAR', 'CLOB', 'CLONE', 'CLOSE', 'CLOSE_CACHED_OPEN_CURSORS', 'CLUSTER', 'COALESCE', 'COLUMN', 'COLUMNS', 'COMMENT', 'COMMIT', 'COMMITTED', 'COMPATIBILITY',
	'COMPILE', 'COMPLETE', 'COMPOSITE_LIMIT', 'COMPRESS', 'COMPUTE', 'CONNECT', 'CONNECT_TIME', 'CONSTRAINT', 'CONSTRAINTS', 'CONTENTS', 'CONTINUE', 'CONTROLFILE', 'CONVERT', 'COST',
	'CPU_PER_CALL', 'CPU_PER_SESSION', 'CREATE', 'CURRENT', 'CURRENT_SCHEMA', 'CURREN_USER', 'CURSOR', 'CYCLE', 'DANGLING', 'DATABASE', 'DATAFILE', 'DATAFILES', 'DATAOBJNO', 'DATE', 'DBA',
	'DBHIGH', 'DBLOW', 'DBMAC', 'DEALLOCATE', 'DEBUG', 'DEC', 'DECIMAL', 'DECLARE', 'DEFAULT', 'DEFERRABLE', 'DEFERRED', 'DEGREE', 'DELETE', 'DEREF', 'DESC', 'DIRECTORY', 'DISABLE', 'DISCONNECT',
	'DISMOUNT', 'DISTINCT', 'DISTRIBUTED', 'DML', 'DOUBLE', 'DROP', 'DUMP', 'EACH', 'ELSE', 'ENABLE', 'END', 'ENFORCE', 'ENTRY', 'ESCAPE', 'EXCEPT', 'EXCEPTIONS', 'EXCHANGE', 'EXCLUDING',
	'EXCLUSIVE', 'EXECUTE', 'EXISTS', 'EXPIRE', 'EXPLAIN', 'EXTENT', 'EXTENTS', 'EXTERNALLY', 'FAILED_LOGIN_ATTEMPTS', 'FALSE', 'FAST', 'FILE', 'FIRST_ROWS', 'FLAGGER', 'FLOAT', 'FLOB',
	'FLUSH', 'FOR', 'FORCE', 'FOREIGN', 'FREELIST', 'FREELISTS', 'FROM', 'FULL', 'FUNCTION', 'GLOBAL', 'GLOBALLY', 'GLOBAL_NAME', 'GRANT', 'GROUP', 'GROUPS', 'HASH', 'HASHKEYS', 'HAVING',
	'HEADER', 'HEAP', 'IDENTIFIED', 'IDGENERATORS', 'IDLE_TIME', 'IF', 'IMMEDIATE', 'IN', 'INCLUDING', 'INCREMENT', 'INDEX', 'INDEXED', 'INDEXES', 'INDICATOR', 'IND_PARTITION', 'INITIAL',
	'INITIALLY', 'INITRANS', 'INSERT', 'INSTANCE', 'INSTANCES', 'INSTEAD', 'INT', 'INTEGER', 'INTERMEDIATE', 'INTERSECT', 'INTO', 'IS', 'ISOLATION', 'ISOLATION_LEVEL', 'KEEP', 'KEY', 'KILL',
	'LABEL', 'LAYER', 'LESS', 'LEVEL', 'LIBRARY', 'LIKE', 'LIMIT', 'LINK', 'LIST', 'LOB', 'LOCAL', 'LOCK', 'LOCKED', 'LOG', 'LOGFILE', 'LOGGING', 'LOGICAL_READS_PER_CALL',
	'LOGICAL_READS_PER_SESSION', 'LONG', 'MANAGE', 'MASTER', 'MAX', 'MAXARCHLOGS', 'MAXDATAFILES', 'MAXEXTENTS', 'MAXINSTANCES', 'MAXLOGFILES', 'MAXLOGHISTORY', 'MAXLOGMEMBERS', 'MAXSIZE',
	'MAXTRANS', 'MAXVALUE', 'MIN', 'MEMBER', 'MINIMUM', 'MINEXTENTS', 'MINUS', 'MINVALUE', 'MLSLABEL', 'MLS_LABEL_FORMAT', 'MODE', 'MODIFY', 'MOUNT', 'MOVE', 'MTS_DISPATCHERS', 'MULTISET',
	'NATIONAL', 'NCHAR', 'NCHAR_CS', 'NCLOB', 'NEEDED', 'NESTED', 'NETWORK', 'NEW', 'NEXT', 'NOARCHIVELOG', 'NOAUDIT', 'NOCACHE', 'NOCOMPRESS', 'NOCYCLE', 'NOFORCE', 'NOLOGGING', 'NOMAXVALUE',
	'NOMINVALUE', 'NONE', 'NOORDER', 'NOOVERRIDE', 'NOPARALLEL', 'NOPARALLEL', 'NOREVERSE', 'NORMAL', 'NOSORT', 'NOT', 'NOTHING', 'NOWAIT', 'NULL', 'NUMBER', 'NUMERIC', 'NVARCHAR2', 'OBJECT',
	'OBJNO', 'OBJNO_REUSE', 'OF', 'OFF', 'OFFLINE', 'OID', 'OIDINDEX', 'OLD', 'ON', 'ONLINE', 'ONLY', 'OPCODE', 'OPEN', 'OPTIMAL', 'OPTIMIZER_GOAL', 'OPTION', 'OR', 'ORDER', 'ORGANIZATION',
	'OSLABEL', 'OVERFLOW', 'OWN', 'PACKAGE', 'PARALLEL', 'PARTITION', 'PASSWORD', 'PASSWORD_GRACE_TIME', 'PASSWORD_LIFE_TIME', 'PASSWORD_LOCK_TIME', 'PASSWORD_REUSE_MAX', 'PASSWORD_REUSE_TIME',
	'PASSWORD_VERIFY_FUNCTION', 'PCTFREE', 'PCTINCREASE', 'PCTTHRESHOLD', 'PCTUSED', 'PCTVERSION', 'PERCENT', 'PERMANENT', 'PLAN', 'PLSQL_DEBUG', 'POST_TRANSACTION', 'PRECISION', 'PRESERVE',
	'PRIMARY', 'PRIOR', 'PRIVATE', 'PRIVATE_SGA', 'PRIVILEGE', 'PRIVILEGES', 'PROCEDURE', 'PROFILE', 'PUBLIC', 'PURGE', 'QUEUE', 'QUOTA', 'RANGE', 'RAW', 'RBA', 'READ', 'READUP', 'REAL', 'REBUILD',
	'RECOVER', 'RECOVERABLE', 'RECOVERY', 'REF', 'REFERENCES', 'REFERENCING', 'REFRESH', 'RENAME', 'REPLACE', 'RESET', 'RESETLOGS', 'RESIZE', 'RESOURCE', 'RESTRICTED', 'RETURN', 'RETURNING',
	'REUSE', 'REVERSE', 'REVOKE', 'ROLE', 'ROLES', 'ROLLBACK', 'ROW', 'ROWID', 'ROWNUM', 'ROWS', 'RULE', 'SAMPLE', 'SAVEPOINT', 'SB4', 'SCAN_INSTANCES', 'SCHEMA', 'SCN', 'SCOPE', 'SD_ALL',
	'SD_INHIBIT', 'SD_SHOW', 'SEGMENT', 'SEG_BLOCK', 'SEG_FILE', 'SELECT', 'SEQUENCE', 'SERIALIZABLE', 'SESSION', 'SESSION_CACHED_CURSORS', 'SESSIONS_PER_USER', 'SET', 'SHARE', 'SHARED',
	'SHARED_POOL', 'SHRINK', 'SIZE', 'SKIP', 'SKIP_UNUSABLE_INDEXES', 'SMALLINT', 'SNAPSHOT', 'SOME', 'SORT', 'SPECIFICATION', 'SPLIT', 'SQL_TRACE', 'STANDBY', 'START', 'STATEMENT_ID',
	'STATISTICS', 'STOP', 'STORAGE', 'STORE', 'STRUCTURE', 'SUCCESSFUL', 'SWITCH', 'SYS_OP_ENFORCE_NOT_NULL$', 'SYS_OP_NTCIMG$', 'SYNONYM', 'SYSDATE', 'SYSDBA', 'SYSOPER', 'SYSTEM', 'TABLE',
	'TABLES', 'TABLESPACE', 'TABLESPACE_NO', 'TABNO', 'TEMPORARY', 'THAN', 'THE', 'THEN', 'THREAD', 'TIMESTAMP', 'TIME', 'TO', 'TOPLEVEL', 'TRACE', 'TRACING', 'TRANSACTION', 'TRANSITIONAL',
	'TRIGGER', 'TRIGGERS', 'TRUE', 'TRUNCATE', 'TX', 'TYPE', 'UB2', 'UBA', 'UID', 'UNARCHIVED', 'UNDO', 'UNION', 'UNIQUE', 'UNLIMITED', 'UNLOCK', 'UNRECOVERABLE', 'UNTIL', 'UNUSABLE', 'UNUSED',
	'UPDATABLE', 'UPDATE', 'USAGE', 'USE', 'USER', 'USING', 'VALIDATE', 'VALIDATION', 'VALUE', 'VALUES', 'VARCHAR', 'VARCHAR2', 'VARYING', 'VIEW', 'WHEN', 'WHENEVER', 'WHERE', 'WITH', 'WITHOUT',
	'WORK', 'WRITE', 'WRITEDOWN', 'WRITEUP', 'XID', 'YEAR', 'ZONE'];

/**
 * Split a unicode string into chunks of the given size.
 */
function splitLongString(str, chunkSize = 4000) {
	if(str.length <= chunkSize) {
		return [str];
	}

	const textEncoder = new TextEncoder();

	// Create chunks based on byte size of characters.
	const chunks = [''];
	for(const char of str) {
		const j = chunks.length - 1;
		if(textEncoder.encode(chunks[j] + char).length <= chunkSize) {
			chunks[j] += char;
		} else {
			chunks.push(char);
		}
	}

	return chunks;
}

function concatLongStringFromClobs(sequelize, str) {
	const chunks = splitLongString(str);
	return chunks.map(c => `to_clob(${sequelize.escape(c)})`).join('||');
}

class OracleQueryGenerator extends AbstractQueryGenerator {
	constructor(options) {
		super(options);
		this.dialect = 'oracle';
	}

	getAliasToken() {
		return '';
	}

	throwMethodUndefined(methodName) {
		throw new Error('The method "' + methodName + '" is not defined! Please add it to your sql dialect.');
	}

	/**
	 * return a query to create a schema
	 */
	createSchema(schema) {
		schema = this.quoteIdentifier(schema);
		return [
			'DECLARE',
			'  V_COUNT INTEGER;',
			'  V_CURSOR_NAME INTEGER;',
			'  V_RET INTEGER;',
			'BEGIN',
			'  SELECT COUNT(1) INTO V_COUNT FROM ALL_USERS WHERE USERNAME = ', this.wrapSingleQuote(schema), ';',
			'  IF V_COUNT = 0 THEN',
			'    EXECUTE IMMEDIATE ', this.wrapSingleQuote('CREATE USER ' + schema + ' IDENTIFIED BY 12345 DEFAULT TABLESPACE USERS'), ';',
			'    EXECUTE IMMEDIATE ', this.wrapSingleQuote('GRANT "CONNECT" TO ' + schema), ';',
			'    EXECUTE IMMEDIATE ', this.wrapSingleQuote('GRANT create table TO ' + schema), ';',
			'    EXECUTE IMMEDIATE ', this.wrapSingleQuote('GRANT create view TO ' + schema), ';',
			'    EXECUTE IMMEDIATE ', this.wrapSingleQuote('GRANT create any trigger TO ' + schema), ';',
			'    EXECUTE IMMEDIATE ', this.wrapSingleQuote('GRANT create any procedure TO ' + schema), ';',
			'    EXECUTE IMMEDIATE ', this.wrapSingleQuote('GRANT create sequence TO ' + schema), ';',
			'    EXECUTE IMMEDIATE ', this.wrapSingleQuote('GRANT create synonym TO ' + schema), ';',
			'    EXECUTE IMMEDIATE ', this.wrapSingleQuote('ALTER USER ' + schema + ' QUOTA UNLIMITED ON USERS'), ';',
			'  END IF;',
			'END;'
		].join(' ');
	}

	/**
	 * return a query to show the schema
	 */
	showSchemasQuery() {
		return 'SELECT USERNAME AS "schema_name" FROM ALL_USERS WHERE ORACLE_MAINTAINED = (\'N\') AND USERNAME != user';
	}

	/**
	 * return a query to drop the schema
	 */
	dropSchema(tableName) {
		return 'DROP USER ' + this.quoteTable(tableName) + ' CASCADE';
	}

	versionQuery() {
		return 'SELECT VERSION FROM PRODUCT_COMPONENT_VERSION WHERE PRODUCT LIKE \'Oracle%\'';
	}

	tableExistsQuery(table) {
		const tableName = this.escape(this.quoteTable(table));
		return `SELECT TABLE_NAME
                FROM ALL_TABLES
                WHERE TABLE_NAME = ${tableName}
                  AND OWNER = ${this.escape(this.sequelize.config.username)}`;
	}

	/**
	 * return a query to create a table
	 */
	createTableQuery(tableName, attributes, options) {
		let query = 'CREATE TABLE <%= table %> (<%= attributes %>)';
		const completeQuery = 'BEGIN EXECUTE IMMEDIATE \'<%= createTableQuery %>\'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -955 THEN RAISE; END IF; END;';
		const primaryKeys = [];
		const foreignKeys = {};
		const attrStr = [];
		const checkStr = [];
		const values = {
			table: this.quoteTable(tableName)
		};
		const regex = /REFERENCES ([a-zA-Z_.0-9]*) \((.*)\)/g; //Global regex
		const chkRegex = /CHECK \(([a-zA-Z_.0-9]*) (.*)\)/g; //Check regex
		//Starting by dealing with all attributes
		Object.keys(attributes).forEach(attr => {
			const dataType = attributes[attr];
			let mainMatch;
			attr = this.quoteIdentifier(attr);
			// ORACLE doesn't support inline REFERENCES declarations: move to the end
			if(_.includes(dataType, 'PRIMARY KEY')) {
				//Primary key
				primaryKeys.push(attr);
				if(_.includes(dataType, 'REFERENCES')) {
					mainMatch = dataType.match(/^(.+) (REFERENCES.*)$/);
					attrStr.push(attr + ' ' + mainMatch[1].replace(/PRIMARY KEY/, ''));
					foreignKeys[attr] = mainMatch[2].replace(regex, (match, table, column) => {
						//We don't want the table name to be quoted if we pass the schema name
						let replaceTableName = '';
						if(_.isPlainObject(table)) {
							if(table.schema) {
								replaceTableName = this.quoteTable(table.schema) + '.';
							}
							replaceTableName += this.quoteTable(table.tableName);
						} else {
							replaceTableName = _.includes(oracleReservedWords, table.toUpperCase()) ? '"' + table + '"' : table;
						}
						return `REFERENCES ${replaceTableName} (${this.quoteIdentifier(column)})`;
					});
				} else {
					attrStr.push(attr + ' ' + dataType.replace(/PRIMARY KEY/, '').trim());
				}
			} else if(_.includes(dataType, 'REFERENCES')) {
				//Foreign key
				mainMatch = dataType.match(/^(.+) (REFERENCES.*)$/);
				attrStr.push(attr + ' ' + mainMatch[1]);
				foreignKeys[attr] = mainMatch[2].replace(regex, (match, table, column) => {
					//We don't want the table name to be quoted if we pass the schema name
					let replaceTableName = '';
					if(_.isPlainObject(table)) {
						if(table.schema) {
							replaceTableName = this.quoteTable(table.schema) + '.';
						}
						replaceTableName += this.quoteTable(table.tableName);
					} else {
						replaceTableName = _.includes(oracleReservedWords, table.toUpperCase()) ? '"' + table + '"' : table;
					}
					return `REFERENCES ${replaceTableName} (${this.quoteIdentifier(column)})`;
				});
			} else if(_.includes(dataType, 'CHECK')) {
				//Check constraints go to the end
				mainMatch = dataType.match(/^(.+) (CHECK.*)$/);
				attrStr.push(attr + ' ' + mainMatch[1]);
				mainMatch[2] = mainMatch[2].replace('ATTRIBUTENAME', attr);
				const checkCond = mainMatch[2].replace(chkRegex, (match, column, condition) => {
					return `CHECK (${this.quoteIdentifier(column)} ${condition})`;
				});
				checkStr.push(checkCond);
			} else {
				attrStr.push(attr + ' ' + dataType);
			}
		});
		values.attributes = attrStr.join(', ');

		if(primaryKeys.length) {
			// note: Oracle doesn't support names with more that 32 characters
			const primaryKeyName = `PK_${values.table}`.substring(0, 32);
			const primaryKeyColumns = primaryKeys.map(pk => this.quoteIdentifier(pk)).join(',');
			values.attributes += `,CONSTRAINT ${primaryKeyName} PRIMARY KEY (${primaryKeyColumns})`;
		}

		// dealing with FKs
		Object.keys(foreignKeys).forEach(fkey => {
			//Oracle default response for FK, doesn't support if defined
			if(foreignKeys[fkey].indexOf('ON DELETE NO ACTION') > -1) {
				foreignKeys[fkey] = foreignKeys[fkey].replace('ON DELETE NO ACTION', '');
			}
			let fkName = `FK_${values.table}_${fkey}`.replace(/[."]/g, '');
			//Oracle doesn't support names with more that 32 characters, so we replace it by FK CRC(columns)
			if(fkName.length > 32) {
				fkName = `FK_${values.table}_${crc32(fkey)}`.replace(/[."]/g, '');
				//If the name is still too long (table name very long), we generate only FK CRC(table_columns)
				if(fkName.length > 32) {
					const crcName = crc32(`${values.table}_${fkey}`);
					fkName = `FK_${crcName}`.replace(/[."]/g, '');
				}
			}
			values.attributes += ',CONSTRAINT ' + fkName + ' FOREIGN KEY (' + this.quoteIdentifier(fkey) + ') ' + foreignKeys[fkey];
		});
		if(checkStr.length > 0) {
			values.attributes += ', ' + checkStr.join(', ');
		}
		//Specific case for unique indexes with Oracle, we have to set the constraint on the column, if not, no FK will be possible (ORA-02270: no matching unique or primary key for this column-list)
		if(options && options.indexes && options.indexes.length > 0) {
			const idxToDelete = [];
			options.indexes.forEach((index, idx) => {
				if('unique' in index && (index.unique === true || (index.unique.length > 0 && index.unique !== false))) {
					//If unique index, transform to unique constraint on column
					const fields = index.fields.map(field => {
						if(typeof field === 'string') {
							return field;
						} else {
							return field.attribute;
						}
					});
					//Now we have to be sure that the constraint isn't already declared in uniqueKeys
					let canContinue = true;
					if(options.uniqueKeys) {
						const keys = Object.keys(options.uniqueKeys);
						for(let fieldIdx = 0; fieldIdx < keys.length; fieldIdx++) {
							const currUnique = options.uniqueKeys[keys[fieldIdx]];
							if(currUnique.fields.length === fields.length) {
								//lengths are the same, possible same constraint
								for(let i = 0; i < currUnique.fields.length; i++) {
									const field = currUnique.fields[i];
									if(_.includes(fields, field)) {
										canContinue = false;
									} else {
										//We have at least one different column, even if we found the same columns previously, we let the constraint be created
										canContinue = true;
										break;
									}
								}
							}
						}
						if(canContinue) {
							let indexName = 'name' in index ? index.name : '';
							if(indexName === '' || indexName.length > 30) {
								indexName = this._generateUniqueConstraintName(values.table, fields);
							}
							const constraintToAdd = {
								name: indexName,
								fields
							};
							if(!('uniqueKeys' in options)) {
								options.uniqueKeys = {};
							}
							options.uniqueKeys[indexName] = constraintToAdd;
							idxToDelete.push(idx);
						} else {
							//The constraint already exists, we remove it from the list
							idxToDelete.push(idx);
						}
					}
				}
			});
			idxToDelete.forEach(idx => {
				options.indexes.splice(idx, 1);
			});
		}
		if(options && !!options.uniqueKeys) {
			Object.keys(options.uniqueKeys).forEach(indexName => {
				const columns = options.uniqueKeys[indexName];
				let canBeUniq = false;
				//Check if we can create the unique key
				primaryKeys.forEach(primaryKey => {
					//We can create an unique constraint if it's not on the primary key AND if it doesn't have unique in its definition
					if(!_.includes(columns.fields, primaryKey)) {
						canBeUniq = true;
					}
				});
				columns.fields.forEach(field => {
					let currField = '';
					if(!_.isString(field)) {
						currField = field.attribute.replace(/[.,"\s]/g, '');
					} else {
						currField = field.replace(/[.,"\s]/g, '');
					}
					if(currField in attributes) {
						if(attributes[currField].toUpperCase().indexOf('UNIQUE') > -1) {
							//We generate the attribute without UNIQUE
							const attrToReplace = attributes[currField].replace('UNIQUE', '');
							//We replace in the final string
							values.attributes = values.attributes.replace(attributes[currField], attrToReplace);
						}
					}
				});
				//Oracle cannot have an unique AND a primary key on the same fields, prior to the primary key
				if(canBeUniq) {
					if(!_.isString(indexName)) {
						indexName = this._generateUniqueConstraintName(values.table, columns.fields);
					}
					//Oracle doesn't support names with more that 32 characters, so we replace it by PK timestamp
					if(indexName.length > 30) {
						indexName = this._generateUniqueConstraintName(values.table, columns.fields);
					}
					const indexUpperName = indexName.toUpperCase();
					if(_.includes(oracleReservedWords, indexUpperName) || indexUpperName.charAt(0) === '_') {
						indexName = '"' + indexName + '"';
					}
					const index = options.uniqueKeys[columns.name];
					delete options.uniqueKeys[columns.name];
					indexName = indexName.replace(/[.,\s]/g, '');
					columns.name = indexName;
					options.uniqueKeys[indexName] = index;
					values.attributes += ', CONSTRAINT ' + indexName + ' UNIQUE ('
						+ columns.fields.map(s => this.quoteIdentifier(s)).join(', ')
						+ ')';
				}
			});
		}
		query = _.template(query)(values).trim();
		//we replace single quotes by two quotes in order for the execute statement to work
		query = query.replace(/'/g, '\'\'');
		values.createTableQuery = query;
		return _.template(completeQuery)(values).trim();
	}

	/**
	 * Generates a name for an unique constraint with the pattern : uniqTABLENAMECOLUMNNAMES
	 * If this indexName is too long for Oracle, it's hashed to have an acceptable length
	 * @hidden
	 */
	_generateUniqueConstraintName(table, columns) {
		let indexName = `uniq${table}${columns.join('')}`.replace(/[.,"\s]/g, '').toLowerCase();
		//Oracle doesn't support names with more that 32 characters, so we replace it by PK timestamp
		//Si version oracle < 12.2
		const isMinorTwelveTwo = semver.valid(this.sequelize.options.databaseVersion) && semver.lt(this.sequelize.options.databaseVersion, '12.2.0');
		if(isMinorTwelveTwo && indexName.length > 30) {
			indexName = `uniq${table}${crc32(columns.join(''))}`.replace(/[.,"\s]/g, '').toLowerCase();
			if(indexName.length > 30) {
				const crcName = crc32(`${table}_${columns.join('')}`);
				indexName = `uniq${crcName}`.replace(/[.,"\s]/g, '').toLowerCase();
			}
		}
		return indexName;
	}

	/**
	 * return a select query to describe the table
	 */
	describeTableQuery(tableName, schema) {
		//name, type, datalength (except number / nvarchar), datalength varchar, datalength number, nullable, default value, primary ?
		const sql = ['SELECT atc.COLUMN_NAME, atc.DATA_TYPE, atc.DATA_LENGTH, atc.CHAR_LENGTH, atc.DEFAULT_LENGTH, atc.NULLABLE, ',
			'CASE WHEN ucc.CONSTRAINT_NAME  LIKE\'%PK%\' THEN \'PRIMARY\' ELSE \'\' END AS "PRIMARY" ',
			'FROM all_tab_columns atc ',
			'LEFT OUTER JOIN all_cons_columns ucc ON(atc.table_name = ucc.table_name AND atc.COLUMN_NAME = ucc.COLUMN_NAME ) ',
			schema ? 'WHERE (atc.OWNER=UPPER(\'<%= schema %>\') OR atc.OWNER=\'<%= schema %>\') ' : 'WHERE atc.OWNER=(SELECT USER FROM DUAL) ',
			'AND (atc.TABLE_NAME=UPPER(\'<%= tableName %>\') OR atc.TABLE_NAME=\'<%= tableName %>\')',
			'ORDER BY "PRIMARY", atc.COLUMN_NAME'].join('');
		const currTableName = _.isPlainObject(tableName) ? tableName.tableName : tableName;
		const values = {
			tableName: currTableName,
			schema
		};
		return _.template(sql)(values).trim();
	}

	/**
	 * return a query to rename a table
	 */
	renameTableQuery(before, after) {
		const query = 'ALTER TABLE <%= before %> RENAME TO <%= after %>';
		return _.template(query)({
			before: this.quoteTable(before),
			after: this.quoteTable(after)
		});
	}

	/**
	 * return a query to show the constraints
	 */
	showConstraintsQuery(tableName) {
		return `SELECT CONSTRAINT_NAME constraint_name
                FROM user_cons_columns
                WHERE table_name = '${tableName.toUpperCase()}'`;
	}

	/**
	 * return a query to show the tables
	 */
	showTablesQuery() {
		return 'SELECT owner as table_schema, table_name, 0 as lvl FROM all_tables where OWNER IN(SELECT USERNAME AS "schema_name" FROM ALL_USERS WHERE ORACLE_MAINTAINED = \'N\')';
	}

	/**
	 * return a query to drop a table
	 */
	dropTableQuery(tableName) {
		let table = '';
		table = this.quoteTable(tableName);
		const query = [
			'BEGIN ',
			'EXECUTE IMMEDIATE \'DROP TABLE <%= table %> CASCADE CONSTRAINTS PURGE\';',
			' EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN',
			' RAISE; END IF;',
			'END;'
		];
		const values = {
			table
		};
		return _.template(query.join(''))(values).trim();
	}

	/**
	 * return a query to add a constraint
	 */
	addConstraintQuery(tableName, options) {
		options = options || {};
		//Oracle doesn't support On update
		delete options.onUpdate;
		const constraintSnippet = this.getConstraintSnippet(tableName, options);
		if(typeof tableName === 'string') {
			tableName = this.quoteIdentifiers(tableName);
		} else {
			tableName = this.quoteTable(tableName);
		}
		return `ALTER TABLE ${tableName}
            ADD ${constraintSnippet}`;
	}

	/**
	 * return a query to add a column to a table
	 */
	addColumnQuery(table, key, dataType) {
		dataType.field = key;
		const query = 'ALTER TABLE <%= table %> ADD (<%= attribute %>)';
		const attribute = _.template('<%= key %> <%= definition %>')({
			key: this.quoteIdentifier(key),
			definition: this.attributeToSQL(dataType, {
				context: 'addColumn'
			}).replace('ATTRIBUTENAME', key).replace(/'/g, '\'')
		});
		return _.template(query)({
			table: this.quoteTable(table),
			attribute
		});
	}

	/**
	 * return a query to remove a column of a table
	 */
	removeColumnQuery(tableName, attributeName) {
		const query = 'ALTER TABLE <%= tableName %> DROP COLUMN <%= attributeName %>';
		return _.template(query)({
			tableName: this.quoteTable(tableName),
			attributeName: this.quoteIdentifier(attributeName)
		});
	}

	/**
	 * return a query to change a column of a table
	 */
	changeColumnQuery(tableName, attributes) {
		const modifyQuery = 'ALTER TABLE <%= tableName %> MODIFY (<%= query %>)';
		const alterQuery = 'ALTER TABLE <%= tableName %> <%= query %>';
		let query = '';
		const attrString = [];
		const constraintString = [];
		Object.keys(attributes).forEach(attributeName => {
			let definition = attributes[attributeName];
			if(definition.match(/REFERENCES/)) {
				constraintString.push(_.template('<%= fkName %> FOREIGN KEY (<%= attrName %>) <%= definition %>')({
					fkName: attributeName + '_foreign_idx',
					attrName: attributeName,
					definition: definition.replace(/.+?(?=REFERENCES)/, '')
				}));
			} else {
				if(definition.indexOf('CHECK') > -1) {
					definition = definition.replace(/'/g, '\'\'');
				}
				attrString.push(_.template('<%= attrName %> <%= definition %>')({
					attrName: attributeName,
					definition
				}));
			}
		});
		let fullQuery = 'BEGIN '
			+ 'EXECUTE IMMEDIATE \'<%= fullQuery %>\';'
			+ ' EXCEPTION'
			+ ' WHEN OTHERS THEN'
			+ ' IF SQLCODE = -1442 OR SQLCODE = -1451 THEN'
			+ ' EXECUTE IMMEDIATE \'<%= secondQuery %>\';' //We execute the statement without the NULL / NOT NULL clause if the first statement failed due to this
			+ ' ELSE'
			+ ' RAISE;'
			+ ' END IF;'
			+ ' END;';
		let finalQuery = '';
		if(attrString.length) {
			finalQuery += attrString.join(', ');
			finalQuery += constraintString.length ? ' ' : '';
		}
		if(constraintString.length) {
			finalQuery += 'ADD CONSTRAINT ' + constraintString.join(', ');
			//Here, we don't use modify
			query = alterQuery;
		} else {
			query = modifyQuery;
		}
		query = _.template(query)({
			tableName: this.quoteTable(tableName),
			query: finalQuery
		});
		//Oracle doesn't support if we try to define a NULL / NOT NULL column if it is already in this case
		//see https://docs.oracle.com/cd/B28359_01/server.111/b28278/e900.htm#ORA-01451
		const secondQuery = query.replace('NOT NULL', '').replace('NULL', '');
		return fullQuery = _.template(fullQuery)({
			fullQuery: query,
			secondQuery
		});
	}

	/**
	 * return a query to rename a column of a table
	 */
	renameColumnQuery(tableName, attrBefore, attributes) {
		const query = 'ALTER TABLE <%= tableName %> RENAME COLUMN <%= before %> TO <%= after %>';
		const newName = Object.keys(attributes)[0];
		return _.template(query)({
			tableName: this.quoteTable(tableName),
			before: this.quoteIdentifier(attrBefore),
			after: this.quoteIdentifier(newName)
		});
	}

	updateQuery(tableName, updateValues, where, options, modelAttributes) {
		// Ensure string literal limit when updating TEXT.
		if(updateValues && typeof updateValues === 'object') {
			const textEncoder = new TextEncoder();
			for(const [key, value] of Object.entries(updateValues)) {
				if(typeof value !== 'string' || textEncoder.encode(value).length <= 4000) {
					continue;
				}

				if(modelAttributes) {
					const attr = modelAttributes[key] || Object.values(modelAttributes).find(a => a.field === key);
					if(attr && attr.type.key !== DataTypes.TEXT.key) {
						continue;
					}
				}

				updateValues[key] = this.sequelize.literal(
					concatLongStringFromClobs(this.sequelize, value)
				);
			}
		}

		return super.updateQuery(tableName, updateValues, where, options, modelAttributes);
	}

	/**
	 * Override of upsertQuery, Oracle specific
	 * Using PL/SQL for finding the row
	 */
	upsertQuery(tableName, insertValues, updateValues, where, modelAttributes, options) {
		if(_.isObject(where)) {
			// literals should be matched by using the equals operation
			where = _.mapValues(where, v => v instanceof Utils.SequelizeMethod ? { [Op.eq]: v } : v);
		}

		let {
			query: updateQuery,
			bind
		} = this.updateQuery(tableName, updateValues, where, options, modelAttributes);

		const sql = [
			'DECLARE ',
			'CURSOR findingRow IS ',
			`SELECT *
             FROM ${this.quoteTable(tableName)}`,
			where !== null && where !== undefined ? ' ' + this.whereQuery(where, options) : '',
			'; firstRow findingRow%ROWTYPE;',
			'BEGIN ',
			'OPEN findingRow; ',
			'FETCH findingRow INTO firstRow; ',
			'IF findingRow%FOUND THEN ',
			updateQuery,
			'; :isUpdate := 2; ',
			'ELSE ',
			this.insertQuery(tableName, insertValues, modelAttributes, options),
			'; :isUpdate := 1; ',
			'END IF; ',
			'CLOSE findingRow; ',
			'END;'
		];

		bind.out = {
			isUpdate: { dir: oracleDb.BIND_OUT, type: oracleDb.NUMBER }
		};

		return {
			query: sql.join(''),
			bind
		};
	}

	/*
	* Override of insertQuery, Oracle specific
	*/
	insertQuery(table, valueHash, modelAttributes, options) {
		options = options || {};

		if(options.updateOnDuplicate) {
			const where = Object.fromEntries(
				Object.entries(valueHash).filter(([k]) => options.upsertKeys.includes(k))
			);

			options.updateOnDuplicate = false;
			return this.upsertQuery(table, valueHash, valueHash, where, options);
		}

		_.defaults(options, this.options);
		const valueQuery = 'INSERT INTO <%= table %> (<%= attributes %>) VALUES (<%= values %>)';
		const emptyQuery = 'INSERT INTO <%= table %> VALUES (DEFAULT)';
		const fields = [];
		const values = [];
		const primaryKeys = [];
		const modelAttributeMap = {};
		const realTableName = this.quoteTable(table);
		const primaryKeyReturn = [];
		let query;
		let value;
		const inputParameters = {};
		const inputParamCpt = 0;
		//We have to specify a variable that will be used as return value for the id
		const returningQuery = '<%=valueQuery %> RETURNING <%=primaryKey %> INTO <%=primaryKeyReturn %>';
		if(modelAttributes) {
			//We search for the primaryKey
			const keys = Object.keys(modelAttributes);
			let idx = 0;
			while(idx < keys.length) {
				const AttributeKey = keys[idx];
				const modelAttribute = modelAttributes[AttributeKey];
				if(modelAttribute.primaryKey) {
					primaryKeys.push(modelAttribute);
				}
				idx++;
			}
			Object.keys(modelAttributes).forEach(attributeKey => {
				const attribute = modelAttributes[attributeKey];
				modelAttributeMap[attributeKey] = attribute;
				if(attribute.field) {
					modelAttributeMap[attribute.field] = attribute;
				}
			});
		}
		valueHash = Utils.removeNullValuesFromHash(valueHash, this.options.omitNull);
		Object.keys(valueHash).forEach(key => {
			value = valueHash[key];
			fields.push(this.quoteIdentifier(key));
			if(modelAttributeMap && modelAttributeMap[key] && modelAttributeMap[key].autoIncrement === true && !value) {
				values.push('DEFAULT');
			} else {
				if(modelAttributeMap && modelAttributeMap[key] && !modelAttributeMap[key].allowNull && (value != null && value.length === 0)) {
					//Oracle refuses an insert in not null column with empty value (considered as null)
					value = ' ';
				}
				const currAttribute = modelAttributeMap[key];
				if(currAttribute && currAttribute.type != null && currAttribute.type.key === DataTypes.TEXT.key && typeof value === 'string') {
					values.push(concatLongStringFromClobs(this.sequelize, value));
				} else if(currAttribute && currAttribute.type != null && currAttribute.type.key === DataTypes.BLOB.key) {
					// If we try to insert into TEXT or BLOB, we need to pass by input-parameters to avoid the 4000 char length limit
					const paramName = `:input${key}${inputParamCpt}`;
					const inputParam = {
						// dir : oracleDb.BIND_IN,
						val: value
					};
					// Binding type to parameter
					if(currAttribute.type.key === DataTypes.TEXT.key) {
						inputParam['type'] = oracleDb.STRING;
					} else {
						// No TEXT, it's a BLOB
						// inputParam['type'] =  oracleDb.BLOB;
						inputParam['val'] = Buffer.from(inputParam['val']);
					}
					inputParameters[paramName.slice(1)] = inputParam;
					values.push(paramName);
				} else {
					// return this.escape(value) + ' AS "' + key + '"';
					values.push(this.escape(value, (modelAttributeMap && modelAttributeMap[key]) || undefined, { context: 'INSERT' }));
				}
			}
		});
		if(Object.keys(inputParameters).length > 0) {
			options.inputParameters = inputParameters;
		}
		let primaryKey = '';
		primaryKeys.forEach(element => {
			if(element.field.toLowerCase() === 'uid') {
				primaryKey += primaryKey.length > 0 ? ',"uid"' : '"uid"';
				const pkReturn = `$:pkReturnVal;${element.type.toSql()}$`;
				primaryKeyReturn.push(pkReturn);
			} else {
				primaryKey += primaryKey.length > 0 ? ',' + this.quoteIdentifier(element.field) : this.quoteIdentifier(element.field);
				const pkReturn = `$:${element.field};${element.type.toSql()}$`;
				primaryKeyReturn.push(pkReturn);
			}
		});
		//If we want a return AND we haven't specified a primary key in the column list
		if(options.returning && primaryKey === '') {
			const tableKeys = Object.keys(this.sequelize.models);
			const currTableName = _.isPlainObject(table) ? table.tableName : table;
			const currentModelKey = tableKeys.find(modelKey => {
				return this.sequelize.models[modelKey].tableName === currTableName;
			});
			const currentModel = this.sequelize.models[currentModelKey];
			if((!currentModel || !currentModel.hasPrimaryKeys) && modelAttributes) {
				//We don't have a primaryKey, so we will return the first column inserted
				let field = modelAttributes[Object.keys(modelAttributes)[0]].field;
				if(_.includes(oracleReservedWords, field.toUpperCase())) {
					//The column name we want to return is a reserved word, so we change it for the request to be OK
					field = 'pkReturnVal';
				}
				const pkReturn = `$:${field};string$`;
				primaryKey = this.quoteIdentifier(modelAttributes[Object.keys(modelAttributes)[0]].field);
				primaryKeyReturn.push(pkReturn);
			}
		}
		const replacements = {
			primaryKey,
			primaryKeyReturn: primaryKeyReturn.join(','),
			table: realTableName,
			attributes: fields.join(','),
			values: values.join(',')
		};
		if(options.returning && replacements.attributes && replacements.attributes.length > 0) {
			query = returningQuery;
			replacements.valueQuery = _.template(valueQuery)(replacements);
		} else {
			query = (replacements.attributes.length ? valueQuery : emptyQuery);
		}
		return _.template(query)(replacements);
	}

	/**
	 * Oracle way to insert multiple rows inside a single statement
	 * INSERT ALL INSERT INTO table (column_name1,column_name2)
	 *   with row as (
	 *     SELECT value as "column_name1",value as "column_name2" FROM DUAL UNION ALL
	 *     SELECT value as "column_name1",value as "column_name2" FROM DUAL
	 *   )
	 * SELECT * FROM row
	 * Unfortunately, with version minor 11 and sequences, we can't use this, we have to chain multiple insert queries
	 */
	bulkInsertQuery(tableName, attrValueHashes, options, attributes) {
		const query = 'INSERT ALL INTO <%= table %> (<%= attributes %>) WITH rowAttr AS (<%= rows %>) SELECT * FROM rowAttr;';
		const emptyQuery = 'INSERT INTO <%= table %> (<%= attributes %>) VALUES (DEFAULT)';
		const tuples = [];
		const allAttributes = [];
		let allQueries = [];
		const inputParameters = {};
		let inputParamCpt = 0;
		// options.model.rawAttributes.memo.type; -> "TEXT"
		_.forEach(attrValueHashes, attrValueHash => {
			// special case for empty objects with primary keys
			const fields = Object.keys(attrValueHash);
			if(fields.length === 1 && attributes && attributes[fields[0]].autoIncrement && attrValueHash[fields[0]] === null) {
				allQueries.push(emptyQuery);
				return;
			}
			// normal case
			_.forOwn(attrValueHash, (value, key) => {
				if(allAttributes.indexOf(key) === -1) {
					if(value === null && attributes && attributes[key].autoIncrement) {
						return;
					}
					allAttributes.push(key);
				}
			});
		});
		//Loop over each row to insert
		if(allAttributes.length > 0) {
			//Loop over each attribute
			_.forEach(attrValueHashes, (attrValueHash, idx, array) => {
				//Generating the row
				let row = 'SELECT ';
				const attrs = allAttributes.map(key => {
					let currAttribute = options.model != null && options.model.rawAttributes != null && key in options.model.rawAttributes ? options.model.rawAttributes[key] : key;
					if(currAttribute === null) {
						//Maybe we should find the attribute by field and not fieldName
						Object.keys(options.model.rawAttributes).forEach(attr => {
							const attribute = options.model.rawAttributes[attr];
							if(attribute.field === key) {
								currAttribute = attribute;

							}
						});
					}
					if(currAttribute && currAttribute.type != null && (currAttribute.type.key === DataTypes.TEXT.key || currAttribute.type.key === DataTypes.BLOB.key)) {
						//If we try to insert into TEXT or BLOB, we need to pass by input-parameters to avoid the 4000 char length limit
						const paramName = `:input${key}${inputParamCpt}`;
						const inputParam = {
							dir: oracleDb.BIND_IN,
							val: attrValueHash[key]
						};
						//Binding type to parameter
						if(options.model.rawAttributes[key].type.key === DataTypes.TEXT.key) {
							//if text with length, it's generated as a String inside Oracle,
							if(options.model.rawAttributes[key].type._length !== '') {
								inputParam['type'] = oracleDb.STRING;
							} else {
								//No length -> it's a CLidxOB
								inputParam['type'] = oracleDb.STRING;
							}
						} else {
							//No TEXT, it's a BLOB
							inputParam['type'] = oracleDb.BLOB;
						}
						inputParameters[paramName.slice(1, paramName.length)] = inputParam;
						return paramName + ' AS "' + key + '"';
					} else {
						return this.escape(attrValueHash[key]) + ' AS "' + key + '"';
					}
				}).join(',');
				row += attrs;
				row += idx < (array.length - 1) ? ' FROM DUAL UNION ALL' : ' FROM DUAL';
				inputParamCpt++;
				tuples.push(row);
			});
			allQueries.push(query);
			if(Object.keys(inputParameters).length > 0) {
				options.inputParameters = inputParameters;
			}
		} else {
			//If we pass here, we don't have any attribute, just the id, so we take it to place it in the queries
			let queryToLaunch = 'DECLARE x NUMBER := 0; BEGIN LOOP EXECUTE IMMEDIATE \'';
			queryToLaunch += allQueries[0];
			queryToLaunch += '\'; x:= x+1; IF x > ';
			queryToLaunch += (allQueries.length - 1);
			queryToLaunch += ' THEN EXIT; END IF; END LOOP; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;';
			allQueries = [queryToLaunch];
			allAttributes.push(Object.keys(attrValueHashes[0])[0]);
		}
		const replacements = {
			table: this.quoteTable(tableName),
			attributes: allAttributes.map(attr => {
				return this.quoteIdentifier(attr);
			}).join(','),
			rows: tuples.join(' ')
		};
		return _.template(allQueries.join(';'))(replacements);
	}

	truncateTableQuery(tableName, options = {}) {
		return `TRUNCATE TABLE ${this.quoteTable(tableName)}`;
	}

	/**
	 * return a delete query
	 */
	deleteQuery(tableName, where, options) {
		options = options || {};

		where = this.getWhereConditions(where);
		const replacements = {
			table: this.quoteTable(tableName),
			limit: options.limit,
			where
		};
		let queryTmpl;
		// delete with limit <l> and optional condition <e> on Oracle: DELETE FROM <t> WHERE rowid in (SELECT rowid FROM <t> WHERE <e> AND rownum <= <l>)
		// Note that the condition <e> has to be in the subquery; otherwise, the subquery would select <l> arbitrary rows.
		if(!!options.limit) {
			const whereTmpl = where ? ' AND <%= where %>' : '';
			queryTmpl = 'DELETE FROM <%= table %> WHERE rowid IN (SELECT rowid FROM <%= table %> WHERE rownum <= <%= limit %>' + whereTmpl + ')';
		} else {
			const whereTmpl = where ? ' WHERE <%= where %>' : '';
			queryTmpl = 'DELETE FROM <%= table %>' + whereTmpl;
		}
		return _.template(queryTmpl)(replacements);
	}

	/**
	 * return a query to show indexes
	 */
	showIndexesQuery(tableName) {
		let owner = '';
		if(_.isPlainObject(tableName)) {
			owner = tableName.schema;
			tableName = tableName.tableName;
		}
		const sql = ['SELECT i.index_name,i.table_name, i.column_name, u.uniqueness, i.descend ',
			'FROM all_ind_columns i ',
			'INNER JOIN all_indexes u ',
			'ON (u.table_name = i.table_name AND u.index_name = i.index_name) ',
			'WHERE (i.table_name = UPPER(\'<%= tableName %>\') OR i.table_name = \'<%= tableName %>\')',
			owner.length > 0 ? ' AND u.TABLE_OWNER = \'' + this.getOwnerToGoodCase(owner) + '\'' : '',
			' ORDER BY INDEX_NAME, COLUMN_NAME'];
		const request = sql.join('');
		return _.template(request)({
			tableName
		});
	}

	/**
	 * return a query to remove index
	 */
	removeIndexQuery(tableName, indexNameOrAttributes) {
		const sql = 'DROP INDEX <%= indexName %>';
		let indexName = indexNameOrAttributes;
		if(typeof indexName !== 'string') {
			indexName = Utils.underscore(tableName + '_' + indexNameOrAttributes.join('_'));
		}
		const values = {
			tableName,
			indexName
		};
		return _.template(sql)(values);
	}

	/**
	 * change an attribute to sql
	 */
	attributeToSQL(attribute, options) {
		if(!_.isPlainObject(attribute)) {
			attribute = {
				type: attribute
			};
		}
		// handle self referential constraints
		if(attribute.references) {
			if(attribute.Model && attribute.Model.tableName === attribute.references.model) {
				this.sequelize.log('Oracle does not support self referencial constraints, '
					+ 'we will remove it but we recommend restructuring your query');
				attribute.onDelete = '';
				attribute.onUpdate = '';
			}
		}
		let template;
		if(attribute.type instanceof DataTypes.ENUM) {
			if(attribute.type.values && !attribute.values) {
				attribute.values = attribute.type.values;
			}
			// enums are a special case
			template = attribute.type.toSql();
			template += ' CHECK (ATTRIBUTENAME IN(' + _.map(attribute.values, value => {
				return this.escape(value);
			}).join(', ') + '))';
			return template;
		} else {
			if(attribute.autoIncrement) {
				template = ' NUMBER(*,0) GENERATED BY DEFAULT ON NULL AS IDENTITY';
			} else {
				if(attribute.type && attribute.type.key === DataTypes.DOUBLE.key) {
					template = attribute.type.toSql();
				} else {
					if(attribute.type) {
						template = attribute.type.toString();
					} else {
						template = '';
					}
				}
			}
		}
		// Blobs/texts cannot have a defaultValue
		if(attribute.type && attribute.type !== 'TEXT' && attribute.type._binary !== true &&
			Utils.defaultValueSchemable(attribute.defaultValue)) {
			if(attribute.defaultValue instanceof DataTypes.NOW) {
				template += ' DEFAULT ' + DataTypes[this.dialect].NOW().toSql();
			} else {
				template += ' DEFAULT ' + this.escape(attribute.defaultValue, attribute);
			}
		}
		if(!attribute.autoIncrement) {
			//If autoincrement, not null is setted automatically
			if(attribute.allowNull === false) {
				template += ' NOT NULL';
			} else if(!attribute.primaryKey && !Utils.defaultValueSchemable(attribute.defaultValue)) {
				template += ' NULL';
			}
		}
		if(attribute.unique === true && !attribute.primaryKey) {
			template += ' UNIQUE';
		}
		if(attribute.primaryKey) {
			template += ' PRIMARY KEY';
		}
		if(attribute.references) {
			template += ' REFERENCES ' + this.quoteTable(attribute.references.model);
			if(attribute.references.key) {
				template += ' (' + attribute.references.key + ')';
			} else {
				template += ' (' + 'id' + ')';
			}
			if(attribute.onDelete) {
				template += ' ON DELETE ' + attribute.onDelete.toUpperCase();
			}
		}
		return template;
	}

	/**
	 * change all attributes to sql
	 */
	attributesToSQL(attributes, options) {
		const result = {};
		Object.keys(attributes).forEach(key => {
			const attribute = attributes[key];
			const attributeName = attribute.field || key;
			result[attributeName] = this.attributeToSQL(attribute, options).replace('ATTRIBUTENAME', attributeName);
		});
		return result;
	}

	createTrigger() {
		this.throwMethodUndefined('createTrigger');
	}

	dropTrigger() {
		this.throwMethodUndefined('dropTrigger');
	}

	renameTrigger() {
		this.throwMethodUndefined('renameTrigger');
	}

	createFunction() {
		this.throwMethodUndefined('createFunction');
	}

	dropFunction() {
		this.throwMethodUndefined('dropFunction');
	}

	renameFunction() {
		this.throwMethodUndefined('renameFunction');
	}

	/**
	 * Method for setting the good case to the name passed in parameter used for defining the correct case for the owner
	 * Method to use ONLY for parameters in SYSTEM TABLES ! (in this case, owner used to be uppercase, except if it's a reserved word)
	 */
	getOwnerToGoodCase(name) {
		if(_.includes(oracleReservedWords, name.toUpperCase())) {
			//The name is reserved, we return in normal case
			return name;
		} else {
			//The name is not reserved, we return in uppercase
			return name.toUpperCase();
		}
	}

	/**
	 * if identifier != * and force = true or if there is '.' or '->' or if this is an reserved word :
	 * Delete ` from identifier and put it under ""
	 */
	quoteIdentifier(identifier, force) {
		if(force === true) {
			return Utils.addTicks(identifier, '"');
		} else if(identifier.indexOf('.') > -1 || identifier.indexOf('->') > -1) {
			return Utils.addTicks(identifier, '"');
		} else {
			//If there is a reserved word, we have to quote it
			if(_.includes(oracleReservedWords, identifier.toUpperCase())) {
				return Utils.addTicks(identifier, '"');
			}
			return identifier;
		}
	}

	getConstraintsOnColumn(table, column) {
		const tableName = table.tableName || table;
		const sql = ['SELECT CONSTRAINT_NAME FROM user_cons_columns WHERE TABLE_NAME = \'',
			tableName.toUpperCase(),
			'\' ',
			table.schema ? ' and OWNER = \'' + this.getOwnerToGoodCase(table.schema) + '\'' : '',
			' and COLUMN_NAME = \'',
			column.toUpperCase(),
			'\' AND POSITION IS NOT NULL ORDER BY POSITION'].join('');
		return sql;
	}

	getForeignKeysQuery(table) {
		//We don't call quoteTable as we don't want the schema in the table name, Oracle seperates it on another field
		const tableName = table.tableName || table;
		const sql = [
			'SELECT DISTINCT  a.table_name "tableName", a.constraint_name "constraintName", a.owner "owner",  a.column_name "columnName",',
			' b.table_name "referencedTableName", b.column_name "referencedColumnName"',
			' FROM all_cons_columns a',
			' JOIN all_constraints c ON a.owner = c.owner AND a.constraint_name = c.constraint_name',
			' JOIN all_cons_columns b ON c.owner = b.owner AND c.r_constraint_name = b.constraint_name',
			' WHERE c.constraint_type  = \'R\'',
			' AND a.table_name = ',
			this.escape(tableName.toUpperCase()),
			' AND a.owner = ',
			table.schema ? `'${this.getOwnerToGoodCase(table.schema)}'` : 'USER',
			' ORDER BY a.table_name, a.constraint_name'
		].join('');
		return sql;
	}

	/**
	 * if param is an object, add the schema to the tableName if there is one.
	 * verify if the tableName is reserved or start with '_', if this is the case call QI with force = true
	 * call QI on as if as = true, with force attribute if ther is '.' or '->', and add it to the tableName (with only a simple espace between tableName and as)
	 * - QI(schema) + '.' + QI(tableName, force? = true) + ' ' + QI(as, force? = true)
	 */
	quoteTable(param, as) {
		let table = '';
		if(_.isObject(param)) {
			if(param.schema) {
				table += this.quoteIdentifier(param.schema) + '.';
			}
			if(_.includes(oracleReservedWords, param.tableName.toUpperCase()) || param.tableName.indexOf('_') === 0) {
				table += this.quoteIdentifier(param.tableName, true);
			} else {
				table += this.quoteIdentifier(param.tableName);
			}
		} else {
			//If there is a reserved word, we have to quote it
			if(_.includes(oracleReservedWords, param.toUpperCase()) || param.indexOf('_') === 0) {
				table = this.quoteIdentifier(param, true);
			} else {
				table = this.quoteIdentifier(param);
			}
		}
		//Oracle don't support as for table aliases
		if(as) {
			if(as.indexOf('.') > -1 || as.indexOf('_') === 0) {
				table += ' ' + this.quoteIdentifier(as, true);
			} else {
				table += ' ' + this.quoteIdentifier(as);
			}
		}
		return table;
	}

	nameIndexes(indexes, rawTablename) {
		let tableName;
		if(_.isObject(rawTablename)) {
			tableName = rawTablename.schema + '.' + rawTablename.tableName;
		} else {
			tableName = rawTablename;
		}
		return _.map(indexes, index => {
			if(!index.hasOwnProperty('name')) {
				if(index.unique) {
					index.name = this._generateUniqueConstraintName(tableName, index.fields);
				} else {
					const onlyAttributeNames = index.fields.map(field => typeof field === 'string' ? field : field.name || field.attribute);
					index.name = Utils.underscore(tableName + '_' + onlyAttributeNames.join('_'));
				}
			}
			return index;
		});
	}

	/**
	 * return a query to drop a foreign key
	 */
	dropForeignKeyQuery(tableName, foreignKey) {
		return this.dropConstraintQuery(tableName, foreignKey);
	}

	getPrimaryKeyConstraintQuery(tableName) {
		const sql = ['SELECT cols.column_name, atc.identity_column ',
			'FROM all_constraints cons, all_cons_columns cols ',
			'INNER JOIN all_tab_columns atc ON(atc.table_name = cols.table_name AND atc.COLUMN_NAME = cols.COLUMN_NAME )',
			'WHERE cols.table_name = \'',
			tableName.tableName ? tableName.tableName.toUpperCase() : tableName.toUpperCase(),
			'\' ',
			tableName.schema ? 'AND cols.owner = \'' + this.getOwnerToGoodCase(tableName.schema) + '\' ' : ' ',
			'AND cons.constraint_type = \'P\' ',
			'AND cons.constraint_name = cols.constraint_name ',
			'AND cons.owner = cols.owner ',
			'ORDER BY cols.table_name, cols.position'].join('');
		return sql;
	}

	/**
	 * Request to know if the table has a identity primary key, returns the name of the declaration of the identity if true
	 */
	isIdentityPrimaryKey(tableName) {
		return ['SELECT TABLE_NAME,COLUMN_NAME, COLUMN_NAME,GENERATION_TYPE,IDENTITY_OPTIONS FROM USER_TAB_IDENTITY_COLS WHERE TABLE_NAME=\'',
			tableName.tableName ? tableName.tableName.toUpperCase() : tableName.toUpperCase(),
			'\' ',
			tableName.schema ? 'AND OWNER = \'' + this.getOwnerToGoodCase(tableName.schema) + '\' ' : ' '].join('');
	}

	/**
	 * Drop identity
	 * Mandatory, Oracle doesn't support dropping a PK column if it's an identity -> results in database corruption
	 */
	dropIdentityColumn(tableName, columnName) {
		const table = this.quoteTable(tableName);
		return 'ALTER TABLE ' + table + ' MODIFY ' + columnName + ' DROP IDENTITY';
	}

	/**
	 * return a query to drop a constraint
	 */
	dropConstraintQuery(tableName, constraintName) {
		const sql = 'ALTER TABLE <%= table %> DROP CONSTRAINT "<%= constraint %>"';
		return _.template(sql)({
			table: this.quoteTable(tableName),
			constraint: constraintName
		});
	}

	setAutocommitQuery(value) {
		if(value) {
			//Do nothing, just for eslint
		}
		return '';
	}

	setIsolationLevelQuery(value, options) {
		if(options.parent) {
			return;
		}
		//We force the transaction level to the highest to have consistent datas
		return 'SET TRANSACTION ISOLATION LEVEL READ COMMITTED;';
	}

	/**
	 * generate a transaction id
	 * @hidden
	 */
	generateTransactionId() {
		//Oracle doesn't support transaction names > 32...
		//To deal with -savepoint-XX , we generate the uuid and then get the crc32 of it
		return crc32(uuid.v4());
	}

	/**
	 * return a query to start transaction
	 */
	startTransactionQuery(transaction) {
		if(transaction.parent) {
			return 'SAVEPOINT "' + transaction.name + '"';
		}
		return 'BEGIN TRANSACTION';
	}

	/**
	 * return a query to commit transaction
	 */
	commitTransactionQuery(transaction) {
		if(transaction.parent) {
			return;
		}
		return 'COMMIT TRANSACTION';
	}

	/**
	 * return a query to rollback transaction
	 */
	rollbackTransactionQuery(transaction) {
		if(transaction.parent) {
			return 'ROLLBACK TO SAVEPOINT "' + transaction.name + '"';
		}
		return 'ROLLBACK TRANSACTION';
	}

	/**
	 * return a query to select from table fragment
	 */
	selectFromTableFragment(options, model, attributes, tables, mainTableAs) {
		let mainFragment = 'SELECT ' + attributes.join(', ') + ' FROM ' + tables;
		if(mainTableAs) {
			mainFragment += ' ' + mainTableAs;
		}
		return mainFragment;
	}

	/**
	 * return a part of a query to add limit and offset
	 */
	addLimitAndOffset(options, model) {
		let fragment = '';
		const offset = options.offset || 0;
		const isSubQuery = options.hasIncludeWhere || options.hasIncludeRequired || options.hasMultiAssociation;
		let orders = {};
		if(options.order) {
			orders = this.getQueryOrders(options, model, isSubQuery);
		}
		if(options.limit || options.offset) {
			if(!(options.order && options.group) && (options.include && !orders.subQueryOrder.length)) {
				fragment += (options.order && !isSubQuery) ? ', ' : ' ORDER BY ';
				fragment += this.quoteTable(options.tableAs || model.name) + '.' + this.quoteIdentifier(model.primaryKeyField);
			}
			if(options.offset || options.limit) {
				fragment += ' OFFSET ' + this.escape(offset) + ' ROWS';
			}
			if(options.limit) {
				fragment += ' FETCH NEXT ' + this.escape(options.limit) + ' ROWS ONLY';
			}
		}
		return fragment;
	}

	/**
	 * return the boolean value of a value
	 */
	booleanValue(value) {
		return !!value ? 1 : 0;
	}

	/**
	 * Declaration void as main class is abstract
	 */
	jsonPathExtractionQuery() {
	}

	/**
	 * @hidden
	 */
	wrapSingleQuote(identifier) {
		return Utils.addTicks(identifier, '\'');
	}
}

exports.OracleQueryGenerator = OracleQueryGenerator;
exports.oracleReservedWords = oracleReservedWords;
