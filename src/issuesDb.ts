import neo4j from 'neo4j-driver'
require("dotenv").config();
import { Driver } from 'neo4j-driver-core';
require("dotenv").config();

class IssuesDb {
  public driver: Driver;

  constructor() {
    console.log(`Neo4j Driver connecting to ${process.env.dbUri}`)
    console.log()
    this.driver =  neo4j.driver(process.env.dbUri, neo4j.auth.basic(process.env.dbUser, process.env.dbPass));
  }
}

export default new IssuesDb().driver;