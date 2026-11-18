import { defineParams } from '@sveltejs/kit/params';

export const params = defineParams({
	id: (param) => {
		if (/^[1-9]\d*$/.test(param)) return Number(param);
	}
});
