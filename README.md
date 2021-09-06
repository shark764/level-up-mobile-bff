# Level Up - Mobile BFF

Server made with Javascript technologies
Main access for LevelUp Mobile Applications

# To get Started
 1. Please ask someone the `.env`.
 2. Download the project.
 3. CD into the root project and run: `npm install`
 4. Run `npm run dev`.

 ## Installation

This project requires [Node.js](https://nodejs.org/) v14+ to run.

Using .nvmrc file helps to normalize node version used by all maintainers.
If you are required to use version specified in this file, run these commands.

```bash
nvm use
nvm install
```

Use the package manager [npm](https://www.npmjs.com/get-npm) v6+ to install dependencies and devDependencies.

```bash
npm install
```

# SetUp

- Initialize Docker Compose:
`docker-compose up`

- For Redis CLI:
`docker run -it --network mobilebff_default --rm redis redis-cli -h redislul`

## Usage

# Port
Change defualt port (3000) to other port if needed. Open `.env` file and add
```js
PORT=3001
```

If you are using a local [MongoDB](https://docs.mongodb.com/manual/installation/) database, start the **mongod** service

```bash
sudo service mongod start
```

**Run server**

```bash
npm run dev
```

# Updating schema models
```sh
git submodule init
npm run updateModels
```

## Utilities

Format code using [Prettier](https://prettier.io/) and [Eslint](https://eslint.org/)

```bash
npm run prettify
```

## Tech Stack
- [NodeJs](https://nodejs.org/es/)
- [ExpressJs](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/topics/quickstart)

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

# Notes on developing:
    - Linters and Format are added to this project so please everytime you submit a PR, run the command: `npm run prettify`, and fix any errors that pops up.

**Commits**
Commits must follow [conventional commit format](https://conventionalcommits.org/)
Make sure your messages look like the following examples
```
feat: Adding new endpoint
fix: Rolling back endpoint
```

## License
[ISC](https://opensource.org/licenses/ISC)