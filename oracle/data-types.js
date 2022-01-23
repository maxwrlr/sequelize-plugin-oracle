'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const _ = require('lodash');
const moment = require('moment');
const momentTz = require('moment-timezone');
const Globals = require('./globals');

module.exports = BaseTypes => {
	const warn = BaseTypes.ABSTRACT.warn.bind(undefined, 'https://docs.oracle.com/database/122/SQLRF/Data-Types.htm#SQLRF30020');
	BaseTypes.DATE.types.oracle = ['TIMESTAMP', 'TIMESTAMP WITH LOCAL TIME ZONE'];
	BaseTypes.STRING.types.oracle = ['VARCHAR2', 'NVARCHAR2'];
	BaseTypes.CHAR.types.oracle = ['CHAR', 'RAW'];
	BaseTypes.TEXT.types.oracle = false;
	BaseTypes.INTEGER.types.oracle = ['INTEGER'];
	BaseTypes.BIGINT.types.oracle = false;
	BaseTypes.FLOAT.types.oracle = false;
	BaseTypes.TIME.types.oracle = ['TIMESTAMP WITH LOCAL TIME ZONE'];
	BaseTypes.DATEONLY.types.oracle = ['DATE', 'DATEONLY'];
	BaseTypes.BOOLEAN.types.oracle = ['NUMBER'];
	BaseTypes.BLOB.types.oracle = ['BLOB'];
	BaseTypes.DECIMAL.types.oracle = ['DECIMAL'];
	BaseTypes.UUID.types.oracle = false;
	BaseTypes.ENUM.types.oracle = false;
	BaseTypes.REAL.types.oracle = false;
	BaseTypes.DECIMAL.types.oracle = false;
	BaseTypes.DOUBLE.types.oracle = false;
	BaseTypes.GEOMETRY.types.oracle = false;

	class BLOB extends BaseTypes.BLOB {
		toSql() {
			if(this._length) {
				if(this._length.toLowerCase() === 'tiny') {
					warn('ORACLE does not support BLOB with the `length` = `tiny` option. `RAW(256)` will be used instead.');
					return 'RAW(256)';
				}
				warn('ORACLE does not support BLOB with the `length` option. `RAW(2000)` will be used instead.');
				if(isNaN(this._length) || this._length > 2000) {
					return 'RAW(2000)';
				} else {
					return `RAW(${this._length})`;
				}
			}
			return 'BLOB';
		}

		_hexify(hex) {
			return 'hextoraw(\'' + hex + '\')';
		}
	}

	class CHAR extends BaseTypes.CHAR {
		toSql() {
			if(this._binary) {
				return 'RAW(' + this._length + ')';
			}
			return super.toSql();
		}
	}

	class STRING extends BaseTypes.STRING {
		constructor() {
			super(...arguments);
			this.escape = false;
		}

		toSql() {
			if(this._length > 4000 || this._binary && this._length > 2000) {
				warn('Oracle 12 supports length up to 32764; be sure that your administrator has extended the MAX_STRING_SIZE parameter. Check https://docs.oracle.com/database/121/REFRN/GUID-D424D23B-0933-425F-BC69-9C0E6724693C.htm#REFRN10321');
			}
			if(!this._binary) {
				return 'VARCHAR2(' + this._length + ')';
			} else {
				return 'RAW(' + this._length + ')';
			}
		}

		_stringify(value, options) {
			if(this._binary) {
				return BLOB.prototype._stringify(value);
			} else {
				return options.escape(value);
			}
		}
	}

	class TEXT extends BaseTypes.TEXT {
		toSql() {
			//TEXT is not support by Oracle, passing through NVARCHAR
			if(this._length) {
				if(typeof this._length === 'string') {
					switch(this._length.toLowerCase()) {
						case 'tiny':
							warn('ORACLE does not support TEXT with the `length` = `tiny` option. `VARCHAR(256)` will be used instead.');
							return 'VARCHAR2(256)';
						case 'medium':
							warn('ORACLE does not support TEXT with the `length` = `medium` option. `VARCHAR(2000)` will be used instead.');
							return 'VARCHAR2(2000)';
						case 'long':
							warn('ORACLE does not support TEXT with the `length` = `long` option. `VARCHAR(4000)` will be used instead.');
							return 'VARCHAR2(4000)';
					}
				}
				warn('As parameter length has been given, NVARCHAR2(length) will be used');
				return `VARCHAR2(${this._length})`;
			}
			return 'CLOB';
		}
	}

	class BOOLEAN extends BaseTypes.BOOLEAN {
		toSql() {
			return 'NUMBER(1)';
		}

		_stringify(value) {
			if(typeof value === 'string') {
				if(value === '0') {
					return 0;
				} else {
					return 1;
				}
			}
			return !!value ? 1 : 0;
		}
	}

	class UUID extends BaseTypes.UUID {
		toSql() {
			return 'VARCHAR2(36)';
		}
	}

	class NOW extends BaseTypes.NOW {
		toSql() {
			// return 'SELECT TO_CHAR(SYSDATE, \'YYYY-MM-DD HH24:MI:SS\') "NOW" FROM DUAL;';
			return 'CURRENT_TIMESTAMP';
		}

		_stringify() {
			return 'SELECT TO_CHAR(SYSDATE, \'YYYY-MM-DD HH24:MI:SS\') "NOW" FROM DUAL;';
		}

		_bindParam() {
			return this._stringify();
		}
	}

	class TIME extends BaseTypes.TIME {
		constructor() {
			super(...arguments);
			this.escape = false;
		}

		toSql() {
			return 'TIMESTAMP WITH LOCAL TIME ZONE';
		}

		_applyTimezone(date, options) {
			if(options.timezone) {
				if(momentTz.tz.zone(options.timezone)) {
					date = momentTz(date).tz(options.timezone);
				} else {
					date = moment(date).utcOffset(options.timezone);
				}
			} else {
				date = momentTz(date);
			}
			return date;
		}

		_stringify(date, options) {
			const format = 'HH24:MI:SS.FFTZH:TZM';
			//Oracle has no TIME object, we have to deal it as a real date and insert only the time we need
			let momentDate = moment(date);
			momentDate = this._applyTimezone(momentDate, options);
			const formatedDate = momentDate.format('HH:mm:ss.SSS Z');
			return `TO_TIMESTAMP_TZ('${formatedDate}','${format}')`;
		}

		_bindParam(value, options) {
			return this._stringify(value, options);
		}
	}

	class DATE extends BaseTypes.DATE {
		constructor() {
			super(...arguments);
			this.escape = false;
			this.noTimezone = 'oracle' in Globals.dialectOptions && 'noTimezone' in Globals.dialectOptions['oracle'] ? Globals.dialectOptions['oracle']['noTimezone'] : false;
		}

		toSql() {
			if(this.noTimezone) {
				return 'TIMESTAMP';
			}
			return 'TIMESTAMP WITH LOCAL TIME ZONE';
		}

		_stringify(date, options) {
			if(this.noTimezone) {
				const format = 'YYYY-MM-DD HH24:MI:SS.FF';
				date = this._applyTimezone(date, options);
				const formatedDate = date.format('YYYY-MM-DD HH:mm:ss.SSS');
				return `TO_TIMESTAMP('${formatedDate}','${format}')`;
			} else {
				const format = 'YYYY-MM-DD HH24:MI:SS.FFTZH:TZM';
				date = this._applyTimezone(date, options);
				const formatedDate = date.format('YYYY-MM-DD HH:mm:ss.SSS Z');
				return `TO_TIMESTAMP_TZ('${formatedDate}','${format}')`;
			}
		}

		_bindParam(value, options) {
			return this._stringify(value, options);
		}
	}

	class DECIMAL extends BaseTypes.DECIMAL {
		toSql() {
			let result = '';
			if(this._length) {
				result += '(' + this._length;
				if(typeof this._decimals === 'number') {
					result += ',' + this._decimals;
				}
				result += ')';
			}
			if(!this._length && this._precision) {
				result += '(' + this._precision;
				if(typeof this._scale === 'number') {
					result += ',' + this._scale;
				}
				result += ')';
			}
			return 'NUMBER' + result;
		}
	}

	class INTEGER extends BaseTypes.INTEGER {
		constructor(length) {
			super(length);
			if(this._zerofill) {
				warn('ORACLE does not support INTEGER with options. Plain `INTEGER` will be used instead.');
				this._zerofill = undefined;
			}
		}

		toSql() {
			if(this._unsigned) {
				if(this._length) {
					return 'INTEGER(' + this._length + ')';
				}
				return 'INTEGER';
			}
			return 'INTEGER';
		}
	}

	class BIGINT extends BaseTypes.BIGINT {
		constructor(length) {
			super(length);
			warn('Oracle does not support BIGINT. Plain `NUMBER(19)` will be used instead.');
			// ORACLE does not support any options for bigint
			if(this._length || this.options.length || this._unsigned || this._zerofill) {
				this._length = undefined;
				this.options.length = undefined;
				this._unsigned = undefined;
				this._zerofill = undefined;
			}
		}

		toSql() {
			return 'NUMBER(19)';
		}
	}

	class REAL extends BaseTypes.REAL {
		toSql() {
			return 'REAL';
		}
	}

	class FLOAT extends BaseTypes.FLOAT {
		toSql() {
			if(this._length) {
				return 'FLOAT(' + this._length + ')';
			}
			return 'FLOAT';
		}
	}

	class DOUBLE extends BaseTypes.DOUBLE {
		constructor(length, decimals) {
			super(length, decimals);
			if(this._length || this._unsigned || this._zerofill) {
				this._length = undefined;
				this.options.length = undefined;
				this._unsigned = undefined;
				this._zerofill = undefined;
			}
		}

		toSql() {
			return 'NUMBER(15,5)';
		}
	}

	class ENUM extends BaseTypes.ENUM {
		toSql() {
			return 'VARCHAR2(255)';
		}
	}

	class DATEONLY extends BaseTypes.DATEONLY {
		static parse(value) {
			return moment(value).format('YYYY-MM-DD');
		}

		_stringify(date) {
			const format = 'YYYY/MM/DD';
			return `TO_DATE('${date}','${format}')`;
		}

		_bindParam(value) {
			return this._stringify(value);
		}
	}

	const exp = {
		BLOB,
		BOOLEAN,
		'DOUBLE PRECISION': DOUBLE,
		DOUBLE,
		ENUM,
		STRING,
		BIGINT,
		CHAR,
		UUID,
		DATEONLY,
		DATE,
		NOW,
		INTEGER,
		REAL,
		TIME,
		DECIMAL,
		FLOAT,
		TEXT
	};
	_.forIn(exp, (DataType, key) => {
		if(!DataType.key) {
			DataType.key = key;
		}
		if(!DataType.extend) {
			DataType.extend = function extend(oldType) {
				return new DataType(oldType.options);
			};
		}
	});

	return exp;
};