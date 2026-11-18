<script lang="ts">
	import FieldError from './FieldError.svelte';

	type Values = { name?: unknown; email?: unknown; address?: unknown };

	let { values = {}, errors = {} }: { values?: Values; errors?: Record<string, string[]> } =
		$props();
</script>

<label>
	Name
	<input name="name" value={values.name ?? ''} required />
	<FieldError errors={errors.name} />
</label>
<label>
	Email
	<input type="email" name="email" value={values.email ?? ''} />
	<FieldError errors={errors.email} />
</label>
<label>
	Address
	<textarea name="address" rows="3">{values.address ?? ''}</textarea>
	<FieldError errors={errors.address} />
</label>
