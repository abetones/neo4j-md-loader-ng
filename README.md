# neo4j-md-loader

Simple crufty parser for issues list in markdown; nodejs typescript express api

## Pre-requisites

nodejs and yarn

## How to run

## Install deps

```
yarn install
```

### Replace hard-coded cruft

Put the markdown file containing issues in top level folder.
Put the releases.json file in the top level folder.

**.env**
- create a .env file with contents like:

```
dbName="neo4j"
dbUser="neo4j"
dbPass="my_secret_password"
dbUri="neo4j://localhost"
appPort="4444"
issuesFilePath="../issues.mdx"
releasesFilePath="../releases.json"
```

### Start in dev mode

```
yarn start:dev
```

### Run the parser

```
curl localhost:4444/parseIssues
```

This will parse the issues file and load the issues into the specified Neo4j database.

## Todo

- [ ] Proper organization of code and add model classes/interfaces
