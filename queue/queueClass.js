class Queue {
    constructor() {
        this.musicQueue = [];
    }

    addSong(stream) {
        this.musicQueue.push(stream);
        console.log(`Added new song; Current size: ${this.size()}`);
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
}

module.exports = Queue