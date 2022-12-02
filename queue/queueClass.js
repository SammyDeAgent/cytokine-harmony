class Queue {
    constructor() {
        this.musicQueue = [];
    }

    addSong(stream) {
        this.musicQueue.push(stream);
    }

    size() {
        return this.musicQueue.length;
    }

    isEmpty() {
        return this.size() === 0;
    }
}

module.exports = Queue