import * as fs from "fs";
import {Sequelize} from "../index";
import {ModelOptions} from "sequelize";

export function createSequelize(defineOptions: ModelOptions = {underscored: true}) {
	return new Sequelize(
		fs.readFileSync('.dbconfig', 'utf8').trim(),
		{
			define: defineOptions
		}
	);
}
