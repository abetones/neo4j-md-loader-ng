declare global {
  namespace NodeJS {
    interface ProcessEnv {
      dbUri :string;
      dbUser:string;
      dbPass:string;
      dbName:string;
      appPort:string;
      issuesFilePath:string;
      releasesFilePath:string;
    }
  }
}
export {}