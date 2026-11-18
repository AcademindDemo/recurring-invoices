<script lang="ts">
	import { resolve } from '$app/paths';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<main class="auth">
	<a class="brand" href={resolve('')}>Fernbill</a>
	<div class="card">
		{@render children()}
	</div>
</main>

<style>
	.auth {
		display: grid;
		place-content: center;
		justify-items: center;
		gap: var(--space-4);
		min-height: 100dvh;
		padding: var(--space-4);
	}

	.brand {
		color: var(--color-text);
		font-size: 1.5rem;
		font-weight: 700;
		text-decoration: none;
	}

	.card {
		display: grid;
		gap: var(--space-4);
		width: min(100vw - 2 * var(--space-4), 24rem);
		padding: var(--space-5) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: calc(var(--radius) * 2);
		background: var(--color-surface);
		box-shadow: 0 1px 2px oklch(0% 0 0 / 0.04);

		:global(p) {
			color: var(--color-muted);
			font-size: 0.875rem;
		}
	}
</style>
