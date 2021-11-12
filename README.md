# 👷 `CloudFlare Worker` MeGit

Auto update issue status on repository project description via Cloudflare worker.

[`index.js`](https://github.com/mecuong/cloudflare-worker-megit/blob/master/index.js) is the content of the Workers script.

#### Register an account or login to <https://dash.cloudflare.com/login>

#### Install wrangler cli
```
npm install -g wrangler
```

#### Login to Cloudflare by wrangler
```
wrangler login
```

#### Clone source code and run `npm install`
```
git clone https://github.com/mecuong/cloudflare-worker-megit.git

cd cloudflare-worker-megit

npm install
```

#### Setting some variable in file wrangler.toml
- GITHUB_TOKEN from <https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token>
- GITHUB_USER user of repository
- GITHUB_REPO repository name
- AUTO_SIGN your sign in repository's project name

#### Run as dev on local
```
wrangler dev
```
**or**
```
npm run dev 8080
```

#### Deploy
```
wrangler publish
```
**or**
```
npm run deploy
```
