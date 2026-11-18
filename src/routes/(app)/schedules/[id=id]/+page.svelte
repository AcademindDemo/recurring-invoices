<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import InvoiceTable from '#lib/components/InvoiceTable.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { formatDate } from '#lib/format.ts';
	import { calculateTotals, formatTaxRate, lineAmount } from '#lib/invoices/totals.ts';
	import { formatMoney } from '#lib/money.ts';
	import { formatInterval } from '#lib/schedules/interval.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const schedule = $derived(data.schedule);
	const totals = $derived(calculateTotals(schedule.lines, schedule.taxRate));
	const money = (cents: number) => formatMoney(cents, data.currency);
</script>

<svelte:head>
	<title>Recurring invoice for {schedule.client.name} · Fernbill</title>
</svelte:head>

<header class="page-header">
	<h1>Recurring invoice for {schedule.client.name}</h1>
	<StatusBadge status={schedule.status} />
</header>

{#if schedule.status !== 'ended'}
	<div class="actions">
		{#if schedule.status === 'active'}
			<form method="post" action="?/pause" use:enhance>
				<button type="submit" class="secondary">Pause</button>
			</form>
		{:else}
			<form method="post" action="?/resume" use:enhance>
				<button type="submit">Resume</button>
			</form>
		{/if}
		<form
			method="post"
			action="?/end"
			use:enhance={({ cancel }) => {
				if (
					!confirm(`End the schedule for ${schedule.client.name}? It won’t send any more invoices.`)
				)
					cancel();
			}}
		>
			<button type="submit" class="danger">End</button>
		</form>
	</div>
	{#if form?.statusError}
		<p class="error" role="alert">{form.statusError}</p>
	{/if}
{/if}

<dl class="details">
	<dt>Client</dt>
	<dd>
		<a href={resolve('/(app)/clients/[id=id]', { id: schedule.client.id })}
			>{schedule.client.name}</a
		>
	</dd>
	<dt>How often</dt>
	<dd>{formatInterval(schedule.intervalMonths)}</dd>
	<dt>First billing date</dt>
	<dd>{formatDate(schedule.firstBillingDate)}</dd>
	{#if data.upcoming.length > 0}
		<dt>Next billing dates</dt>
		<dd>
			<ul class="dates">
				{#each data.upcoming as date (date)}
					<li>{formatDate(date)}</li>
				{/each}
			</ul>
		</dd>
	{/if}
</dl>

<div class="table-scroll">
	<table>
		<thead>
			<tr>
				<th>Description</th>
				<th class="number">Qty</th>
				<th class="number">Unit price</th>
				<th class="number">Amount</th>
			</tr>
		</thead>
		<tbody>
			{#each schedule.lines as line (line.id)}
				<tr>
					<td>{line.description}</td>
					<td class="number">{line.quantity}</td>
					<td class="number">{money(line.unitPrice)}</td>
					<td class="number">{money(lineAmount(line))}</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr>
				<td colspan="3">Subtotal</td>
				<td class="number">{money(totals.subtotal)}</td>
			</tr>
			<tr>
				<td colspan="3">Tax ({formatTaxRate(schedule.taxRate)})</td>
				<td class="number">{money(totals.tax)}</td>
			</tr>
			<tr>
				<th colspan="3">Total per invoice</th>
				<td class="number"><strong>{money(totals.total)}</strong></td>
			</tr>
		</tfoot>
	</table>
</div>

{#if schedule.notes}
	<h2>Notes</h2>
	<p class="notes">{schedule.notes}</p>
{/if}

<h2>Invoices</h2>
{#if data.invoices.length === 0 && data.upcoming.length > 0}
	<p>No invoices yet. The first goes out on {formatDate(data.upcoming[0])}.</p>
{:else if data.invoices.length === 0}
	<p>No invoices yet.</p>
{:else}
	<InvoiceTable invoices={data.invoices} showClient={false} />
{/if}

<style>
	.dates {
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
