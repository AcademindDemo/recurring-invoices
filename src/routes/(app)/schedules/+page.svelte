<script lang="ts">
	import { resolve } from '$app/paths';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { formatDate } from '#lib/format.ts';
	import { formatMoney } from '#lib/money.ts';
	import { formatInterval } from '#lib/schedules/interval.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Schedules · Fernbill</title>
</svelte:head>

<header class="page-header">
	<h1>Schedules</h1>
	<a class="button" href={resolve('schedules/new')}>New schedule</a>
</header>

{#if data.schedules.length === 0}
	<EmptyState title="No schedules yet">
		<p>
			Bill a client the same amount every month or year. Fernbill sends each invoice on its date.
		</p>
		<a class="button" href={resolve('schedules/new')}>Set up your first schedule</a>
	</EmptyState>
{:else}
	<div class="table-scroll">
		<table>
			<thead>
				<tr>
					<th>Client</th>
					<th>How often</th>
					<th>Next billing</th>
					<th class="number">Per invoice</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#each data.schedules as schedule (schedule.id)}
					<tr>
						<td>
							<a href={resolve('/(app)/schedules/[id=id]', { id: schedule.id })}
								>{schedule.client.name}</a
							>
						</td>
						<td>{formatInterval(schedule.intervalMonths)}</td>
						<td>{schedule.nextBillingOn ? formatDate(schedule.nextBillingOn) : '—'}</td>
						<td class="number">{formatMoney(schedule.total, data.currency)}</td>
						<td><StatusBadge status={schedule.status} /></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
