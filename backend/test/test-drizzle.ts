// backend/test/test-drizzle.tx
//

import { mysqlTable } from 'drizzle-orm/mysql-core';
import { log } from '@/utils/logger';

const t = mysqlTable('my_test_table', {});
log.info(t);
