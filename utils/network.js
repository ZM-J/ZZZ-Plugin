import http from 'http';
import https from 'https';
import fetch from 'node-fetch';
export async function checkLatency(url) {
  let request = http;
  if (url.startsWith('https')) {
    request = https;
  }
  return new Promise(resolve => {
    const start = Date.now();
    request
      .get(url, res => {
        res.on('data', () => {});
        res.on('end', () => {
          const latency = Date.now() - start;
          resolve({ url, latency });
        });
      })
      .on('error', err => {
        logger.debug(`下载节点 ${url} 连接失败:`, err.message);
        resolve({ url, latency: Infinity });
      });
  });
}

export async function findLowestLatencyUrl(urls) {
  const results = await Promise.all(urls.map(checkLatency));
  const lowestLatencyResult = results.reduce((prev, curr) =>
    prev.latency < curr.latency ? prev : curr
  );
  return lowestLatencyResult.url;
}

export function getQueryVariable(url, variable) {
  try {
    const _url = new URL(url);
    var query = _url.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (pair[0] == variable) {
        return pair[1];
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function fetchWithRetry(url, options, retry = 3) {
  let err;
  const _fetch = async (url, options, retryCount = 0) => {
    if (retryCount > retry) {
      throw new Error('Retry limit reached', err);
    }
    try {
      return await fetch(url, options);
    } catch (error) {
      logger.debug(`Fetch error: ${error.message}`);
      err = error;
      return _fetch(url, options, retryCount + 1);
    }
  };
  return _fetch(url, options);
}
