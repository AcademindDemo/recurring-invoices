<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { parseTaxRate } from '#lib/invoices/totals.ts';
	import type { Client } from '#lib/server/db/schema.ts';
	import type { InvoiceFormValues } from '#lib/server/invoices/invoices.ts';
	import FieldError from './FieldError.svelte';
	import LineItemsEditor from './LineItemsEditor.svelte';

	let {
		clients,
		values,
		errors = {},
		currency,
		submitLabel
	}: {
		clients: Pick<Client, 'id' | 'name'>[];
		values: InvoiceFormValues;
		errors?: Record<string, string[]>;
		currency: string;
		submitLabel: string;
	} = $props();

	// Tax rate and lines drive the live totals; after a failed submit they keep what was typed
	let taxRate = $state(untrack(() => values.taxRate));
	let lines = $state(untrack(() => values.lines));
</script>

<form method="post" class="stack" use:enhance>
	<div class="fields">
		<label>
			Client
			<select name="clientId" value={values.clientId} required>
				<option value="" disabled>Choose a client</option>
				{#each clients as client (client.id)}
					<option value={String(client.id)}>{client.name}</option>
				{/each}
			</select>
			<FieldError errors={errors.clientId} />
		</label>
		<label>
			Issue date
			<input type="date" name="issueDate" value={values.issueDate} required />
			<FieldError errors={errors.issueDate} />
		</label>
		<label>
			Due date
			<input type="date" name="dueDate" value={values.dueDate} required />
			<FieldError errors={errors.dueDate} />
		</label>
		<label>
			Tax rate (%)
			<input name="taxRate" inputmode="decimal" bind:value={taxRate} required />
			<FieldError errors={errors.taxRate} />
		</label>
	</div>

	<LineItemsEditor bind:lines taxRate={parseTaxRate(taxRate) ?? 0} {currency} />
	<FieldError errors={errors.lines} />

	<label>
		Notes for the client
		<textarea
			name="notes"
			rows="3"
			placeholder="Shown at the bottom of the invoice"
			value={values.notes}></textarea>
	</label>

	<div class="actions">
		<button type="submit">{submitLabel}</button>
	</div>
</form>

<style>
	.fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: var(--space-3);
	}
</style>
