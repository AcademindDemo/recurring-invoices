export const scheduleStatuses = ['active', 'paused', 'ended'] as const;

export type ScheduleStatus = (typeof scheduleStatuses)[number];

export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
	active: 'Active',
	paused: 'Paused',
	ended: 'Ended'
};
