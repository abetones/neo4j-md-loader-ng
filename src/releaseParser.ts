import Release from './release';
import Issue from './issue';

function getNextVersion(releases: typeof Release[], release:typeof Release) {
    const numParts = release.version.split(".");
    let nextVersion = null;
    let v = "";
    if(numParts.length <= 1) {
        return null;
    } 
    
    if(release.version.endsWith(".x")) {
        if (numParts.length === 2) {
            v = (release.versionMajor+1).toString() + ".x";
        } else if (numParts.length === 3) {
            v = release.versionMajor.toString() + "." + (release.versionMinor+1).toString() + ".x";
        }
    } else {
        if (numParts.length === 2) {
            v = release.versionMajor.toString() + "." + (release.versionMinor + 1).toString();
        } else if (numParts.length === 3) {
            v = release.versionMajor.toString() + "." + release.versionMinor.toString() + "." + (release.versionBuild + 1).toString();
        }
    }

    if(undefined !== releases.findIndex(x => x.version === v)) {
        nextVersion = v;
    }
    return nextVersion;
}

function getParentVersion(releases: typeof Release[], release:typeof Release) {
    const numParts = release.version.split(".");
    let parentVersion = null;
    let v = "";
    if(numParts.length <= 1) {
        return null;
    } 
    if (numParts.length === 2) {
        if(numParts[1] !== "x") {
            v = release.versionMajor.toString() + ".x";
        }
    } else if (numParts.length === 3) {
        if(numParts[2] !== "x") {
            v = release.versionMajor.toString() + "." + release.versionMinor.toString() + ".x";
        } else {
            v = release.versionMajor.toString() + ".x";
        }
    }
    if(undefined !== releases.findIndex(x => x.version === v)) {
        parentVersion = v;
    }
    return parentVersion;
}

function extractReleaseNumbers(relNum:String) {
    const numParts = relNum.split(".");
    let ma: number = null;
    let mi: number = null;
    let b: number = null;
    let version = "";
    let releaseType = "Maintenance";

    if(numParts.length === 0) {
        return {version, releaseType, ma, mi, b};
    }

    version = numParts[0];
    ma = +numParts[0];
    if(numParts.length > 1) {
        if(numParts[1] !== "x") {
            mi = +numParts[1];
            version += "." + numParts[1];
            if(numParts.length > 2) {
                if (numParts[2] !== "x") {
                    b = +numParts[2];
                    if(b === 0 && mi === 0) {
                        releaseType = "Major";
                    } else if (b === 0) {
                        releaseType ="Feature";
                    }
                    version += "." + numParts[2];
                } else {
                    releaseType = "FeatureParent";
                    version += ".x";
                }
            }             
        } else {
            releaseType = "MajorParent";
            version += ".x";
        }
    }
    return {version, releaseType, ma, mi, b};

}

function findOrCreateRelease(releases: typeof Release[], relNum:String) {
    const {version, releaseType, ma, mi, b} = extractReleaseNumbers(relNum);
    let release = releases.find(rel => rel.version === version);
    if(undefined === release) {
        release = {
            type: releaseType,
            version: version,
            parentVersion: "",
            nextVersion: "",
            versions: [],
            versionMajor: ma,
            versionMinor: mi,
            versionBuild: b,
            product: "Stream",
            datePlain: "",
            dateUTC: ""                
        };
        releases.push(release);
    } else {
        const relIndex = releases.findIndex(rel => rel.version === version);
        releases[relIndex].versionMajor = ma;
        releases[relIndex].versionMinor = mi;
        releases[relIndex].versionBuild = b;
    }
    return releases
}

class ReleaseParser {

  parseReleases(releasesString:string, issues: typeof Issue[]) {

    let releases: typeof Release[] = JSON.parse(releasesString);

    issues.forEach(function (issue) {
        if(issue.affectedVersionOldest.length > 0) {
            releases = findOrCreateRelease(releases, issue.affectedVersionOldest); 
        }
        if(issue.affectedVersionNewest.length > 0) {
            releases = findOrCreateRelease(releases, issue.affectedVersionNewest); 
        }
    });

    // get parent versions and major/minor/build
    releases.forEach(function (release) {
        const relIdx = releases.findIndex(x => x.version === release.version);

        const {version, releaseType, ma, mi, b} = extractReleaseNumbers(release.version);
        releases[relIdx].versionMajor = ma;
        releases[relIdx].versionMinor = mi;
        releases[relIdx].versionBuild = b;
        releases[relIdx].type = releaseType;

        const parentVersion = getParentVersion(releases, release);
        if(null !== parentVersion) {
            releases[relIdx].parentVersion = parentVersion;
        }

        const nextVersion = getNextVersion(releases, release);
        if(null !== nextVersion) {
            releases[relIdx].nextVersion = nextVersion;
        }
    });
    
    // ensure there's a wildcard for each major build number
    // for (var i = smallestMajor; i <= largestMajor; i++) {
    //     const iString = i.toString() + ".x";
    //     releases = findOrCreateRelease(releases, iString);
    // }

    return releases;
  }

}

export default new ReleaseParser().parseReleases;

