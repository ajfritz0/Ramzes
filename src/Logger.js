const time = () => (new Date()).toISOString();
module.exports = {
	warn: (msg) => {
		console.log(`[${time()}][warn] ${msg}`);
	},
	info: (msg) => {
		console.log(`[${time()}][info] ${msg}`);
	},
	error: (msg) => {
		console.error(`[${time()}][ERROR] ${msg}`);
	},
};