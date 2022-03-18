addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event))
})

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request, event) {
  const res = await postMessage(request);

  return new Response(JSON.stringify(res), {
    headers: { 'content-type': 'application/json' }
  })
}

async function postMessage(request) {
  const body = await request.json();

  if (!body.text || !body.email) {
    return {
      text: 'Missing text or email',
      response_type: 'ephemeral'
    }
  }

  const user = await MEMBERS.get(body.email);
  if (!user) {
    await getUsers(request);
  }

  const userObj = JSON.parse(user);

  // slack post message
  const res = await gitFetcher('/api/chat.postMessage', {
    body: {
      channel: userObj.id,
      text: body.text,
      as_user: true
    },
    method: 'POST',
    headers: {
      'Authorization': request.headers.get('Authorization')
    }
  });

  if (!res.ok) {
    return {
      text: res.error,
      response_type: 'ephemeral'
    }
  }

  return {
    text: 'Message sent',
    response_type: 'ephemeral'
  }
}

async function getUsers(request) {
  const users = await gitFetcher('/api/users.list', {
    headers: {
      'Authorization': request.headers.get('Authorization')
    }
  })
  for (const user of users.members) {
    // Set to KV namesapce MEMBERS
    await MEMBERS.put(user.profile.email || user.name, JSON.stringify(user));
  }
}

async function gitFetcher(url, options = {}) {
  const baseUrl = 'https://slack.com';

  if (url.startsWith('/')) {
    url = new URL(url, baseUrl);
  } else {
    url = new URL(url);
  }

  options.headers = Object.assign(options.headers, {
    'User-Agent': 'me-slack',
    'Content-Type': 'application/json; charset=utf-8',
  });

  options.method = options.method || 'GET';

  if (['GET', 'HEAD'].includes(options.method)) {
    url.search = new URLSearchParams(options.body);
    delete options.body;
  } else {
    options.body = JSON.stringify(options.body);
  }

  return await fetch(url, options)
  .then(response => response.json());
}