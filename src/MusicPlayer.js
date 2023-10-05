const ytdl = require('ytdl-core');
const PlaylistManager = require('./PlaylistManager');
const ytpl = require('ytpl');
const logger = require('./lib/Logger');
const { EventEmitter } = require('node:events');

const {
	AudioPlayerStatus,
	StreamType,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
	getVoiceConnection,
	VoiceConnectionStatus,
} = require('@discordjs/voice');

class MusicPlayer extends EventEmitter {
	constructor() {
		super();
		this.player = createAudioPlayer();
		this.voiceChannelIdleTimer = null;
		this.musicPlayerIdleTimer = null;
		this.lonelyTimer = null;
		this.stream = null;
		this.playlist = new PlaylistManager();
		// manual stop
		this.isStopped = true;
		this.loop = false;
		this.guildId = null;

		const setTimer = () => {
			this.voiceChannelIdleTimer = setTimeout(() => {
				logger.info('Disconnecting due to inactivity');
				this.destroy.bind(this);
			}, 5 * 60 * 1000);
			this.musicPlayerIdleTimer = setTimeout(() => {
				logger.info('Clearing playlist due to prolonged inactivity');
				this.clearPlaylist.bind(this);
			}, 2 * 60 * 60 * 1000);
		};
		this.player.on(AudioPlayerStatus.Idle, () => {
			setTimer();
			if (this.isStopped) return;
			this.autoPlayNext();
		});
		this.player.on(AudioPlayerStatus.Paused, setTimer);
		this.player.on(AudioPlayerStatus.Playing, () => {
			if (this.timer !== null) clearTimeout(this.voiceChannelIdleTimer);
			if (this.musicPlayerIdleTimer !== null) clearTimeout(this.musicPlayerIdleTimer);
		});
		this.player.on('error', error => {
			logger.error(error.message);
		});
	}

	async add(url, bAppend = true) {
		let insertionIndex = -1;
		const videos = [];

		if (ytpl.validateID(url)) {
			const playlistDetails = await ytpl(url, { pages: 10 });

			playlistDetails.items.forEach((video) => {
				if (video?.isLive) return;
				videos.push({
					title: video.title,
					duration: video.durationSec,
					video_url: video.shortUrl,
					author_name: video.author.name,
					author_channel: video.author.url,
					thumbnail: video?.bestThumbnail?.url,
				});
			});
		}
		else if (ytdl.validateURL(url)) {
			const videoDetails = (await ytdl.getBasicInfo(url)).videoDetails;

			if (videoDetails.isLiveContent) throw new Error('Live broadcasts are forbidden');
			videos.push({
				title: videoDetails.title,
				duration: parseInt(videoDetails.lengthSeconds),
				video_url: videoDetails.video_url,
				author_name: videoDetails.author.name,
				author_channel: videoDetails.author.channel_url,
				thumbnail: videoDetails.author.thumbnails[0].url,
			});
		}

		if (videos.length > 0) {
			if (bAppend) {
				insertionIndex = this.playlist.size();
				this.playlist.addItems(videos);
			}
			else {
				insertionIndex = this.playlist.insertItems(videos);
			}
		}
		return insertionIndex;
	}

	removeTrack(id) {
		if (id < 1 || id > this.playlist.size()) return false;

		this.playlist.removeItem(id - 1);
		return true;
	}

	play(video) {
		this.stop();
		this.isStopped = false;
		this.player.play(this.createStream(video.video_url));
		this.emit('playing', video);
	}

	stop() {
		this.isStopped = true;
		this.player.stop();
		if (this.stream !== null) {
			this.stream.destroy();
			this.stream = null;
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
		const video = this.playlist.selectNext();
		// if end of playlist reached
		if (video === null) {
			return this.playTrack(0);
		}
		this.play(video);
		return true;
	}

	playPrev() {
		const video = this.playlist.selectPrev();
		if (video === null) return false;
		this.play(video);
		return true;
	}

	autoPlayNext() {
		if (this.isEmpty()) return false;
		const video = this.playlist.selectNext();
		// if end of playlist reached
		if (video === null) {
			if (this.loop) {
				return this.playTrack(0);
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

	pause() {
		if (!this.isPaused()) this.player.pause();
	}

	unpause() {
		if (this.isPaused()) this.player.unpause();
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
		conn.on('error', error => {
			logger.error(error.message);
		});
		conn.subscribe(this.player);
		this.voiceChannelIdleTimer = setTimeout(() => this.destroy(), 5 * 60 * 1000);
	}

	createStream(url) {
		this.stream = ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25, liveBuffer: 4900 });
		this.stream.on('error', error => {
			logger.error(`Failed to download audio from url ${url}`);
			logger.error(error.message);
		});
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

	showUpcoming(fromPos) {
		return this.playlist.showUpcoming(fromPos);
	}

	shuffle() {
		this.playlist.shuffle();
	}

	startLonelyTimer() {
		if (this.lonelyTimer) return;
		this.lonelyTimer = setTimeout(() => {
			this.destroy();
			logger.info('Disconnected due to empty voice channel');
		}, 5 * 60 * 1000);
	}

	stopLonelyTimer() {
		clearTimeout(this.lonelyTimer);
		this.lonelyTimer = null;
	}
}

module.exports = MusicPlayer;