<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import ClientFields from '#lib/components/ClientFields.svelte';
	import InvoiceTable from '#lib/components/InvoiceTable.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let editing = $state(false);
</script>

<svelte:head>
	<title>{data.client.name} · Fernbill</title>
</svelte:head>

<header class="page-header">
	<h1>{data.client.name}</h1>
	{#if !editing}
		<button type="button" class="secondary" onclick={() => (editing = true)}>Edit</button>
	{/if}
</header>

{#if editing}
	<form
		method="post"
		action="?/update"
		class="stack narrow"
		use:enhance={() => {
			return async ({ result, update }) => {
				await update({ reset: false });
				if (result.type === 'success') editing = false;
			};
		}}
	>
		<ClientFields values={form?.values ?? data.client} errors={form?.errors} />
		<div class="actions">
			<button type="submit">Save changes</button>
			<button type="button" class="secondary" onclick={() => (editing = false)}>Cancel</button>
		</div>
	</form>
{:else}
	<dl class="details">
		<dt>Email</dt>
		<dd>{data.client.email ?? '—'}</dd>
		<dt>Address</dt>
		<dd class="address">{data.client.address ?? '—'}</dd>
	</dl>
{/if}

<section>
	<header class="page-header">
		<h2>Invoices</h2>
		<a class="button secondary" href="{resolve('invoices/new')}?client={data.client.id}"
			>New invoice</a
		>
	</header>
	{#if data.invoices.length === 0}
		<p>No invoices for {data.client.name} yet.</p>
	{:else}
		<InvoiceTable invoices={data.invoices} showClient={false} />
	{/if}
</section>
