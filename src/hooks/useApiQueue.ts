import { useState, useEffect } from 'react';

type QueueTask = {
  id: string;
  url: string;
  options: RequestInit;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  retries: number;
};

class ApiQueueManager {
  private queue: QueueTask[] = [];
  private isProcessing = false;
  private currentStatus = '';
  private totalTasks = 0;
  private completedTasks = 0;
  
  private listeners: Set<(state: QueueState) => void> = new Set();

  public subscribe(listener: (state: QueueState) => void) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  private getState(): QueueState {
    return {
      isProcessing: this.isProcessing,
      statusMessage: this.currentStatus,
      queueLength: this.queue.length,
      totalTasks: this.totalTasks,
      completedTasks: this.completedTasks
    };
  }

  public enqueue(url: string, options: RequestInit): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id: Math.random().toString(),
        url,
        options,
        resolve,
        reject,
        retries: 0
      });
      if (this.totalTasks === 0 && !this.isProcessing) {
         this.totalTasks = 1;
      } else {
         this.totalTasks++;
      }
      
      if (!this.isProcessing) {
        this.processQueue();
      } else {
        this.currentStatus = `Queued... [${this.completedTasks}/${this.totalTasks}]`;
        this.notify();
      }
    });
  }

  private async processQueue() {
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const task = this.queue[0];
      this.currentStatus = `Synthesizing data... [Module ${this.completedTasks + 1} of ${this.totalTasks}]`;
      this.notify();
      
      try {
        const response = await fetch(task.url, task.options);
        
        if (response.status === 429) {
          if (task.retries >= 3) {
            // Out of retries, reject the task.
            this.queue.shift();
            this.completedTasks++;
            task.reject(new Error("Max retries exceeded for rate limit."));
            continue;
          }
          
          task.retries++;
          let delayStr = response.headers.get("Retry-After");
          let delayMs = 35000;
          if (delayStr) {
             const parsed = parseInt(delayStr, 10);
             if (!isNaN(parsed)) delayMs = parsed * 1000;
             else if (new Date(delayStr).getTime()) delayMs = new Date(delayStr).getTime() - Date.now();
          }
          
          let seconds = Math.ceil(delayMs / 1000);
          for (let i = seconds; i > 0; i--) {
             this.currentStatus = `Rate limit hit. Cooling down for ${i}s... [Retry ${task.retries}/3]`;
             this.notify();
             await new Promise(res => setTimeout(res, 1000));
          }
          continue; // retry
        }
        
        this.queue.shift();
        this.completedTasks++;
        task.resolve(response);
        
        if (this.queue.length > 0) {
            this.currentStatus = `API Throttle. Next in 2s...`;
            this.notify();
            await new Promise(res => setTimeout(res, 2000));
        }

      } catch (err: any) {
        this.queue.shift();
        this.completedTasks++;
        task.reject(err);
      }
    }
    
    this.isProcessing = false;
    this.currentStatus = '';
    this.totalTasks = 0;
    this.completedTasks = 0;
    this.notify();
  }
}

export const apiQueueManager = new ApiQueueManager();

export interface QueueState {
  isProcessing: boolean;
  statusMessage: string;
  queueLength: number;
  totalTasks: number;
  completedTasks: number;
}

export function useApiQueue() {
  const [queueState, setQueueState] = useState<QueueState>({
    isProcessing: false,
    statusMessage: '',
    queueLength: 0,
    totalTasks: 0,
    completedTasks: 0
  });

  useEffect(() => {
    const unsubscribe = apiQueueManager.subscribe(setQueueState);
    return () => {
      unsubscribe();
    };
  }, []);

  const fetchQueued = (url: string, options: RequestInit) => {
    return apiQueueManager.enqueue(url, options);
  };

  return {
    ...queueState,
    fetchQueued
  };
}
