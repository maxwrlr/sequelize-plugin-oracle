import {install} from '..';

install(true);

import * as fs from 'fs';
import {DataTypes, ModelCtor, Sequelize} from 'sequelize';

let sequelize: Sequelize;
let Testing: ModelCtor<any>;

jest.setTimeout(100_000);

beforeAll(() => {
	sequelize = new Sequelize(
		fs.readFileSync('.dbconfig', 'utf8').trim()
	);

	Testing = sequelize.define('testing', {
		name:   {
			type:       DataTypes.STRING,
			primaryKey: true
		},
		value:  {
			type:         DataTypes.NUMBER,
			defaultValue: 123
		},
		works: {
			type:         DataTypes.BOOLEAN,
			defaultValue: false
		},
		bin:    {
			type: DataTypes.BLOB
		}
	});
});

afterAll(() => sequelize.close());

describe('create a table and make some queries', () => {
	it('should create a table', async() => {
		await expect(sequelize.sync({ force: true })).resolves.not.toThrow();
	});

	it('should insert a row', async() => {
		const data = {
			name: 'Hello World!',
			bin:  Buffer.from('foo', 'utf8')
		};

		await Testing.create(data);
		const result = await Testing.findAll();

		// test default value
		(data as any).value = Testing.rawAttributes.value.defaultValue;
		(data as any).works = Testing.rawAttributes.works.defaultValue;
		expect(result).toContainEqual(expect.objectContaining(data));
	});

	it('should update a row', async() => {
		const data = {
			name:  'Thanks for escaping \', \0, " and `.',
			value: 234,
			works: true,
			bin:   Buffer.from('bar', 'utf8')
		};

		await Testing.update(data, { where: { name: 'Hello World!' } });
		const result = await Testing.findAll();
		expect(result).toContainEqual(expect.objectContaining(data));
	});

	it('should upsert a row', async() => {
		const data = {
			name:  'Thanks for escaping \', \0, " and `.',
			value: 567
		};

		await Testing.upsert(data);
		const result = await Testing.findAll();
		expect(result).toContainEqual(expect.objectContaining(data));
	});

	it('should truncate the table', async() => {
		await Testing.destroy({ where: {}, truncate: true });
		await expect(Testing.findAll()).resolves.toHaveLength(0);
	});

	it('should drop the table', async() => {
		await Testing.drop();
		await expect(Testing.findAll()).rejects.toThrow();
	});
});