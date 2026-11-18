<script lang="ts">
	import { resolve } from '$app/paths';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Clients · Fernbill</title>
</svelte:head>

<header class="page-header">
	<h1>Clients</h1>
	<a class="button" href={resolve('clients/new')}>New client</a>
</header>

{#if data.search || data.clients.length > 0}
	<form class="search" role="search">
		<label>
			<span class="visually-hidden">Search clients</span>
			<input type="search" name="q" value={data.search} placeholder="Search by name or email" />
		</label>
		<button type="submit" class="secondary">Search</button>
	</form>
{/if}

{#if data.search && data.clients.length === 0}
	<p class="hint">No clients match “{data.search}”.</p>
{:else if data.clients.length === 0}
	<EmptyState title="No clients yet">
		<p>Add the people and companies you work for. You’ll pick one for every invoice.</p>
		<a class="button" href={resolve('clients/new')}>Add your first client</a>
	</EmptyState>
{:else}
	<div class="table-scroll">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th class="number">Invoices</th>
				</tr>
			</thead>
			<tbody>
				{#each data.clients as client (client.id)}
					<tr>
						<td><a href={resolve('/(app)/clients/[id=id]', { id: client.id })}>{client.name}</a></td
						>
						<td>{client.email ?? '—'}</td>
						<td class="number">{client.invoiceCount}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.search {
		display: flex;
		gap: var(--space-2);
		max-width: 28rem;
		margin-bottom: var(--space-3);

		label {
			flex: 1;
		}
	}
</style>
