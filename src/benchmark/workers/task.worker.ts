interface TaskMessage {
  duration: number;
  id: number;
}

interface TaskResult {
  id: number;
  result: number;
  duration: number;
}

// Worker thread handler
self.onmessage = (event: MessageEvent<TaskMessage>) => {
  const { duration, id } = event.data;
  const start = Date.now();

  // Simulate CPU work
  let result = 0;
  while (Date.now() - start < duration) {
    result += Math.random() * Math.random();
  }

  const taskResult: TaskResult = {
    id,
    result,
    duration: Date.now() - start,
  };

  self.postMessage(taskResult);
};
