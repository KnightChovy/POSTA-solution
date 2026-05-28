let queue;

(async () => {
  const { default: PQueue } = await import('p-queue');

  queue = new PQueue({
    concurrency: 20,         
    interval: 60000,          
    intervalCap: 100,       
    carryoverConcurrencyCount: true,
    timeout: 30000,          
    throwOnTimeout: false,    
  });
})();

module.exports = () => {
  if (!queue) {
    throw new Error('Queue is not initialized yet. Please wait for initialization.');
  }
  return queue;
};