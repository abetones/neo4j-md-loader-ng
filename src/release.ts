class Release {
    //types: 
    // Major, e.g. 3.0.0
    // MajorParent, e.g. 3.x
    // Feature, e.g. 3.2.0
    // FeatureParent, e.g. 3.2.x
    // Maintenance, e.g. 3.2.1
    // product:
    // for now, always Stream
    // in future, we'll generate Release nodes for
    // Stream, Edge, and Search ... should we make this an array?
    // datePlain -- e.g., "2022-09-15"
    // dateUTC -- e.g., "2023-06-14T09:32:41.070Z"
    type: String  
    version: String
    versionMajor: number
    versionMinor: number
    versionBuild: number
    parentVersion: String
    nextVersion: String
    versions: String[]
    product: String
    datePlain: String
    dateUTC: String
    constructor() {
    }
}

export default new Release();