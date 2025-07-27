// backend/test/test-drizzle.tx
//

import { mysqlTable } from 'drizzle-orm/mysql-core';

const t = mysqlTable('my_test_table', {});
console.log(t);