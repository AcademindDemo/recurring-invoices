<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { parseTaxRate } from '#lib/invoices/totals.ts';
	import { formatInterval, scheduleIntervals } from '#lib/schedules/interval.ts';
	import type { Client } from '#lib/server/db/schema.ts';
	import type { ScheduleFormValues } from '#lib/server/schedules/schedules.ts';
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
		values: ScheduleFormValues;
		errors?: Record<string, string[]>;
		currency: string;
		submitLabel: string;
	} = $props();

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
			How often
			<select name="intervalMonths" value={values.intervalMonths} required>
				{#each scheduleIntervals as months (months)}
					<option value={String(months)}>{formatInterval(months)}</option>
				{/each}
			</select>
			<FieldError errors={errors.intervalMonths} />
		</label>
		<label>
			First billing date
			<input type="date" name="firstBillingDate" value={values.firstBillingDate} required />
			<FieldError errors={errors.firstBillingDate} />
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
			placeholder="Shown at the bottom of every invoice"
			value={values.notes}></textarea>
	</label>

	<p class="hint">
		Each invoice is sent to the client on its billing date. Later billing dates keep the first
		date’s day of the month, or use the month’s last day when it’s shorter.
	</p>

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
