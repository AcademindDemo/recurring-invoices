<script lang="ts">
	import { formatTimestamp } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let selected = $state(0);
	const mail = $derived(data.mails[selected]);
</script>

<svelte:head>
	<title>Mail previews · Fernbill</title>
</svelte:head>

<div class="previews">
	<nav>
		<h1>Mail previews</h1>
		{#each data.mails as { subject, to, sentAt }, index (sentAt + to)}
			<button type="button" class:current={index === selected} onclick={() => (selected = index)}>
				<strong>{subject}</strong>
				<span>{to} · {formatTimestamp(new Date(sentAt), 'UTC')}</span>
			</button>
		{:else}
			<p>No mail yet. Send an invoice and it shows up here.</p>
		{/each}
	</nav>

	{#if mail}
		<article>
			<dl class="details">
				<dt>From</dt>
				<dd>{mail.from}</dd>
				{#if mail.replyTo}
					<dt>Reply to</dt>
					<dd>{mail.replyTo}</dd>
				{/if}
				<dt>To</dt>
				<dd>{mail.to}</dd>
				<dt>Subject</dt>
				<dd>{mail.subject}</dd>
			</dl>
			<iframe title="HTML version" srcdoc={mail.html} sandbox=""></iframe>
			<pre>{mail.text}</pre>
		</article>
	{/if}
</div>

<style>
	.previews {
		display: grid;
		grid-template-columns: 20rem 1fr;
		min-height: 100dvh;
	}

	nav {
		display: grid;
		align-content: start;
		gap: var(--space-1);
		padding: var(--space-4);
		border-right: 1px solid var(--color-border);

		button {
			display: grid;
			padding: var(--space-2);
			border: none;
			border-radius: var(--radius);
			background: none;
			color: inherit;
			text-align: left;

			&.current {
				background: var(--color-surface);
			}
		}

		span {
			color: var(--color-muted);
			font-size: 0.8125rem;
		}
	}

	article {
		display: grid;
		align-content: start;
		gap: var(--space-4);
		padding: var(--space-4);
	}

	iframe {
		width: 100%;
		height: 28rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: white;
	}

	pre {
		white-space: pre-wrap;
	}
</style>
