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
		this.connection = null;
		this.voiceChannelIdleTimer = null;
		this.musicPlayerIdleTimer = null;
		this.stream = null;
		this.playlist = new PlaylistManager();
		this.isStopped = true;
		this.textChannel = null;
		this.lastSentMessage = null;

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

	async add(url) {
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

				insertionIndex = this.playlist.playlist.length;
				this.playlist.addItem(trackItem);
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
				if (arr.length > 0) insertionIndex = this.playlist.playlist.length;
				this.playlist.addItems(arr);
			}
			catch (error) {
				console.error(error);
			}
		}
		return insertionIndex;
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
		const video = this.playlist.selectNext();
		if (video == null) {
			if (!this.isPlaying()) {
				if (this.isStopped) {
					this.playlist.readHead = -1;
					this.isStopped = false;
					this.playNext();
					return true;
				}
				else {
					this.isStopped = true;
				}
			}
			return false;
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
		if (this.player.state.status === AudioPlayerStatus.Paused) this.player.unpause();
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
		if (this.connection !== null) return console.log('Voice connection already exists\n-----');
		this.voiceChannelIdleTimer = setTimeout(() => this.destroy(), 5 * 60 * 1000);
		this.connection = joinVoiceChannel({
			channelId: chId,
			guildId: gId,
			adapterCreator: adap,
		});

		this.connection.on('stateChange', (oldState, newState) => {
			if (newState.status == 'destroyed') {
				if (this.connection === null) return;
				this.stop();
				this.connection = null;
			}
		});
		this.connection.subscribe(this.player);
	}

	createStream(url) {
		this.stream = ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25, liveBuffer: 4900 });
		return createAudioResource(this.stream, { inputType: StreamType.Arbitrary });
	}

	destroy() {
		this.stop();
		if (this.connection !== null) {
			this.connection.destroy();
			this.connection = null;
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
		const index = this.playlist.readHead;
		const truncatedTrackList = this.playlist.playlist.slice(index, index + 5);
		const maxTitleLength = 35;

		const str = truncatedTrackList.reduce((prev, curr, idx) => {
			const title = (curr.title.length < maxTitleLength) ? curr.title : curr.title.slice(0, maxTitleLength - 3) + '...';
			const durr = toTimeString(parseInt(curr.duration));
			const line = `${index + idx}. [${title}](${durr})`;
			if (idx == 0) return prev + `**${line}**\n`;
			return prev + line + '\n';
		}, '```md\n');

		if (this.playlist.playlist.length > index + 5) {
			return str + `...${this.playlist.playlist.length - (index + 5)} more` + '```';
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
}

module.exports = MusicPlayer;