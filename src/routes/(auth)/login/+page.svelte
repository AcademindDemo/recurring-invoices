<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Log in · Fernbill</title>
</svelte:head>

<h1>Log in</h1>

<form method="post" class="stack" use:enhance>
	<label>
		Email
		<input type="email" name="email" value={form?.email ?? ''} autocomplete="email" required />
	</label>
	<label>
		Password
		<input type="password" name="password" autocomplete="current-password" required />
	</label>
	{#if form?.message}
		<p class="error" role="alert">{form.message}</p>
	{/if}
	<button type="submit">Log in</button>
</form>

<p>New to Fernbill? <a href={resolve('signup')}>Create an account</a></p>
