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
		name: {
			type:       DataTypes.STRING,
			primaryKey: true
		}
	});
});

afterAll(() => sequelize.close());

describe('create a table and make some queries', () => {
	it('should create a table', async() => {
		await expect(sequelize.sync({ force: true })).resolves.not.toThrow();
	});

	it('should insert a row', async() => {
		const data = { name: 'Hello World!' };
		await Testing.create(data);
		const result = await Testing.findAll();
		expect(result).toContainEqual(expect.objectContaining(data));
	});

	it('should update a row', async() => {
		const data = { name: 'Good Bye!' };
		await Testing.update(data, { where: { name: 'Hello World!' } });
		const result = await Testing.findAll();
		expect(result).toContainEqual(expect.objectContaining(data));
	});

	// it('should drop the table', async() => {
	// 	await Testing.drop();
	// 	await expect(Testing.findAll()).toThrow();
	// });
});