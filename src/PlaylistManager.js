class PlaylistManager {
	constructor() {
		this.playlist = [];
		this.readHead = 0;
	}

	addItem(item) {
		this.playlist.push(item);
		console.log(this.playlist.length);
	}

	addItems(items = []) {
		if (!(items instanceof Array)) return;
		this.playlist.push(...items);
	}

	clear() {
		delete this.playlist;
		this.playlist = [];
		this.readHead = 0;
	}

	reset() {
		this.readHead = 0;
	}

	isEmpty() {
		return (this.playlist.length == 0);
	}

	selectNext() {
		if (this.playlist.length == 0 || this.readHead >= this.playlist.length - 1) {
			return null;
		}
		this.readHead += 1;
		return this.playlist[this.readHead];
	}

	selectPrev() {
		if (this.isEmpty() || this.readHead == 0) return null;
		this.readHead -= 1;
		return this.playlist[this.readHead];
	}

	selectTrack(index = null) {
		if (index === null) return (this.isEmpty()) ? null : this.playlist[this.readHead];
		if (isNaN(index)) return null;
		if (index > this.playlist.length - 1 || index < 0) return null;
		this.readHead = index;
		return this.playlist[this.readHead];
	}
}

module.exports = PlaylistManager;