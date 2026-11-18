<script lang="ts">
	import { resolve } from '$app/paths';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import InvoiceTable from '#lib/components/InvoiceTable.svelte';
	import { invoiceSorts, sortLabels } from '#lib/invoices/sort.ts';
	import { invoiceStatuses, statusLabels } from '#lib/invoices/status.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** The query string for this list with some of its filters changed. */
	function query(changes: { status?: string; sort?: string }) {
		const params = Object.entries({ status: data.status, sort: data.sort, ...changes }).filter(
			(param): param is [string, string] => Boolean(param[1])
		);
		return params.length ? `?${new URLSearchParams(params)}` : '';
	}
</script>

<svelte:head>
	<title>Invoices · Fernbill</title>
</svelte:head>

<header class="page-header">
	<h1>Invoices</h1>
	<a class="button" href={resolve('invoices/new')}>New invoice</a>
</header>

<div class="toolbar">
	<nav class="filters" aria-label="Filter by status">
		<a
			href="{resolve('invoices')}{query({ status: undefined })}"
			aria-current={data.status ? undefined : 'page'}>All</a
		>
		{#each invoiceStatuses as status (status)}
			<a
				href="{resolve('invoices')}{query({ status })}"
				aria-current={data.status === status ? 'page' : undefined}
			>
				{statusLabels[status]}
			</a>
		{/each}
	</nav>
	<nav class="filters" aria-label="Sort">
		{#each invoiceSorts as sort (sort)}
			<a
				href="{resolve('invoices')}{query({ sort: sort === 'newest' ? undefined : sort })}"
				aria-current={(data.sort ?? 'newest') === sort ? 'page' : undefined}
			>
				{sortLabels[sort]}
			</a>
		{/each}
	</nav>
</div>

{#if data.status && data.invoices.length === 0}
	<p class="hint">No {statusLabels[data.status].toLowerCase()} invoices.</p>
{:else if data.invoices.length === 0}
	<EmptyState title="No invoices yet">
		<p>Create a draft, check the totals and send it when you’re ready.</p>
		<a class="button" href={resolve('invoices/new')}>Create your first invoice</a>
	</EmptyState>
{:else}
	<InvoiceTable invoices={data.invoices} />
{/if}

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--space-2);
		margin-bottom: var(--space-3);
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);

		a {
			padding: var(--space-1) var(--space-3);
			border-radius: 999px;
			color: var(--color-muted);
			font-size: 0.875rem;
			font-weight: 500;
			text-decoration: none;

			&:hover {
				color: var(--color-text);
			}

			&[aria-current='page'] {
				background: oklch(from var(--color-accent) l c h / 0.1);
				color: var(--color-accent-strong);
			}
		}
	}
</style>
