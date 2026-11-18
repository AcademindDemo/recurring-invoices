<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const notFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{notFound ? 'Not found' : 'Error'} · Fernbill</title>
</svelte:head>

<main class="error-page">
	<p class="status">{page.status}</p>
	<h1>{notFound ? 'We can’t find that page' : 'Something went wrong'}</h1>
	<p>
		{notFound
			? 'It may have been deleted, or the link has a typo.'
			: 'Try again in a moment. If it keeps happening, let us know.'}
	</p>
	<a class="button" href={resolve('')}>Back to your dashboard</a>
</main>

<style>
	.error-page {
		display: grid;
		place-content: center;
		justify-items: center;
		gap: var(--space-2);
		min-height: 100dvh;
		padding: var(--space-4);
		text-align: center;
	}

	.status {
		color: var(--color-muted);
		font-size: 3rem;
		font-weight: 700;
		line-height: 1;
	}

	h1 {
		margin: 0;
	}

	.button {
		margin-top: var(--space-3);
	}
</style>
