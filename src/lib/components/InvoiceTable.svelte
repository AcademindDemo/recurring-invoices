<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatDate } from '#lib/format.ts';
	import type { InvoiceStatus } from '#lib/invoices/status.ts';
	import { formatMoney } from '#lib/money.ts';
	import StatusBadge from './StatusBadge.svelte';

	type Row = {
		id: number;
		number: string;
		clientName: string;
		issueDate: string;
		dueDate: string;
		currency: string;
		total: number;
		status: InvoiceStatus;
	};

	let { invoices, showClient = true }: { invoices: Row[]; showClient?: boolean } = $props();
</script>

<div class="table-scroll">
	<table>
		<thead>
			<tr>
				<th>Number</th>
				{#if showClient}<th>Client</th>{/if}
				<th>Issued</th>
				<th>Due</th>
				<th class="number">Total</th>
				<th>Status</th>
			</tr>
		</thead>
		<tbody>
			{#each invoices as invoice (invoice.id)}
				<tr>
					<td>
						<a href={resolve('/(app)/invoices/[id=id]', { id: invoice.id })}>{invoice.number}</a>
					</td>
					{#if showClient}<td>{invoice.clientName}</td>{/if}
					<td>{formatDate(invoice.issueDate)}</td>
					<td>{formatDate(invoice.dueDate)}</td>
					<td class="number">{formatMoney(invoice.total, invoice.currency)}</td>
					<td><StatusBadge status={invoice.status} /></td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
