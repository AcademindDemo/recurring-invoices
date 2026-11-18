<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatDate } from '#lib/format.ts';
	import { calculateTotals, formatTaxRate, lineAmount } from '#lib/invoices/totals.ts';
	import { formatMoney } from '#lib/money.ts';
	import { formatInterval } from '#lib/schedules/interval.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const schedule = $derived(data.schedule);
	const totals = $derived(calculateTotals(schedule.lines, schedule.taxRate));
	const money = (cents: number) => formatMoney(cents, data.currency);
</script>

<svelte:head>
	<title>Recurring invoice for {schedule.client.name} · Fernbill</title>
</svelte:head>

<h1>Recurring invoice for {schedule.client.name}</h1>

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
	<dt>Next billing dates</dt>
	<dd>
		<ul class="dates">
			{#each data.upcoming as date (date)}
				<li>{formatDate(date)}</li>
			{/each}
		</ul>
	</dd>
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

<style>
	.dates {
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
