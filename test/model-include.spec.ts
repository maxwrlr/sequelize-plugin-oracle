import {DataTypes, literal, ModelStatic, Op, Sequelize} from "..";
import {createSequelize} from "./utils";

let sequelize: Sequelize;
let Organizations: ModelStatic<any>;
let Brands: ModelStatic<any>;
let Products: ModelStatic<any>;

beforeAll(async () => {
	sequelize = createSequelize();

	Organizations = sequelize.define('test_organization', {
		id: {
			type: DataTypes.STRING(32),
			primaryKey: true,
			allowNull: false
		},

		name: {
			type: DataTypes.STRING(255),
			allowNull: false
		}
	});

	Brands = sequelize.define('test_branding', {
		id: {
			type: DataTypes.STRING(32),
			primaryKey: true,
			allowNull: false
		},
		organization_id: {
			type: DataTypes.STRING(32),
			allowNull: false
		}
	});

	Products = sequelize.define('test_product', {
		id: {
			type: DataTypes.STRING(32),
			primaryKey: true,
			allowNull: false
		},
		brand_id: {
			type: DataTypes.STRING(32),
			defaultValue: null
		},
		index: DataTypes.NUMBER
	});

	Organizations.hasMany(Brands, {foreignKey: 'organization_id'});
	Brands.belongsTo(Organizations, {foreignKey: 'organization_id'});
	Brands.hasMany(Products, {foreignKey: 'brand_id'});
	Products.belongsTo(Brands, {foreignKey: 'brand_id'});

	await sequelize.sync({force: true});

	await Organizations.create({id: 'sde', name: 'SDE AG'});
	await Brands.create({id: 'SDE Consulting', organization_id: 'sde'});
	await Products.create({id: 'SDE Software', brand_id: 'SDE Consulting', index: 1});
	await Products.create({id: 'SDE Middleware', brand_id: 'SDE Consulting', index: 2});
	await Products.create({id: 'SDE Hardware', brand_id: 'SDE Consulting', index: 3});
});

afterAll(async () => {
	await Products.drop();
	await Brands.drop();
	await Organizations.drop();
	await sequelize.close();
})

it('should include children', async () => {
	const parent = await Brands.findOne({
		attributes: {
			include: [],
			exclude: [
				'createdAt'
			]
		},
		include: [ Organizations, Products ],
		where: {
			organization_id: 'sde'
		},
		order: [
			['id', 'DESC']
		]
	});

	expect(parent).toMatchObject({id: 'SDE Consulting'});
	expect(parent.test_organization).toBeTruthy();
	expect(parent.test_products).toHaveLength(3);
});
