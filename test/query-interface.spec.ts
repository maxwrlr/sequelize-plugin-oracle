import * as fs from 'fs';
import {DataTypes, ModelStatic, Sequelize} from '..';
import {QueryInterface} from 'sequelize';

let sequelize: Sequelize;
let qi: QueryInterface;
let Testing: ModelStatic<any>;

jest.setTimeout(10_000);

beforeAll(() => {
	sequelize = new Sequelize(
		fs.readFileSync('.dbconfig', 'utf8').trim()
	);

	qi = sequelize.getQueryInterface();

	Testing = sequelize.define('testing', {
		name:  {
			type:       DataTypes.STRING,
			primaryKey: true
		},
		value: {
			type:         DataTypes.NUMBER,
			defaultValue: 123
		}
	});

	return sequelize.sync({ force: true });
});

afterAll(async() => {
	await Testing.drop();
	await sequelize.close();
});

it('removes a column', async() => {
	const getColumns = async() => Object.keys(await qi.describeTable(Testing.tableName)).map(k => k.toLowerCase());

	await expect(getColumns()).resolves.toContain('value');
	await qi.removeColumn(Testing.tableName, 'value');
	await expect(getColumns()).resolves.not.toContain('value');
});
