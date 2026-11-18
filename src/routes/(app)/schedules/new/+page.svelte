<script lang="ts">
	import { resolve } from '$app/paths';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import ScheduleForm from '#lib/components/ScheduleForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>New recurring invoice · Fernbill</title>
</svelte:head>

<h1>New recurring invoice</h1>

{#if data.clients.length === 0}
	<EmptyState title="Add a client first">
		<p>Every recurring invoice goes to a client.</p>
		<a class="button" href={resolve('clients/new')}>New client</a>
	</EmptyState>
{:else}
	<ScheduleForm
		clients={data.clients}
		values={form?.values ?? data.values}
		errors={form?.errors}
		currency={data.currency}
		submitLabel="Save schedule"
	/>
{/if}
