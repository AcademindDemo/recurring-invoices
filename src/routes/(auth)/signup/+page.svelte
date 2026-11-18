<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Create an account · Fernbill</title>
</svelte:head>

<h1>Create an account</h1>

<form method="post" class="stack" use:enhance>
	<label>
		Your name
		<input name="name" value={form?.name ?? ''} autocomplete="name" required />
	</label>
	<label>
		Email
		<input type="email" name="email" value={form?.email ?? ''} autocomplete="email" required />
	</label>
	<label>
		Password
		<input type="password" name="password" autocomplete="new-password" minlength="8" required />
	</label>
	{#if form?.message}
		<p class="error" role="alert">{form.message}</p>
	{/if}
	<button type="submit">Create account</button>
</form>

<p>Already have an account? <a href={resolve('login')}>Log in</a></p>
