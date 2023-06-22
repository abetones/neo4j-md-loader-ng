import { Router } from 'express';
import driver from './issuesDb';
import parser from './parser';
import * as fs from 'fs';
require("dotenv").config();
const routes = Router();

routes.get('/', (req, res) => {
  return res.json({ message: 'Hello, Whirled' });
});

routes.get('/parseIssues', async (req, res) => {

  // we could accept a POSTed file or JSON,
  // but for this proof of concept, 
  // executing the GET route simply ingests the markdown 
  // from a hard-coded file, and returns the resulting issues in a JSON array

  try {
    const md = fs.readFileSync(process.env.issuesFilePath,'utf8');
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
      'create constraint if not exists for (n:Release) require (n.version) is node key',
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

    issues.forEach(function(issue) {
      // Write the data to the database -> construct the right query
      // TO-DO: send batch of issues and use UNWIND to create nodes
      //
      // I think Håkan's idea is that we create all the Release nodes 
      // *at the moment we create the issue related to them*
      // and then as a second step (separate route) create the remaining
      // Release nodes (using MERGE so that there are no duplicate nodes)
      //
      driver.executeQuery(
        `MERGE (issue:Issue{jiraPrimary: $jiraPrimary}) 
          SET issue.issueTitle = $issueTitle, 
              issue.problem = $problem, 
              issue.precondition = trim($precondition), 
              issue.workaround = trim($workaround), 
              issue.fix = $fix, 
              issue.jiraPrimaryDateString = $jiraPrimaryDateString,  
              issue.jiras = $jiras
              MERGE (oldestR:Release{version:$affectedVersionOldest}) 
              MERGE (newestR:Release{version:$affectedVersionNewest}) 
              MERGE (issue)-[:FIRST_SEEN_IN]->(oldestR)
              MERGE (issue)-[:LAST_SEEN_IN]->(newestR)
          WITH [oldestR, newestR] as releases
          CALL {
            WITH releases
            UNWIND releases as release
            WITH release, split(release.version,'.') as rsplit
            WHERE not exists { (release)-[:PARENT]->() }
            AND  size(rsplit) = 3
            MERGE (pr:Release{version: apoc.text.join(rsplit[0..-1], '.')})
            MERGE (release)-[:PARENT]->(pr)
            return collect(pr) as maintenances
          }
          WITH releases + maintenances as releases
          CALL {
            WITH releases
            UNWIND releases as release
            WITH release, split(release.version,'.') as rsplit
            WHERE not exists { (release)-[:PARENT]->() }
            AND  size(rsplit) = 2
            MERGE (pr:Release{version: apoc.text.join(rsplit[0..-1], '.')})
            MERGE (release)-[:PARENT]->(pr)
            return collect(pr) as features
          }
          WITH releases + features as releases  
          CALL {
            WITH releases
            UNWIND releases as release
            WITH release, split(release.version,'.') as rsplit
            WHERE not exists { (release)-[:PARENT]->() }
            AND  size(rsplit) = 1
            AND not release.version =  'All releases'
            MERGE (pr:Release{version: 'All releases'})
            MERGE (release)-[:PARENT]->(pr)
          }
          `,
        issue,
        {database: process.env.dbName}
      )
      .then((result) => { })//return result.records.map( (r) => r.get('Issue') ) })
      .catch( (error) => { return error}) //console.error(error) })
    });

    return res.json(issues);
  } catch(ex) {
    return ex.message;
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