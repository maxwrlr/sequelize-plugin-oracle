import * as fs from 'fs-extra';
import * as path from 'path';

it('should register the oracle dialect', () => {
	const sequelizeDir = path.dirname(require.resolve('sequelize'));
	const directory = path.join(sequelizeDir, 'lib/dialects/oracle');
	fs.removeSync(directory);

	require('..');

	expect(fs.existsSync(directory)).toBeTruthy();
});