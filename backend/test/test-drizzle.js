"use strict";
// backend/test/test-drizzle.tx
//
Object.defineProperty(exports, "__esModule", { value: true });
var mysql_core_1 = require("drizzle-orm/mysql-core");
var t = (0, mysql_core_1.mysqlTable)('my_test_table', {});
console.log(t);
