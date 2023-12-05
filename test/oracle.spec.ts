import * as fs from 'fs';
import {col, DataTypes, fn, ModelStatic, Sequelize} from '..';
import {QueryTypes} from 'sequelize';

let sequelize: Sequelize;
let Testing: ModelStatic<any>;
let Stat: ModelStatic<any>;
let Sites: ModelStatic<any>;

jest.setTimeout(10_000);

beforeAll(() => {
	sequelize = new Sequelize(
		fs.readFileSync('.dbconfig', 'utf8').trim(),
		{
			define: {
				underscored: true
			}
		}
	);

	Testing = sequelize.define('testing', {
		name:  {
			type:       DataTypes.STRING,
			primaryKey: true
		},
		value: {
			type:         DataTypes.NUMBER,
			defaultValue: 123
		},
		isUp:  {
			type:         DataTypes.BOOLEAN,
			defaultValue: false
		},
		date:  {
			type: DataTypes.DATE
		},
		text:  {
			field: 'column_for_text',
			type:  DataTypes.TEXT
		},
		bin:   {
			type: DataTypes.BLOB
		}
	});

	Stat = sequelize.define('stat', {
		id:    {
			type:       DataTypes.STRING,
			primaryKey: true
		},
		time:  {
			type:       DataTypes.DATE,
			primaryKey: true
		},
		count: {
			type: DataTypes.NUMBER
		}
	});

	Sites = sequelize.define('numbers', {
		id:   {
			type:       DataTypes.STRING,
			primaryKey: true
		},
		path: {
			type:   DataTypes.STRING,
			unique: true
		}
	});

	return sequelize.sync({ force: true });
});

afterAll(async() => {
	await Promise.all([Testing.drop(), Stat.drop(), Sites.drop()]);
	await sequelize.close();
});

it('supports unique', async() => {
	await expect(Sites.create({ id: 1, path: '/' })).resolves.not.toThrow();
	await expect(Sites.create({ id: 2, path: '/' })).rejects.toThrow();
});

it('syncs using alter', async() => {
	await expect(sequelize.sync({ alter: true })).resolves.not.toThrow();
});

it('creates and returns created row', async() => {
	const data = {
		id:    'test',
		time:  new Date(),
		count: 23
	};

	const create = Stat.create(data);
	await expect(create).resolves.toEqual(expect.objectContaining(create));
});

it('upserts when a value is a literal', async() => {
	const upsert = Stat.upsert({
		id:    'test',
		time:  Sequelize.literal('CURRENT_TIMESTAMP'),
		count: 1
	});
	await expect(upsert).resolves.not.toThrow();
});

describe('create a table and make some queries', () => {
	it('created a table', async() => {
		await expect(Testing.findAll()).resolves.not.toThrow();
	});

	it('insert a row', async() => {
		const data = {
			name: 'Hello World!',
			bin:  Buffer.from('foo', 'utf8'),
			text: Array(5000).fill('a').join(''),
			date: new Date()
		};

		await Testing.create(data);
		const result = await Testing.findAll();

		// test default value
		(data as any).value = Testing.rawAttributes.value.defaultValue;
		(data as any).isUp = Testing.rawAttributes.isUp.defaultValue;
		expect(result).toContainEqual(expect.objectContaining(data));
	});

	it('inserts a row with returning set to false', async() => {
		await Testing.create({
			name: 'Foo'
		}, { returning: false });
	});

	it('updates a row', async() => {
		const data = {
			name:  'Thanks for escaping \', ' + String.fromCharCode(0) + ', " and `.',
			value: 234,
			isUp:  true,
			date:  new Date(),
			text:  Array(5000).fill('b').join(''),
			bin:   Buffer.from('bar', 'utf8')
		};

		await Testing.update(data, { where: { name: 'Hello World!' } });
		const result = await Testing.findAll();
		expect(result).toContainEqual(expect.objectContaining(data));
	});

	it('upserts a row', async() => {
		const data = {
			name:  'Thanks for escaping \', ' + String.fromCharCode(0) + ', " and `.',
			value: 567
		};

		await Testing.upsert(data);
		const result = await Testing.findAll();
		expect(result).toContainEqual(expect.objectContaining(data));
	});

	it('maps aliases properly', async() => {
		const result = await sequelize.getQueryInterface().select(null, Testing.tableName, <any>{
			attributes: [['value', 'camelCase']]
		});

		await expect(result[0]).toEqual({ camelCase: 567 });
	});

	it('maps column keys properly for raw query with star', async() => {
		const result = await sequelize.query('select * from ' + Testing.tableName, { type: QueryTypes.SELECT });
		expect(result).toContainEqual(expect.objectContaining({
			NAME:  expect.anything(),
			IS_UP: expect.anything()
		}));
	});

	it('maps column keys properly for raw query with aliases', async() => {
		const result = await sequelize.query('select name as "The_namE", is_up as "isUp" from ' + Testing.tableName, { type: QueryTypes.SELECT });
		expect(result).toContainEqual(expect.objectContaining({
			The_namE: expect.anything(),
			isUp:     expect.anything()
		}));
	});

	it('limits the select', async() => {
		await Testing.create({ name: 'key', value: 123, bin: Buffer.from(''), date: new Date() });
		const result = Testing.findOne({ attributes: [[fn('sum', col('value')), 'value']] });
		await expect(result).resolves.toMatchObject({ value: expect.any(Number) });
	});

	it('ignores if statements are ended with semicolon', async() => {
		const promises = Promise.all([
			sequelize.query('select * from testings'),
			sequelize.query('select * from testings;'),
			sequelize.query('update testings set "value" = 100 where "value" > 100;')
		]);

		await expect(promises).resolves.not.toThrow();
	});

	it('truncates the table', async() => {
		await Testing.destroy({ where: {}, truncate: true });
		await expect(Testing.findAll()).resolves.toHaveLength(0);
	});

	it('drops the table', async() => {
		await Testing.drop();
		await expect(Testing.findAll()).rejects.toThrow();
	});
});