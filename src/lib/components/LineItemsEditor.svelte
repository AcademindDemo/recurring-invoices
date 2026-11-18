<script lang="ts">
	import { calculateTotals, formatTaxRate, lineAmount } from '#lib/invoices/totals.ts';
	import { formatMoney, parseMoney } from '#lib/money.ts';

	export type LineValues = { description: string; quantity: string; unitPrice: string };

	let {
		lines = $bindable(),
		taxRate,
		currency
	}: { lines: LineValues[]; taxRate: number; currency: string } = $props();

	const amounts = $derived(
		lines.map((line) => ({
			quantity: Number(line.quantity) || 0,
			unitPrice: parseMoney(line.unitPrice) ?? 0
		}))
	);
	const totals = $derived(calculateTotals(amounts, taxRate));

	function addLine() {
		lines.push({ description: '', quantity: '1', unitPrice: '' });
	}

	function removeLine(index: number) {
		lines.splice(index, 1);
	}
</script>

<div class="table-scroll">
	<table class="lines">
		<thead>
			<tr>
				<th>Description</th>
				<th class="number">Qty</th>
				<th class="number">Unit price</th>
				<th class="number">Amount</th>
				<th><span class="visually-hidden">Remove</span></th>
			</tr>
		</thead>
		<tbody>
			{#each lines as line, index (line)}
				<tr>
					<td>
						<input
							name="description"
							bind:value={line.description}
							placeholder="What you did or delivered"
							aria-label="Description"
							required
						/>
					</td>
					<td class="number">
						<input
							name="quantity"
							type="number"
							step="any"
							min="0"
							bind:value={line.quantity}
							aria-label="Quantity"
							required
						/>
					</td>
					<td class="number">
						<input
							name="unitPrice"
							inputmode="decimal"
							bind:value={line.unitPrice}
							placeholder="0.00"
							aria-label="Unit price"
							required
						/>
					</td>
					<td class="number">
						{formatMoney(lineAmount(amounts[index]), currency)}
					</td>
					<td>
						<button
							type="button"
							class="link"
							onclick={() => removeLine(index)}
							disabled={lines.length === 1}
						>
							Remove
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr>
				<td colspan="5"
					><button type="button" class="secondary" onclick={addLine}>Add line</button></td
				>
			</tr>
		</tfoot>
	</table>
</div>

<dl class="totals">
	<dt>Subtotal</dt>
	<dd>{formatMoney(totals.subtotal, currency)}</dd>
	<dt>Tax ({formatTaxRate(taxRate)})</dt>
	<dd>{formatMoney(totals.tax, currency)}</dd>
	<dt>Total</dt>
	<dd>{formatMoney(totals.total, currency)}</dd>
</dl>

<style>
	.lines {
		td {
			padding: var(--space-1) var(--space-2);
			vertical-align: middle;
		}

		input {
			width: 100%;
		}

		td:first-child input {
			min-width: 10rem;
		}

		td:nth-child(2) {
			width: 6rem;

			input {
				min-width: 4rem;
			}
		}

		td:nth-child(3) {
			width: 9rem;

			input {
				min-width: 6rem;
			}
		}

		.number input {
			text-align: right;
		}
	}

	.totals {
		display: grid;
		grid-template-columns: 1fr max-content;
		gap: var(--space-1) var(--space-4);
		justify-self: end;
		min-width: 16rem;
		font-variant-numeric: tabular-nums;

		dd {
			margin: 0;
			text-align: right;
		}

		dt:last-of-type,
		dd:last-of-type {
			padding-top: var(--space-2);
			border-top: 1px solid var(--color-border);
			font-weight: 600;
		}
	}
</style>
