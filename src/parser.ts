import Issue from './issue';

class Parser {

  parse(markdown:string) { //, releases:typeof Release[]) {
    let issues: typeof Issue[] = [];
    let fieldName = "";
    const lines = markdown.split("\n");

    let issue:typeof Issue = {
        jiraPrimary: "",
        jiras: [],
        //jiraPrimaryDate: null,
        jiraPrimaryDateString: "",
        //product: "",
        affectedVersionOldest: "",  
        affectedVersionNewest: "",
        affectedVersions: [],
        issueTitle: "",  
        problem: "",
        precondition: "",
        workaround: "",
        fix: "",  
    };

    lines.forEach(function(line) {
        if(line.trim().length == 0) {
            // keep rolling
        } else if(line.startsWith("#[")) {
            if(issue.issueTitle.trim().length > 0) {
                issues.push(issue);
            }
            issue = {
                jiraPrimary: line,
                jiras: [],
                //jiraPrimaryDate: null,
                jiraPrimaryDateString: "",
                //product: "TBD",
                affectedVersionOldest: "",  
                affectedVersionNewest: "",
                affectedVersions: [],
                issueTitle: "",  
                problem: "",
                precondition: "",
                workaround: "",
                fix: "",  
            };

        } else if(line.startsWith("###")) {
            const lineParts = line.replace("### ", "")
            .split(" – ")
            .join(",")
            .split(",")
            .join(",")
            .split(",");

            if(lineParts.length === 3) {
                issue.jiraPrimaryDateString = lineParts[0].trim();

                issue.affectedVersionOldest = lineParts[1].trim().toLowerCase();
                // versionString can be various representations including:
                // v.4.1.1
                // v.3.0.x
                // v.3.0.x–3.1.0
                let versions:String[] = [];
                let vs = lineParts[1].trim().trim().split("–");
                if(vs.length === 1) {
                    vs = lineParts[1].trim().trim().split("through");
                }
                if(vs.length === 1) {
                    vs = lineParts[1].trim().trim().split("-");
                }
                vs.forEach(v => {
                    if (v.toLowerCase().trim() === "all versions") {
                        v="";
                    } else {
                        v=v.replace("All","");
                        v=v.replace("versions","");
                        v=v.replace("Versions","");
                        v=v.replace("version","");
                        v=v.replace("v.","")
                        v=v.replace("v","")
                        // v=v.replace(".x","")
                        // v=v.replace(".X","")
                    }
                    //console.log(v.trim())
                    versions.push(v.trim().toLowerCase());
                });

                //@todo here interpret the versions
                // might have a number, might have something like "All versions"
                // we want both oldest and newest to point to a third-tier number (3.2.1) rather than 3.x or 3

                issue.affectedVersionOldest = versions[0];
                issue.affectedVersionNewest = versions[versions.length - 1];

                issue.affectedVersions = versions;

                const descriptionParts = lineParts[2].split("[");
                if(descriptionParts.length === 2) {
                    issue.issueTitle = descriptionParts[0].trim();

                    // ticket number(s) are in descriptionParts[1]
                    // may be comma-separated
                    const ticketNumbers = descriptionParts[1].replace("]","").split(",");
                    issue.jiras = ticketNumbers;
                    issue.jiraPrimary = ticketNumbers[0].trim();

                }
            }
        } else if (line.startsWith("**")) {
            const lineParts = line.split("**:");

            if(lineParts.length === 2) {
                fieldName = lineParts[0].replace("**","").trim().toLowerCase();
                if(fieldName == "precondition") {
                    issue.precondition = lineParts[1].trim();
                } else if(fieldName == "problem") {
                    issue.problem = lineParts[1].trim();
                } else if(fieldName == "workaround") {
                    issue.workaround = lineParts[1].trim();
                } else if(fieldName == "fix") {
                    issue.fix = lineParts[1].trim();
                }
            }
        } else {
            if(fieldName == "precondition") {
                issue.precondition += line.trim();
            } else if(fieldName == "problem") {
                issue.problem += line.trim();
            } else if(fieldName == "workaround") {
                issue.workaround += line.trim();
            } else if(fieldName == "fix") {
                issue.fix += line.trim();
            }
        }
    });

    // push the last issue
    if(issue.issueTitle.length > 0) {
        issues.push(issue);
    }
   
    return issues;
  }

}

export default new Parser().parse;