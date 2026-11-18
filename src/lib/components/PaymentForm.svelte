<script lang="ts">
	import { enhance } from '$app/forms';
	import { paymentMethodLabels, paymentMethods } from '#lib/invoices/payments.ts';
	import FieldError from './FieldError.svelte';

	type Values = { amount?: unknown; paidOn?: unknown; method?: unknown; note?: unknown };

	let { values, errors = {} }: { values: Values; errors?: Record<string, string[]> } = $props();
</script>

<form method="post" action="?/pay" use:enhance>
	<label>
		Amount
		<input name="amount" inputmode="decimal" defaultValue={values.amount ?? ''} required />
		<FieldError errors={errors.amount} />
	</label>
	<label>
		Received on
		<input type="date" name="paidOn" defaultValue={values.paidOn ?? ''} required />
		<FieldError errors={errors.paidOn} />
	</label>
	<label>
		Method
		<select name="method" value={values.method ?? ''}>
			{#each paymentMethods as method (method)}
				<option value={method}>{paymentMethodLabels[method]}</option>
			{/each}
		</select>
		<FieldError errors={errors.method} />
	</label>
	<label>
		Note
		<input name="note" defaultValue={values.note ?? ''} />
	</label>
	<button type="submit">Record payment</button>
</form>

<style>
	form {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		align-items: end;
		gap: var(--space-3);
		margin-top: var(--space-3);
	}

	label {
		min-width: 0;
	}

	input,
	select {
		width: 100%;
	}

	@media print {
		form {
			display: none;
		}
	}
</style>
