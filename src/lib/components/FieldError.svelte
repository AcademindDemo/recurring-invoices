<script lang="ts">
	let { errors }: { errors?: string[] } = $props();
</script>

{#if errors?.length}
	<span class="error">{errors[0]}</span>
{/if}

<style>
	span {
		font-size: 0.8125rem;
		font-weight: 400;
	}
</style>
