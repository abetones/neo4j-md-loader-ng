import { Router } from 'express';
import driver from './issuesDb';
import parser from './parser';
import releaseParser from './releaseParser';
import * as fs from 'fs';
require("dotenv").config();

const routes = Router();

routes.get('/', (req, res) => {
  return res.json({ message: 'Hello, Whirled' });
});

routes.get('/parseIssues', async (req, res) => {

  try {
    // load the issues into memory
    const md = fs.readFileSync(process.env.issuesFilePath,'utf8'); //'issues.mdx'
    const issues = parser(md);
    // clean db before loading issues -- for testing, do not leave in long-term
    driver.executeQuery(
      'MATCH (n) DETACH DELETE n',
      {},
      {database: process.env.dbName}
    )
    .then((result) => { })//return result.records.map( (r) => r.get('Issue') ) })
    .catch( (error) => { return error}) //console.error(error) })

    // create constraints -- should probably move elsewhere in the program logic
    // usually do this when you start up a program
    // and check that the constraint is online

    driver.executeQuery(
      'create constraint if not exists for (n:Version) require (n.version) is node key',
      {},
      {database: process.env.dbName}
    )
    .then((result) => { })//return result.records.map( (r) => r.get('Issue') ) })
    .catch( (error) => { return error}) //console.error(error) })

    driver.executeQuery(
      'create constraint if not exists for (n:Issue) require (n.jiraPrimary) is node key',
      {},
      {database: process.env.dbName}
    )
    .then((result) => { })//return result.records.map( (r) => r.get('Issue') ) })
    .catch( (error) => { return error}) //console.error(error) })

    // load the releases into memory and get their relationships to one another
    const releasesString = fs.readFileSync(process.env.releasesFilePath,'utf8'); //'releases.json'
    const releases = releaseParser(releasesString, issues);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // clear out the db
    driver.executeQuery(
      'MATCH (n) DETACH DELETE n',
      {},
      {database: process.env.dbName} //'neo4j'
    )
    .then((result) => { })//return result.records.map( (r) => r.get('Issue') ) })
    .catch( (error) => { return error}) //console.error(error) })
      await sleep(100);


      driver.executeQuery(
      'create constraint if not exists for (n:Release) require (n.version) is node key',
      {},
      {database: process.env.dbName} //neo4j
    )
    .then((result) => { })//return result.records.map( (r) => r.get('Issue') ) })
    .catch( (error) => { return error}) //console.error(error) })

    releases.forEach(async function(release){    
      driver.executeQuery(
        `MERGE (release:Release{version: $version})
         SET release.type= $type, 
         release.version= $version, 
         release.versions= [$version], 
         release.versionMajor= $versionMajor, 
         release.versionMinor= $versionMinor, 
         release.versionBuild= $versionBuild `,
        release,
        {database: process.env.dbName} //'neo4j'
      )
      .then((result) => { })//return result.records.map( (r) => r.get('Issue') ) })
      .catch( (error) => { console.log("create node error " + error)}); //console.error(error) })                      
      await sleep(100);

    });

    console.log("done creating nodes, creating relationships");
    releases.forEach(async function(release){    
      // create relationship to the parent if exists
      // create relationsip to the next if exists
      //@todo check the relationship direction 
        driver.executeQuery(
            `MATCH (a:Release), (b:Release) 
            WHERE a.version = $version AND b.version = $parentVersion 
            CREATE (a)-[r:PARENT]->(b) 
            RETURN type(r)`,
            release,
            {database: process.env.dbName} //'neo4j'
          )
          .then((result) => {  })//return result.records.map( (r) => r.get('Issue') ) })
          .catch( (error) => { console.log("create parent rel error " + error)}); //console.error(error) })    
          await sleep(100);

          driver.executeQuery(
            `MATCH
            (a:Release),
            (b:Release)
            WHERE a.version = $version AND b.version = $nextVersion
            CREATE (a)-[r:Next]->(b)
            RETURN type(r)`,
            release,
            {database: process.env.dbName} //'neo4j'
          )
          .then((result) => {  })//return result.records.map( (r) => r.get('Issue') ) })
          .catch( (error) => { console.log("create next rel error " + error)}); //console.error(error) })    
          await sleep(100);

    });

//    return res.json(releases);

    driver.executeQuery(
      'create constraint if not exists for (n:Issue) require (n.jiraPrimary) is node key',
      {},
      {database: process.env.dbName} //'neo4j'
    )
    .then((result) => { })//return result.records.map( (r) => r.get('Issue') ) })
    .catch( (error) => { return error}) //console.error(error) })

    console.log("creating issues");
    issues.forEach(async function(issue) {
      console.log(issue.jiraPrimary);
      driver.executeQuery(
        `MERGE (issue:Issue{jiraPrimary: $jiraPrimary}) 
          SET issue.issueTitle = $issueTitle, 
              issue.problem = $problem, 
              issue.precondition = trim($precondition), 
              issue.workaround = trim($workaround), 
              issue.fix = $fix, 
              issue.jiraPrimaryDateString = $jiraPrimaryDateString,  
              issue.affectedVersionOldest = $affectedVersionOldest,
              issue.affectedVersionNewest = $affectedVersionNewest,
              issue.jiras = $jiras`,
        issue,
        {database: process.env.dbName} //'neo4j'
      )
      .then((result) => { })//return result.records.map( (r) => r.get('Issue') ) })
      .catch( (error) => { return error}); //console.error(error) })
      await sleep(100);

      driver.executeQuery(
        `MATCH
        (i:Issue),
        (b:Release)
        WHERE i.jiraPrimary = $jiraPrimary AND b.version = $affectedVersionOldest
        CREATE (i)-[r:FIRST_SEEN_IN]->(b)
        RETURN type(r)`,
        issue,
        {database: process.env.dbName} //'neo4j'
      )
      .then((result) => {  })//return result.records.map( (r) => r.get('Issue') ) })
      .catch( (error) => { console.log("create first_seen_in rel error " + error)}); //console.error(error) })    
      await sleep(100);

      driver.executeQuery(
        `MATCH
        (i:Issue),
        (b:Release)
        WHERE i.jiraPrimary = $jiraPrimary AND b.version = $affectedVersionNewest
        CREATE (i)-[r:LAST_SEEN_IN]->(b)
        RETURN type(r)`,
        issue,
        {database: process.env.dbName} //'neo4j'
      )
      .then((result) => {  })//return result.records.map( (r) => r.get('Issue') ) })
      .catch( (error) => { console.log("create first_seen_in rel error " + error)}); //console.error(error) })    

        });
      await sleep(100);

    return res.json(issues);
  } catch(ex) {
    console.log(ex);
    return res.json(ex.message);
  }

  // route for releases
  //
  // Håkan's principle:
  //
  // say you add an issue, that'll produce a release node
  // then we can check whether that release node is properly connected
  // into the release tree - 
  // in other words, are the release nodes there that the issue
  // has relationships with?
  //
  // this limits the scope of impact when we add an issue
  // won't need to scan the entire release tree
  // so performance is constant when you add issues
  //
  // Abe's notes:
  //
  // a Release node is what we had previously called a Version node
  // its properties are type (Feature or Maintenance) and version (e.g., 3.2.1)
  // Maintenance releases are connected by NEXT relationships
  // each Maintenance release has a PARENT relationship to a Feature release
  // and if we create Major releases:
  // each Feature release has a PARENT relationship to a Major release



});

export default routes;