<script lang="ts">
	import { enhance } from '$app/forms';
	import ClientFields from '#lib/components/ClientFields.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>New client · Fernbill</title>
</svelte:head>

<h1>New client</h1>

<form method="post" class="stack narrow" use:enhance>
	<ClientFields values={form?.values} errors={form?.errors} />
	<div>
		<button type="submit">Save client</button>
	</div>
</form>
