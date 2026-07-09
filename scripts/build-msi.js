const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');
const { runCompilation, escapeXml } = require('./build-common');

const UPGRADE_CODE = '8a7d5b12-9c3f-4e0a-8a4f-0f2c98d6c7b9';
const MSI_ARCH = 'x64';

// Helpers for ID sanitization

function sanitizeId(p, prefix) {
  // Normalize paths to use forward slashes for cross-platform deterministic IDs
  const normalizedPath = p.replace(/\\/g, '/');
  // Replace anything that is not alphanumeric or underscore with underscore (removes dots too)
  let clean = normalizedPath.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^[0-9]/.test(clean)) {
    clean = '_' + clean;
  }
  if (clean.length > 60) {
    const hash = crypto.createHash('md5').update(normalizedPath).digest('hex').substring(0, 8);
    clean = clean.substring(0, 50) + '_' + hash;
  }
  return prefix + '_' + clean;
}

function createDeterministicGuid(seed) {
  const hash = crypto.createHash('sha1').update(seed).digest();

  // RFC 4122 version 5 style GUID, generated locally from a stable seed.
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;

  const hex = hash.subarray(0, 16).toString('hex');
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}

// Build directory tree
function buildDirectoryTree(dirPath, relativeDir = '') {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const subdirs = [];
  const files = [];

  for (const item of items) {
    const relativePath = relativeDir ? path.join(relativeDir, item.name) : item.name;
    const fullPath = path.join(dirPath, item.name);
    
    if (item.isDirectory()) {
      subdirs.push({
        name: item.name,
        relativeDir: relativePath,
        tree: buildDirectoryTree(fullPath, relativePath)
      });
    } else {
      files.push({
        name: item.name,
        relativePath: relativePath,
        fullPath: fullPath
      });
    }
  }

  return { subdirs, files };
}

// Generate XML directory structure
function generateDirectoryXml(node, indent = '      ') {
  let xml = '';
  for (const subdir of node.subdirs) {
    const dirId = sanitizeId(subdir.relativeDir, 'dir');
    xml += `${indent}<Directory Id="${dirId}" Name="${escapeXml(subdir.name)}">\n`;
    xml += generateDirectoryXml(subdir.tree, indent + '  ');
    xml += `${indent}</Directory>\n`;
  }
  return xml;
}

// Gather files to pack
function gatherFiles(node, relativeDir = '') {
  let files = [];
  for (const file of node.files) {
    const dirId = relativeDir === '' ? 'INSTALLFOLDER' : sanitizeId(relativeDir, 'dir');
    files.push({
      name: file.name,
      relativePath: file.relativePath,
      dirId: dirId
    });
  }
  for (const subdir of node.subdirs) {
    files = files.concat(gatherFiles(subdir.tree, subdir.relativeDir));
  }
  return files;
}

// Generate Files.wxs content
function generateFilesWxs(tree) {
  const dirXml = generateDirectoryXml(tree);
  const files = gatherFiles(tree);
  
  let componentGroupXml = '    <ComponentGroup Id="AppFiles">\n';
  for (const file of files) {
    const cmpId = sanitizeId(file.relativePath, 'cmp');
    const fileId = sanitizeId(file.relativePath, 'file');
    const sourcePath = path.join('release', 'win-unpacked', file.relativePath).replace(/\//g, '\\');
    
    // Check if it is the main executable to nest the shortcuts directly inside it
    if (file.relativePath.replace(/\\/g, '/') === 'Flux Tasks.exe') {
      componentGroupXml += `      <Component Id="${cmpId}" Directory="${file.dirId}">\n`;
      componentGroupXml += `        <File Id="${fileId}" Source="${escapeXml(sourcePath)}" KeyPath="yes">\n`;
      componentGroupXml += `          <Shortcut Id="ApplicationStartMenuShortcut"\n`;
      componentGroupXml += `                    Directory="ProgramMenuFolder"\n`;
      componentGroupXml += `                    Name="Flux Tasks"\n`;
      componentGroupXml += `                    Description="Local-first desktop task manager with GitHub integration and background reminders."\n`;
      componentGroupXml += `                    WorkingDirectory="INSTALLFOLDER"\n`;
      componentGroupXml += `                    Advertise="yes" />\n`;
      componentGroupXml += `          <Shortcut Id="ApplicationDesktopShortcut"\n`;
      componentGroupXml += `                    Directory="DesktopFolder"\n`;
      componentGroupXml += `                    Name="Flux Tasks"\n`;
      componentGroupXml += `                    Description="Local-first desktop task manager with GitHub integration and background reminders."\n`;
      componentGroupXml += `                    WorkingDirectory="INSTALLFOLDER"\n`;
      componentGroupXml += `                    Advertise="yes" />\n`;
      componentGroupXml += `        </File>\n`;
      componentGroupXml += `      </Component>\n`;
    } else {
      componentGroupXml += `      <Component Id="${cmpId}" Directory="${file.dirId}">\n`;
      componentGroupXml += `        <File Id="${fileId}" Source="${escapeXml(sourcePath)}" KeyPath="yes" />\n`;
      componentGroupXml += `      </Component>\n`;
    }
  }
  componentGroupXml += '    </ComponentGroup>\n';

  return `<?xml version="1.0" encoding="utf-8"?>
<Wix xmlns="http://wixtoolset.org/schemas/v4/wxs">
  <Fragment>
    <DirectoryRef Id="INSTALLFOLDER">
${dirXml}    </DirectoryRef>

${componentGroupXml}  </Fragment>
</Wix>
`;
}

// Main execution flow
function main() {
  console.log('=== Starting MSI Build Process for Microsoft Store ===');

  // 1. Read metadata from package.json
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: package.json not found!');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version || '1.0.0';
  
  // Normalize version (Windows Installer requires numeric parts e.g. X.Y.Z)
  const versionMatch = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  const normalizedVersion = versionMatch ? `${versionMatch[1]}.${versionMatch[2]}.${versionMatch[3]}` : '1.0.0';
  const productCode = createDeterministicGuid(`${UPGRADE_CODE}|${normalizedVersion}|${MSI_ARCH}`);
  
  console.log(`Application Name: ${packageJson.productName || packageJson.name}`);
  console.log(`Original Version: ${version}`);
  console.log(`Normalized Version: ${normalizedVersion}`);
  console.log(`MSI ProductCode: {${productCode.toUpperCase()}}`);

  // 2. Perform electron build compilation
  const unpackedDir = runCompilation();

  // 3. Ensure wix directory and icon exist
  console.log('\n--- Step 2: Preparing WiX Assets ---');
  const wixDir = path.join(__dirname, '..', 'wix');
  if (!fs.existsSync(wixDir)) {
    fs.mkdirSync(wixDir, { recursive: true });
  }

  // Try to copy the icon from the electron-builder cache or fallback
  const wixIconPath = path.join(wixDir, 'icon.ico');
  const generatedIconPath = path.join(__dirname, '..', 'release', '.icon-ico', 'icon.ico');
  
  if (fs.existsSync(generatedIconPath)) {
    console.log(`Copying generated icon from ${generatedIconPath} to ${wixIconPath}`);
    fs.copyFileSync(generatedIconPath, wixIconPath);
  } else {
    // If the icon is not found, verify if wix/icon.ico already exists.
    if (!fs.existsSync(wixIconPath)) {
      console.warn(`Warning: icon.ico not found at ${generatedIconPath} and no fallback at ${wixIconPath}.`);
      console.warn('Creating a dummy file or please place a valid icon.ico in wix/ folder.');
      // Create a 0-byte file just so compilation does not fail, though a real icon is expected
      fs.writeFileSync(wixIconPath, '');
    } else {
      console.log(`Using existing icon at ${wixIconPath}`);
    }
  }

  // 4. Harvest unpacked files and generate wix/Files.wxs
  console.log('\n--- Step 3: Harvesting Files and Generating wix/Files.wxs ---');
  try {
    const tree = buildDirectoryTree(unpackedDir);
    const filesWxsContent = generateFilesWxs(tree);
    const filesWxsPath = path.join(wixDir, 'Files.wxs');
    fs.writeFileSync(filesWxsPath, filesWxsContent, 'utf8');
    console.log(`Successfully generated ${filesWxsPath}`);
  } catch (error) {
    console.error('Failed to harvest files and generate Files.wxs:', error);
    process.exit(1);
  }

  // 5. Ensure EULA is accepted
  console.log('\n--- Step 4: Accepting WiX EULA ---');
  try {
    execSync('wix eula accept wix7', { stdio: 'inherit' });
  } catch (e) {
    console.warn('Warning: Failed to execute wix eula accept command. Checking if compiler works anyway.');
  }

  // 6. Compile MSI with WiX v5/v7
  console.log('\n--- Step 5: Compiling MSI Package ---');
  const releaseStoreDir = path.join(__dirname, '..', 'release-store');
  if (!fs.existsSync(releaseStoreDir)) {
    fs.mkdirSync(releaseStoreDir, { recursive: true });
  }

  const msiOutPath = path.join(releaseStoreDir, 'Flux_Tasks_Store.msi');
  const productWxsPath = path.join(wixDir, 'Product.wxs');
  const filesWxsPath = path.join(wixDir, 'Files.wxs');

  try {
    const compileCmd = `wix build -arch ${MSI_ARCH} -d ProductVersion="${normalizedVersion}" -d ProductCode="${productCode}" -out "${msiOutPath}" "${productWxsPath}" "${filesWxsPath}"`;
    console.log(`Running: ${compileCmd}`);
    execSync(compileCmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log(`\n=== MSI Build Successfully Completed! ===`);
    console.log(`MSI Installer created at: ${msiOutPath}`);
  } catch (error) {
    console.error('\nMSI compilation failed:', error.message);
    process.exit(1);
  }
}

main();
