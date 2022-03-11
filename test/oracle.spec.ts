import {install} from '..';
import * as fs from 'fs';
import {col, DataTypes, fn, ModelStatic, Sequelize} from 'sequelize';

install(true);

let sequelize: Sequelize;
let Testing: ModelStatic<any>;

jest.setTimeout(100_000);

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
});

afterAll(() => sequelize.close());

describe('create a table and make some queries', () => {
	it('should create a table', async() => {
		await expect(sequelize.sync({ force: true })).resolves.not.toThrow();
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

	it('truncates the table', async() => {
		await Testing.destroy({ where: {}, truncate: true });
		await expect(Testing.findAll()).resolves.toHaveLength(0);
	});

	it('drops the table', async() => {
		await Testing.drop();
		await expect(Testing.findAll()).rejects.toThrow();
	});
});