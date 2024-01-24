class Queue {
	constructor() {
		this.musicQueue = [];
	}

	addSong(stream) {
		this.musicQueue.push(stream);
	}

	removeSong(pos) {
		// Splice Fx: index, quantity
		return this.musicQueue.splice(pos, pos);
	}

	rmFinSong() {
		// Remove from the first of queue
		this.musicQueue.shift();
	}

	getNextSong() {
		return this.musicQueue[0];
	}

	size() {
		return this.musicQueue.length;
	}

	isEmpty() {
		return this.size() === 0;
	}

	list() {
		let array = [];
		let counter = 1;
		for (let listing of this.musicQueue) {
			array.push({
				id: counter,
				title: listing.video.title,
				desc: listing.video.description,
				videoURL: listing.video.url,
				duration: listing.video.durationFormatted,
				uploaded: listing.video.uploadedAt,
				views: listing.video.views,
				thumbnailURL: listing.video.thumbnail.url,
				channelName: listing.video.channel.name,
				channelURL: listing.video.channel.url,
				senderName: listing.sender.username
			});
			counter++;
		}
		return array;
	}
}

module.exports = Queue