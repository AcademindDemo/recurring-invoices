<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const links = [
		{ path: '', label: 'Dashboard' },
		{ path: 'invoices', label: 'Invoices' },
		{ path: 'clients', label: 'Clients' },
		{ path: 'settings', label: 'Settings' }
	] as const;

	function isCurrent(path: string) {
		const pathname = page.url.pathname;
		return path === '' ? pathname === '/' : pathname.startsWith(`/${path}`);
	}
</script>

<div class="shell">
	<aside class="sidebar">
		<a class="brand" href={resolve('')}>Fernbill</a>
		<nav>
			{#each links as link (link.path)}
				<a href={resolve(link.path)} aria-current={isCurrent(link.path) ? 'page' : undefined}>
					{link.label}
				</a>
			{/each}
		</nav>
		<div class="account">
			<span>{data.user.name}</span>
			<form method="post" action={resolve('logout')}>
				<button type="submit" class="link">Log out</button>
			</form>
		</div>
	</aside>
	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: 14rem minmax(0, 1fr);
		min-height: 100dvh;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-3);
		border-right: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.brand {
		padding-inline: var(--space-2);
		color: var(--color-text);
		font-size: 1.25rem;
		font-weight: 700;
		text-decoration: none;
	}

	nav {
		display: grid;
		gap: var(--space-1);

		a {
			padding: var(--space-2);
			border-radius: var(--radius);
			color: var(--color-muted);
			font-weight: 500;
			text-decoration: none;

			&:hover {
				background: var(--color-bg);
				color: var(--color-text);
			}

			&[aria-current='page'] {
				background: oklch(from var(--color-accent) l c h / 0.1);
				color: var(--color-accent-strong);
			}
		}
	}

	.account {
		display: grid;
		gap: var(--space-1);
		margin-top: auto;
		padding-inline: var(--space-2);
		font-size: 0.875rem;
	}

	.content {
		width: min(100%, 64rem);
		padding: var(--space-5) var(--space-4);
	}

	@media (width < 48rem) {
		.shell {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto 1fr;
		}

		.sidebar {
			flex-flow: row wrap;
			align-items: center;
			gap: var(--space-2);
			padding: var(--space-3);
			border-right: none;
			border-bottom: 1px solid var(--color-border);
		}

		nav {
			display: flex;
			order: 1;
			flex-basis: 100%;
			overflow-x: auto;
		}

		.account {
			display: flex;
			align-items: baseline;
			gap: var(--space-2);
			margin: 0 0 0 auto;
		}

		.content {
			padding: var(--space-4) var(--space-3);
		}
	}

	@media print {
		.shell {
			display: block;
		}

		.sidebar {
			display: none;
		}

		.content {
			width: auto;
			padding: 0;
		}
	}
</style>
