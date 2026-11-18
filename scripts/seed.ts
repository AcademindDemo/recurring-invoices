// Fills an empty database with demo data: `pnpm db:seed` after `pnpm db:migrate`. It refuses a
// database that already has accounts, so it never touches real data.
import { z } from 'zod';
import { createDb } from '../src/lib/server/db/client.ts';
import { demoAccount, seedDemoData } from '../src/lib/server/demo-data.ts';
import { today } from '../src/lib/server/invoices/dates.ts';

const { DATABASE_URL } = z.object({ DATABASE_URL: z.string().min(1) }).parse(process.env);
const result = await seedDemoData(createDb(DATABASE_URL), today(new Date(), demoAccount.timeZone));

if ('error' in result) {
	console.error(result.error);
	process.exitCode = 1;
} else {
	console.log(`Seeded ${DATABASE_URL}: ${result.clients} clients and ${result.invoices} invoices.`);
	console.log(`Sign in as ${demoAccount.email} with the password ${demoAccount.password}.`);
}
