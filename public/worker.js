self.onmessage = function (e) {
  const { messageId, content, batchSize, speed } = e.data;
  let index = 0;

  const interval = setInterval(() => {
    if (index < content.length) {
      const nextIndex = Math.min(index + batchSize, content.length);
      const partial = content.substring(0, nextIndex);
      index = nextIndex;
      self.postMessage({ type: 'progress', messageId, content: partial });
    } else {
      clearInterval(interval);
      self.postMessage({ type: 'done', messageId });
    }
  }, speed);
};
