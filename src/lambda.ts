import fetch from 'node-fetch-commonjs'

export const handler = async (event: any) => {
  return new Promise(async (resolve, reject) => {
    let params = event.queryStringParameters;
    let { Host, host, Origin, origin, ...headers } = event.headers;

    console.log(event);
    console.log(`Got request with params:`, params);

    if (['options', 'OPTIONS'].includes(event.httpMethod)) {
      resolve({
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, authorization, allow-origin',
          'Access-Control-Allow-Origin': origin || Origin, // Required for CORS support to work
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        },
      })
      return
    }

    if (!params.url) {
      const errorResponse = {
        statusCode: 400,
        body: "Unable get url from 'url' query parameter",
      };
      reject(Error(errorResponse as any));
      return;
    }

    const requestParams = Object.entries(params)
      .reduce((acc, param) => {
        // @ts-ignore
        if (param[0] !== 'url') acc.push(param.join('='));
        return acc;
      }, [])
      .join('&');

    const url = `${params.url}${requestParams}`;
    const hasBody = /(POST|PUT)/i.test(event.httpMethod);
    try {
      const res = await fetch(url, {
        method: event.httpMethod,
        // @ts-ignore
        timeout: 20000,
        body: hasBody ? event.body : null,
        headers,
      });
      console.log(`Got response from ${url} ---> {statusCode: ${res.status}}`);

      let proxyResponse = {
        statusCode: res.status,
        headers: {
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, authorization, allow-origin',
          'Access-Control-Allow-Origin': origin || Origin, // Required for CORS support to work
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
          'content-type': res.headers.get('content-type'),
        },
      };

      const body = await res.text();
      // @ts-ignore
      proxyResponse.body = body;
      resolve(proxyResponse);
    } catch (err) {
      console.error(`Caught error: `, err);

      reject(err);
      return;
    }
  });
};
