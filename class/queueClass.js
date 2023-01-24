class Queue {
    constructor() {
        this.musicQueue = [];
    }

    addSong(stream) {
        this.musicQueue.push(stream);
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
        let builder = '';
        let counter = 1;
        for(let listing of this.musicQueue) {
            builder += `${counter}. ${listing.video.title}`;
            if(counter == 1) builder += ` <PLAYING>`;
            builder += `\n`;
            counter++;
        }
        return "```md\n" + builder + "```";
    }
}

module.exports = Queue