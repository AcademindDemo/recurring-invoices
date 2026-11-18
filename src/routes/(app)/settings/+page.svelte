<script lang="ts">
	import { enhance } from '$app/forms';
	import FieldError from '#lib/components/FieldError.svelte';
	import { currencies } from '#lib/money.ts';
	import { timeZones } from '#lib/time-zones.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived(
		form?.values ?? {
			...data.settings,
			defaultTaxRate: data.settings.defaultTaxRate / 100
		}
	);
	const errors = $derived(form?.errors ?? {});
</script>

<svelte:head>
	<title>Settings · Fernbill</title>
</svelte:head>

<h1>Settings</h1>

<form
	method="post"
	class="stack narrow"
	use:enhance={() =>
		({ update }) =>
			update({ reset: false })}
>
	<h2>Your business</h2>
	<label>
		Business name
		<input name="businessName" value={values.businessName ?? ''} required />
		<FieldError errors={errors.businessName} />
	</label>
	<label>
		Address
		<textarea name="address" rows="3">{values.address ?? ''}</textarea>
		<FieldError errors={errors.address} />
	</label>
	<label>
		Email
		<input type="email" name="email" value={values.email ?? ''} />
		<small class="hint">Clients’ replies to your invoices go here.</small>
		<FieldError errors={errors.email} />
	</label>
	<label>
		Time zone
		<select name="timeZone" value={values.timeZone}>
			{#each timeZones as timeZone (timeZone)}
				<option>{timeZone}</option>
			{/each}
		</select>
		<small class="hint">Times in Fernbill, like when you sent an invoice, show in this zone.</small>
		<FieldError errors={errors.timeZone} />
	</label>

	<h2>Invoices</h2>
	<label>
		Currency
		<select name="currency" value={values.currency}>
			{#each currencies as currency (currency)}
				<option>{currency}</option>
			{/each}
		</select>
		<FieldError errors={errors.currency} />
	</label>
	<label>
		Default tax rate (%)
		<input name="defaultTaxRate" inputmode="decimal" value={values.defaultTaxRate} required />
		<FieldError errors={errors.defaultTaxRate} />
	</label>
	<label>
		Payment terms (days)
		<input
			type="number"
			name="paymentTermsDays"
			min="0"
			max="365"
			value={values.paymentTermsDays}
			required
		/>
		<small class="hint">New invoices are due this many days after their issue date.</small>
		<FieldError errors={errors.paymentTermsDays} />
	</label>
	<label>
		Invoice number prefix
		<input name="invoicePrefix" value={values.invoicePrefix} required />
		<small class="hint"
			>Numbers look like {values.invoicePrefix || 'INV'}-2026-0001 and start again at 0001 each
			year.</small
		>
		<FieldError errors={errors.invoicePrefix} />
	</label>
	<label>
		Payment instructions
		<textarea name="paymentInstructions" rows="3">{values.paymentInstructions ?? ''}</textarea>
		<small class="hint">Shown on every invoice and in the email, e.g. your bank details.</small>
		<FieldError errors={errors.paymentInstructions} />
	</label>

	<div class="actions">
		<button type="submit">Save settings</button>
		{#if form?.saved}<p role="status">Saved.</p>{/if}
	</div>
</form>
