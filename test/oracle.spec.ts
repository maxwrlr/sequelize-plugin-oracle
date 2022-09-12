import * as fs from 'fs';
import {col, DataTypes, fn, ModelStatic, Sequelize} from '..';

let sequelize: Sequelize;
let Testing: ModelStatic<any>;
let Stat: ModelStatic<any>;

jest.setTimeout(10_000);

beforeAll(() => {
	sequelize = new Sequelize(
		fs.readFileSync('.dbconfig', 'utf8').trim()
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

	return sequelize.sync({ force: true });
});

afterAll(() => sequelize.close());

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

describe('create a table and make some queries', () => {
	it('created a table', async() => {
		await expect(Testing.findAll()).resolves.not.toThrow();
	});

	it('insert a row', async() => {
		const data = {
			name: 'Hello World!',
			bin:  Buffer.from('foo', 'utf8'),
			date: new Date()
		};

		await Testing.create(data);
		const result = await Testing.findAll();

		// test default value
		(data as any).value = Testing.rawAttributes.value.defaultValue;
		(data as any).isUp = Testing.rawAttributes.isUp.defaultValue;
		expect(result).toContainEqual(expect.objectContaining(data));
	});

	it('updates a row', async() => {
		const data = {
			name:  'Thanks for escaping \', ' + String.fromCharCode(0) + ', " and `.',
			value: 234,
			isUp:  true,
			date:  new Date(),
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

	it('limits the select', async() => {
		await Testing.create({ name: 'key', value: 123, bin: Buffer.from(''), date: new Date() });
		const result = Testing.findOne({ attributes: [[fn('sum', col('value')), 'value']] });
		await expect(result).resolves.toEqual(expect.objectContaining({ value: 567 + 123 }));
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