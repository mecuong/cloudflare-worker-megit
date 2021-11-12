addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event))
})

/**
 * Respond with hello worker text
 * @param {Request} request
 */
 async function handleRequest(request, event) {
  await updateProject();
  return new Response('OK', {
    headers: { 'content-type': 'text/plain' }
  })
}

addEventListener("scheduled", event => {
  event.waitUntil(updateProject())
})

async function updateProject() {
  const project = await getLastAutoProject();
  const body = await createProjectBody(project);

  await gitFetcher('/projects/' + project.id, {
    method: 'PATCH',
    body: {
      project_id: project.id,
      body,
    }
  });
}

async function getLastAutoProject()
{
  const data = await gitFetcher(`/repos/${ GITHUB_USER }/${ GITHUB_REPO }/projects`, {
    body: {
      per_page: 100
    }
  });

  const autoOpenProjects = data.filter(project => project.name.endsWith(AUTO_SIGN) && project.state === 'open');

  // Return last auto project id
  return autoOpenProjects.pop();
}

async function createProjectBody(project) {
  const projectColumns = await getProjectColumns(project.id);

  const cards = await Promise.all(projectColumns.map(projectColumn => {
    return gitFetcher(projectColumn.cards_url);
  })).then(projectCards => {
    return projectCards.flat();
  });

  const issues = cards.filter(card =>  card.content_url && card.content_url.includes('/issues/'))
  .map(card => {
    const status = projectColumns.find(projectColumn => projectColumn.url === card.column_url).name;
    const name = `#${card.content_url.split('/').pop()}`;
      return {
        name,
        status,
      };
  });

  let body = project.body;

  project.body.split('\n').forEach(line => {
    issues.forEach(issue => {
      if (line.includes(`[${issue.name}]`)) {
        let newLine = line.replace(/\|[^\|]*\|[^|]*$/, `| ${issue.status} |\n`);
        body = body.replace(line, newLine);
      }
    });
  });

  return body;
}

async function getProjectColumns(project_id) {
  return await gitFetcher(`/projects/${project_id}/columns`, {
    body: {
      project_id,
    }
  });
}

async function gitFetcher(url, options = {}) {
  const baseUrl = 'https://api.github.com';

  if (url.startsWith('/')) {
    url = new URL(url, baseUrl);
  } else {
    url = new URL(url);
  }

  options.headers = {
    'User-Agent': 'me-git',
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': 'Bearer ' + GITHUB_TOKEN
  }

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