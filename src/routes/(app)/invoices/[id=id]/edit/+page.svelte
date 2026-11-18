<script lang="ts">
	import InvoiceForm from '#lib/components/InvoiceForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Edit {data.invoice.number} · Fernbill</title>
</svelte:head>

<h1>Edit {data.invoice.number}</h1>

<InvoiceForm
	clients={data.clients}
	values={form?.values ?? data.values}
	errors={form?.errors}
	currency={data.invoice.currency}
	submitLabel="Save changes"
/>
