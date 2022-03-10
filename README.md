# sequelize-plugin-oracle

[![npm sequelize-plugin-oracle package](https://img.shields.io/npm/v/sequelize-plugin-oracle.svg)](https://npmjs.org/package/sequelize-plugin-oracle)

This is plugin adds oracle support to an independent [sequelize](https://github.com/sequelize/sequelize) installation at
run time. The dialect is based on [ts-sequelize](https://github.com/konnecteam/ts-sequelize), but it uses the native
pooling of [oracledb](https://github.com/oracle/node-oracledb).

> ✅ Tested with sequelize@6.17.0 

## Compatibility

|sequelize-plugin-oracle|sequelize|
|---|---|
| 6.2 | \>= 6.16
| 6.1 | 6.14 to 6.15
| 6.0 | 6.13

## Prerequisites

This plugin requires `sequelize` and `oracledb` to be installed.
They are not `peerDependencies` of this package, so the developer has to make sure it works together. 

**Note:** _The major version of this plugin matches the major version of sequelize._
In such cases, the plugin should definitely be compatible.

## Usage

```typescript
// load oracle dialect...
import 'sequelize-plugin-oracle';
// now you can use sequelize with oracle dbs.
import {Sequelize} from 'sequelize';

const sequelize = new Sequelize('oracle://...');
```

## How does it work?

When required, it makes sure that the `dialects` directory of sequelize contains a copy of oracle definitions
of this package. That's kinda hacky, but it seems to work 😅.
