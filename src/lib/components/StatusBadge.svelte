<script lang="ts">
	import { statusLabels, type InvoiceStatus } from '#lib/invoices/status.ts';

	let { status }: { status: InvoiceStatus } = $props();
</script>

<span class="badge {status}">{statusLabels[status]}</span>

<style>
	.badge {
		display: inline-block;
		padding: 0.125rem var(--space-2);
		border-radius: 999px;
		background: oklch(from var(--tone) 95% calc(c * 0.4) h);
		color: oklch(from var(--tone) 40% c h);
		font-size: 0.8125rem;
		font-weight: 600;
		--tone: var(--color-muted);
	}

	.sent {
		--tone: oklch(55% 0.14 250);
	}

	.paid {
		--tone: var(--color-accent);
	}

	.overdue {
		--tone: var(--color-danger);
	}
</style>
