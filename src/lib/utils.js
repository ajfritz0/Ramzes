module.exports = {
	toTimeString: (seconds) => {
		const date = new Date(0);
		date.setHours(0);
		date.setSeconds(seconds);
		const h = date.getHours();
		const m = date.getMinutes();
		const s = date.getSeconds();
		return `${((h == 0) ? '' : (((h < 10) ? '0' + h : h) + ':'))}${(m < 10) ? '0' + m : m}:${(s < 10) ? '0' + s : s}`;
	},
};