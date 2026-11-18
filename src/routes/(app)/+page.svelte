<script lang="ts">
	import { resolve } from '$app/paths';
	import InvoiceTable from '#lib/components/InvoiceTable.svelte';
	import { formatMoney } from '#lib/money.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Dashboard · Fernbill</title>
</svelte:head>

<header class="page-header">
	<h1>Welcome back, {data.user.name}</h1>
	<a class="button" href={resolve('invoices/new')}>New invoice</a>
</header>

<dl class="stats">
	<div>
		<dt>Outstanding</dt>
		{#each data.outstanding as { currency, total } (currency)}
			<dd>{formatMoney(total, currency)}</dd>
		{:else}
			<dd class="quiet">Nothing owed right now</dd>
		{/each}
	</div>
	<div>
		<dt>Received this month</dt>
		{#each data.receivedThisMonth as { currency, total } (currency)}
			<dd>{formatMoney(total, currency)}</dd>
		{:else}
			<dd class="quiet">No payments yet this month</dd>
		{/each}
	</div>
	<div>
		<dt>Drafts</dt>
		<dd>{data.drafts}</dd>
	</div>
</dl>

{#if data.overdueInvoices.length}
	<h2>Overdue</h2>
	<p class="hint">These clients are past their due date. A friendly nudge usually does it.</p>
	<InvoiceTable invoices={data.overdueInvoices} />
{/if}

<h2>Recent invoices</h2>
{#if data.recentInvoices.length === 0}
	<p>Your latest invoices will show up here.</p>
{:else}
	<InvoiceTable invoices={data.recentInvoices} />
{/if}

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
		gap: var(--space-3);
		margin-bottom: var(--space-5);

		div {
			padding: var(--space-3) var(--space-4);
			border: 1px solid var(--color-border);
			border-radius: var(--radius);
			background: var(--color-surface);
		}

		dt {
			color: var(--color-muted);
			font-size: 0.8125rem;
			font-weight: 600;
		}

		dd {
			margin: var(--space-1) 0 0;
			font-size: 1.5rem;
			font-weight: 600;
			font-variant-numeric: tabular-nums;
		}

		.quiet {
			color: var(--color-muted);
			font-size: 1rem;
			font-weight: 400;
		}
	}
</style>
