const ytdl = require('ytdl-core');
const PlaylistManager = require('./PlaylistManager');
const ytpl = require('ytpl');
const { EmbedBuilder } = require('discord.js');

const {
	AudioPlayerStatus,
	StreamType,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
	getVoiceConnection,
	VoiceConnectionStatus,
} = require('@discordjs/voice');

const toTimeString = (seconds) => {
	const date = new Date(0);
	date.setHours(0);
	date.setSeconds(seconds);
	const h = date.getHours();
	const m = date.getMinutes();
	const s = date.getSeconds();
	return `${((h == 0) ? '' : (((h < 10) ? '0' + h : h) + ':'))}${(m < 10) ? '0' + m : m}:${(s < 10) ? '0' + s : s}`;
};

class MusicPlayer {
	constructor() {
		this.player = createAudioPlayer();
		this.voiceChannelIdleTimer = null;
		this.musicPlayerIdleTimer = null;
		this.lonelyTimer = null;
		this.stream = null;
		this.playlist = new PlaylistManager();
		this.isStopped = true;
		this.doLoop = false;
		this.textChannel = null;
		this.lastSentMessage = null;
		this.guildId = null;

		const setTimer = () => {
			this.voiceChannelIdleTimer = setTimeout(this.destroy.bind(this), 5 * 60 * 1000);
			this.musicPlayerIdleTimer = setTimeout(this.clearPlaylist.bind(this), 2 * 60 * 60 * 1000);
		};
		this.player.on(AudioPlayerStatus.Idle, () => {
			setTimer();
			if (this.isStopped) return;

			this.deleteMesssage();
			this.playNext();
		});
		this.player.on(AudioPlayerStatus.Paused, setTimer);
		this.player.on(AudioPlayerStatus.Playing, () => {
			if (this.timer !== null) clearTimeout(this.voiceChannelIdleTimer);
			if (this.musicPlayerIdleTimer !== null) clearTimeout(this.musicPlayerIdleTimer);
		});

		this.player.on('error', console.error);
	}

	async add(url, bAppend = true) {
		let insertionIndex = -1;
		if (ytdl.validateURL(url)) {
			try {
				const videoDetails = (await ytdl.getBasicInfo(url)).videoDetails;

				const trackItem = {
					title: videoDetails.title,
					duration: parseInt(videoDetails.lengthSeconds),
					video_url: videoDetails.video_url,
					author_name: videoDetails.author.name,
					author_channel: videoDetails.author.channel_url,
					thumbnail: videoDetails.author.thumbnails[0].url,
				};

				if (bAppend) {
					insertionIndex = this.playlist.playlist.length;
					this.playlist.addItem(trackItem);
				}
				else {
					insertionIndex = this.playlist.readHead;
					this.playlist.playlist.splice(insertionIndex, 0, trackItem);
				}
			}
			catch (error) {
				console.error(error);
			}
		}

		else if (ytpl.validateID(url)) {
			try {
				const playlistDetails = await ytpl(url, { pages: 10 });
				const arr = [];

				playlistDetails.items.forEach((video) => {
					arr.push({
						title: video.title,
						duration: video.durationSec,
						video_url: video.shortUrl,
						author_name: video.author.name,
						author_channel: video.author.url,
						thumbnail: video?.bestThumbnail?.url,
					});
				});

				if (arr.length > 0) {
					if (bAppend) {
						insertionIndex = this.playlist.playlist.length;
						this.playlist.addItems(arr);
					}
					else {
						insertionIndex = this.playlist.readHead;
						this.playlist.playlist.splice(insertionIndex, 0, ...arr);
					}
				}
			}
			catch (error) {
				console.error(error);
			}
		}
		return insertionIndex;
	}

	removeTrack(id) {
		if (id < 1 || id > this.playlist.playlist.length) return false;

		this.playlist.removeItem(id - 1);
		return true;
	}

	async play(video) {
		this.stop();
		const embed = this.createEmbed(video);
		this.deleteMesssage();
		this.lastSentMessage = await this.textChannel.send({
			embeds: [embed],
		});
		this.isStopped = false;
		this.player.play(this.createStream(video.video_url));
	}

	deleteMesssage() {
		if (this.lastSentMessage !== null) {
			this.lastSentMessage.delete();
			this.lastSentMessage = null;
		}
	}

	playTrack(idx = null) {
		const video = this.playlist.selectTrack(idx);
		if (video == null) return false;
		this.play(video);
		return true;
	}

	playNext() {
		if (this.isEmpty()) return false;
		let video = this.playlist.selectNext(this.doLoop);
		if (video == null) {
			if ((!this.isPlaying() && this.isStopped) || this.isPlaying()) {
				video = this.playlist.selectNext(true);
				this.isStopped = false;
			}
			else {
				this.isStopped = true;
				return false;
			}
		}
		this.play(video);
		return true;
	}

	isPlaying() {
		return this.player.state.status == AudioPlayerStatus.Playing;
	}

	isPaused() {
		return this.player.state.status == AudioPlayerStatus.Paused;
	}

	togglePause() {
		if (this.player.state.status === AudioPlayerStatus.Idle) return;
		if (this.isPaused()) this.player.unpause();
		else this.player.pause();
	}

	stop() {
		this.player.stop();
		this.isStopped = true;
		if (this.stream !== null) {
			this.stream.destroy();
			this.stream = null;
		}
	}

	joinVC(chId, gId, adap) {
		let conn = getVoiceConnection(gId);
		if (conn) {
			conn.destroy();
		}
		conn = joinVoiceChannel({
			channelId: chId,
			guildId: gId,
			adapterCreator: adap,
		});

		this.guildId = gId;

		conn.on('stateChange', (oldState, newState) => {
			if (newState.status == 'destroyed') {
				this.stop();
			}

			if (oldState.status === VoiceConnectionStatus.Ready && newState.status === VoiceConnectionStatus.Connecting) {
				conn.configureNetworking();
			}

			const oldNetworking = Reflect.get(oldState, 'networking');
			const newNetworking = Reflect.get(newState, 'networking');

			const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
				const newUdp = Reflect.get(newNetworkState, 'udp');
				clearInterval(newUdp?.keepAliveInterval);
			};
			oldNetworking?.off('stateChange', networkStateChangeHandler);
			newNetworking?.on('stateChange', networkStateChangeHandler);
		});
		conn.subscribe(this.player);
		this.voiceChannelIdleTimer = setTimeout(() => this.destroy(), 5 * 60 * 1000);
	}

	createStream(url) {
		this.stream = ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25, liveBuffer: 4900 });
		return createAudioResource(this.stream, { inputType: StreamType.Arbitrary });
	}

	destroy() {
		const conn = getVoiceConnection(this.guildId);
		if (conn) {
			conn.destroy();
		}
	}

	clearPlaylist() {
		this.playlist.clear();
	}

	isEmpty() {
		return this.playlist.isEmpty();
	}

	createEmbed(video) {
		const timeString = toTimeString(video.duration);
		const embed = new EmbedBuilder()
			.setTitle(video.title)
			.setAuthor({
				name: video.author_name,
				url: video.author_url,
			})
			.setURL(video.video_url)
			.setThumbnail(video.thumbnail)
			.setTimestamp()
			.addFields(
				{ name: 'Duration', value: timeString, inline: true },
			);
		return embed;
	}

	showUpcoming() {
		const readHead = this.playlist.readHead;
		const startPos = (readHead - 5 < 0) ? 0 : readHead - 5;
		const truncatedTrackList = this.playlist.playlist.slice(startPos, readHead + 5);
		const maxTitleLength = 35;
		const currentTrackTitle = this.playlist.playlist[readHead].title;

		const str = truncatedTrackList.reduce((prev, curr, idx) => {
			const title = (curr.title.length < maxTitleLength) ? curr.title : curr.title.slice(0, maxTitleLength - 3) + '...';
			const durr = toTimeString(parseInt(curr.duration));
			const line = `${startPos + idx}. [${title}](${durr})`;
			if (curr.title == currentTrackTitle) return prev + `**${line}**\n`;
			return prev + line + '\n';
		}, '```md\n');

		if (this.playlist.playlist.length > readHead + 5) {
			return str + `...${this.playlist.playlist.length - (readHead + 5)} more` + '```';
		}
		else {
			return str.trim() + '```';
		}
	}

	shuffle() {
		const arr = this.playlist.playlist.slice(0);
		for (let i = 0; i < arr.length; i++) {
			const r = Math.floor(Math.random() * arr.length);
			const x = arr[r];
			arr[r] = arr[i];
			arr[i] = x;
		}
		this.playlist.playlist = arr;
	}

	startLonelyTimer() {
		if (this.lonelyTimer) return;
		this.lonelyTimer = setTimeout(() => this.destroy(), 5 * 60 * 1000);
	}

	stopLonelyTimer() {
		clearTimeout(this.lonelyTimer);
		this.lonelyTimer = null;
	}
}

module.exports = MusicPlayer;