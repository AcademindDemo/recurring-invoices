<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import PaymentForm from '#lib/components/PaymentForm.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { formatDate, formatTimestamp } from '#lib/format.ts';
	import { formatTaxRate } from '#lib/invoices/totals.ts';
	import { paymentMethodLabels } from '#lib/invoices/payments.ts';
	import { formatMoney, toMoneyInput } from '#lib/money.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const invoice = $derived(data.invoice);
	const money = (cents: number) => formatMoney(cents, invoice.currency);
</script>

<svelte:head>
	<title>{invoice.number} · Fernbill</title>
</svelte:head>

<header class="page-header">
	<h1>{invoice.number}</h1>
	<StatusBadge status={invoice.status} />
</header>

{#if invoice.status === 'draft'}
	<div class="actions">
		<form method="post" action="?/send" use:enhance>
			<button type="submit">Send to client</button>
		</form>
		<a class="button secondary" href={resolve('/(app)/invoices/[id=id]/edit', { id: invoice.id })}>
			Edit
		</a>
		<form
			method="post"
			action="?/delete"
			use:enhance={({ cancel }) => {
				if (!confirm(`Delete draft ${invoice.number}?`)) cancel();
			}}
		>
			<button type="submit" class="danger">Delete</button>
		</form>
	</div>
	{#if form?.sendError}
		<p class="error" role="alert">{form.sendError}</p>
	{/if}
{/if}

<dl class="details">
	<dt>Client</dt>
	<dd>
		<a href={resolve('/(app)/clients/[id=id]', { id: invoice.client.id })}>{invoice.client.name}</a>
	</dd>
	<dt>Issued</dt>
	<dd>{formatDate(invoice.issueDate)}</dd>
	<dt>Due</dt>
	<dd>{formatDate(invoice.dueDate)}</dd>
	{#if invoice.sentAt}
		<dt>Sent</dt>
		<dd>
			{formatTimestamp(invoice.sentAt, data.timeZone)}
			{#if invoice.client.email}to {invoice.client.email}{/if}
		</dd>
	{/if}
	{#if invoice.paidOn}
		<dt>Paid</dt>
		<dd>{formatDate(invoice.paidOn)}</dd>
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
			{#each invoice.lines as line (line.id)}
				<tr>
					<td>{line.description}</td>
					<td class="number">{line.quantity}</td>
					<td class="number">{money(line.unitPrice)}</td>
					<td class="number">{money(line.amount)}</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr>
				<td colspan="3">Subtotal</td>
				<td class="number">{money(invoice.subtotal)}</td>
			</tr>
			<tr>
				<td colspan="3">Tax ({formatTaxRate(invoice.taxRate)})</td>
				<td class="number">{money(invoice.tax)}</td>
			</tr>
			<tr>
				<th colspan="3">Total</th>
				<td class="number"><strong>{money(invoice.total)}</strong></td>
			</tr>
		</tfoot>
	</table>
</div>

{#if invoice.status !== 'draft'}
	<section>
		<h2>Payments</h2>
		{#if invoice.payments.length}
			<div class="table-scroll">
				<table>
					<thead>
						<tr>
							<th>Received</th>
							<th>Method</th>
							<th>Note</th>
							<th class="number">Amount</th>
						</tr>
					</thead>
					<tbody>
						{#each invoice.payments as payment (payment.id)}
							<tr>
								<td>{formatDate(payment.paidOn)}</td>
								<td>{paymentMethodLabels[payment.method]}</td>
								<td>{payment.note}</td>
								<td class="number">{money(payment.amount)}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<th colspan="3">Balance due</th>
							<td class="number"><strong>{money(data.balance)}</strong></td>
						</tr>
					</tfoot>
				</table>
			</div>
		{:else}
			<p class="hint">
				No payments yet. Record each one as it arrives; the invoice turns paid once they cover the
				total.
			</p>
		{/if}
		{#if invoice.status === 'sent' || invoice.status === 'overdue'}
			<PaymentForm
				values={form?.paymentValues ?? {
					amount: toMoneyInput(data.balance),
					paidOn: data.today,
					method: 'bank_transfer',
					note: ''
				}}
				errors={form?.paymentErrors}
			/>
		{/if}
	</section>
{/if}

{#if invoice.notes}
	<h2>Notes</h2>
	<p class="notes">{invoice.notes}</p>
{/if}

{#if data.paymentInstructions}
	<h2>How to pay</h2>
	<p class="notes">{data.paymentInstructions}</p>
{/if}
