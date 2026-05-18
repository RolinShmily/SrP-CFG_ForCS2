// Generates a WiX wxs fragment from the Electron app output directory.
// Usage: node harvest.js <sourceDir> <outputFile>

const fs = require("fs");
const path = require("path");

const srcDir = process.argv[2] || path.join(__dirname, "..", "app", "desktop", "out", "SrP-CFG Installer-win32-x64");
const outFile = process.argv[3] || path.join(__dirname, "ElectronAppFiles.wxs");

let idCounter = 0;
function nextId(prefix) {
  idCounter++;
  return `${prefix}_${idCounter}`;
}

const compRefs = []; // ComponentRef entries for ComponentGroup
const dirEntries = []; // DirectoryRef + Component entries

function walk(dir, parentId, relPath) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory());
  const files = entries.filter((e) => e.isFile());

  const componentsInDir = [];

  for (const file of files) {
    if (file.name.endsWith(".pdb")) continue;
    const cid = nextId("cmp");
    const fid = nextId("fil");
    const src = relPath ? `${relPath}\\${file.name}` : file.name;
    componentsInDir.push(
      `      <Component Id="${cid}" Bitness="always64" Guid="*">\n` +
      `        <File Id="${fid}" Source="$(var.ElectronAppDir)\\${src}" KeyPath="yes" />\n` +
      `      </Component>`
    );
    compRefs.push(`      <ComponentRef Id="${cid}" />`);
  }

  const childDirs = [];
  for (const d of dirs) {
    const dirId = nextId("dir");
    const childRel = relPath ? `${relPath}\\${d.name}` : d.name;
    childDirs.push({ dirId, name: d.name, fullPath: path.join(dir, d.name), childRel });
  }

  // Output this directory level
  let output = "";
  if (componentsInDir.length > 0) {
    output += componentsInDir.join("\n") + "\n";
  }
  for (const child of childDirs) {
    output += `      <Directory Id="${child.dirId}" Name="${child.name}">\n`;
    const childOutput = walk(child.fullPath, child.dirId, child.childRel);
    // Indent child output
    output += childOutput.split("\n").map(l => l ? "  " + l : l).join("\n");
    output += `      </Directory>\n`;
  }

  return output;
}

const dirContent = walk(srcDir, "INSTALLFOLDER", "");

const wxs = `<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://wixtoolset.org/schemas/v4/wxs">
  <Fragment>
    <DirectoryRef Id="INSTALLFOLDER">
${dirContent.split("\n").map(l => l ? "    " + l : l).join("\n")}    </DirectoryRef>
  </Fragment>
  <Fragment>
    <ComponentGroup Id="ElectronAppFiles">
${compRefs.join("\n")}
    </ComponentGroup>
  </Fragment>
</Wix>
`;

fs.writeFileSync(outFile, wxs, "utf-8");
console.log(`Harvested ${idCounter} items from ${srcDir}`);
