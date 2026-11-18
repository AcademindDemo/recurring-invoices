import { BETTER_AUTH_SECRET, ORIGIN } from '$app/env/private';
import { getRequestEvent } from '$app/server';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { db } from './db/index.ts';
import { createDefaultSettings } from './settings.ts';

export const auth = betterAuth({
	baseURL: ORIGIN,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true },
	databaseHooks: {
		user: {
			create: {
				after: async (user) => createDefaultSettings(db, user.id, user.name)
			}
		}
	},
	// must stay the last plugin
	plugins: [sveltekitCookies(getRequestEvent)]
});
