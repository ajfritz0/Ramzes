const { toTimeString } = require('./lib/utils');
class PlaylistManager {
	constructor() {
		this.playlist = [];
		this.readHead = -1;
	}

	addItem(item) {
		this.playlist.push(item);
		console.log(this.playlist.length);
	}

	addItems(items = []) {
		if (!(items instanceof Array)) return;
		this.playlist.push(...items);
	}

	insertItems(items = []) {
		if (!(items instanceof Array)) return;
		this.playlist.splice(this.readHead + 1, 0, ...items);
		return this.readHead + 1;
	}

	removeItem(idx) {
		this.playlist.splice(idx, 1);
	}

	clear() {
		delete this.playlist;
		this.playlist = [];
		this.readHead = -1;
	}

	reset() {
		this.readHead = -1;
	}

	isEmpty() {
		return (this.size() == 0);
	}

	isEndOfList() {
		return (this.readHead >= this.playlist.length - 1);
	}

	size() {
		return this.playlist.length;
	}

	selectNext() {
		if (this.isEmpty()) { return null; }
		if (this.readHead == this.playlist.length - 1) return null;
		this.readHead += 1;
		return this.playlist[this.readHead];
	}

	selectPrev() {
		if (this.isEmpty() || this.readHead <= 0) return null;
		this.readHead -= 1;
		return this.playlist[this.readHead];
	}

	selectTrack(index = null) {
		if (index === null) {
			if (this.isEmpty()) return null;
			return (this.readHead < 0) ? this.playlist[0] : this.playlist[this.readHead];
		}
		if (isNaN(index)) return null;
		if (index > this.playlist.length - 1 || index < 0) return null;
		this.readHead = index;
		return this.playlist[this.readHead];
	}

	shuffle() {
		const arr = this.playlist.slice(0);
		for (let i = 0; i < arr.length; i++) {
			const r = Math.floor(Math.random() * arr.length);
			const x = arr[r];
			arr[r] = arr[i];
			arr[i] = x;
		}
		this.playlist = arr;
	}

	showUpcoming(fromPos) {
		const size = this.size();
		const readHead = this.readHead;
		const startPos = (fromPos != undefined && fromPos < size && fromPos > -1) ? fromPos : ((readHead - 5 < 0) ? 0 : readHead - 5);
		const endPos = startPos + 10;
		const truncatedTrackList = this.playlist.slice(startPos, endPos);
		const maxTitleLength = 35;
		const currentTrackTitle = this.playlist[readHead]?.title;

		const str = truncatedTrackList.reduce((prev, curr, idx) => {
			const title = (curr.title.length < maxTitleLength) ? curr.title : curr.title.slice(0, maxTitleLength - 3) + '...';
			const durr = toTimeString(parseInt(curr.duration));
			const line = `${startPos + idx}. [${title}](${durr})`;
			if (curr.title == currentTrackTitle) return prev + `**${line}**\n`;
			return prev + line + '\n';
		}, '```md\n');
		if (size > endPos) {
			return str + `...${size - endPos} more` + '```';
		}
		return str.trim() + '```';
	}
}

module.exports = PlaylistManager;