<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<div class="empty">
	<h2>{title}</h2>
	{@render children()}
</div>

<style>
	.empty {
		display: grid;
		justify-items: center;
		gap: var(--space-2);
		padding: var(--space-5) var(--space-4);
		border: 1px dashed var(--color-border);
		border-radius: calc(var(--radius) * 2);
		color: var(--color-muted);
		text-align: center;
	}

	h2 {
		color: var(--color-text);
	}
</style>
