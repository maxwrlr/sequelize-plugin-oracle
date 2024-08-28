import {DataTypes, ModelStatic, Sequelize} from '..';
import {QueryInterface, STRING} from 'sequelize';
import {createSequelize} from "./utils";

let sequelize: Sequelize;
let qi: QueryInterface;
let Testing: ModelStatic<any>;
let TestingChild: ModelStatic<any>;

jest.setTimeout(10_000);

beforeAll(() => {
	sequelize = createSequelize({
		timestamps: false
	});

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

	TestingChild = sequelize.define('testing_child', {
		parent: {
			type:       DataTypes.STRING,
			references: {
				model: Testing,
				key:   'name'
			}
		},
		name:   {
			type:       DataTypes.STRING,
			primaryKey: true
		}
	});

	return sequelize.sync({ force: true });
});

afterAll(async() => {
	await TestingChild.drop();
	await Testing.drop();
	await sequelize.close();
});

it('gets foreign key constraints in correct format', async() => {
	const fks = await sequelize.getQueryInterface()
		.getForeignKeyReferencesForTable(TestingChild.tableName) as any[];

	expect(fks).toEqual([
		expect.objectContaining({
			tableName:            TestingChild.tableName.toUpperCase(),
			columnName:           TestingChild.getAttributes()['parent'].field.toUpperCase(),
			referencedTableName:  Testing.tableName.toUpperCase(),
			referencedColumnName: Testing.getAttributes()['name'].field.toUpperCase()
		})
	]);
});

it('performs bulk operations without model', async() => {
	await qi.bulkInsert(Testing.tableName, [{ name: 'Foo', value: null }]);

	let affectedRows = await qi.bulkUpdate(Testing.tableName, { value: 2 }, { name: 'Foo' });
	expect(affectedRows).toBe(1);

	affectedRows = await qi.bulkUpdate(Testing.tableName, { value: null }, { name: 'Foo' });
	expect(affectedRows).toBe(1);

	await qi.bulkDelete(Testing.tableName, { name: 'Foo' });
});

it('adds a column', async() => {
	const getColumns = async() => Object.keys(await qi.describeTable(Testing.tableName)).map(k => k.toLowerCase());

	await expect(getColumns()).resolves.not.toContain('test');
	await qi.addColumn(Testing.tableName, 'test', { type: STRING(32) });
	await expect(getColumns()).resolves.toContain('test');
});

it('removes a column', async() => {
	const getColumns = async() => Object.keys(await qi.describeTable(Testing.tableName)).map(k => k.toLowerCase());

	await expect(getColumns()).resolves.toContain('value');
	await qi.removeColumn(Testing.tableName, 'value');
	await expect(getColumns()).resolves.not.toContain('value');
});
