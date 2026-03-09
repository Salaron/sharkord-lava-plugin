import type { Track } from '../lava/lava-rest-client';

class TrackQueue {
  private queue: Track[] = [];

  public enqueue(item: Track[] | Track) {
    if (Array.isArray(item)) {
      this.queue.push(...item);
    } else {
      this.queue.push(item);
    }
  }

  public peak() {
    return this.queue.at(0);
  }

  public dequeue(): Track | undefined {
    return this.queue.shift();
  }

  public clear() {
    this.queue = [];
  }

  public items() {
    return this.queue;
  }
}

export { TrackQueue };
