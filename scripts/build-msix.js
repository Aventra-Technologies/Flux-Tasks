const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadEnv, runCompilation, escapeXml } = require('./build-common');

// 1. Initial setup and load env vars
loadEnv();

console.log('=== Starting MSIX Build Process for Microsoft Store ===');

// 2. Read package.json metadata
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('Error: package.json not found!');
  process.exit(1);
}
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 3. Extract and parse parameters from package.json and environment
const displayName = process.env.MSIX_DISPLAY_NAME || packageJson.productName || packageJson.name;

// Store identity name must be alphanumeric with dots or hyphens
const identityName = (process.env.MSIX_IDENTITY_NAME || process.env.MSIX_NAME || 'AventraTechnologies.FluxTasks')
  .replace(/[^a-zA-Z0-9.-]/g, '');

const publisher = process.env.MSIX_PUBLISHER || process.env.PUBLISHER || 'CN=85305F22-8B2B-4D8B-9F71-2EF94BF760F7';
const description = process.env.MSIX_DESCRIPTION || packageJson.description || 'Local-first desktop task manager';

// Extract Publisher Display Name
let publisherDisplayName = process.env.MSIX_PUBLISHER_DISPLAY_NAME || '';
if (!publisherDisplayName) {
  const cnMatch = publisher.match(/CN\s*=\s*("([^"]+)"|([^,]+))/i);
  if (cnMatch) {
    publisherDisplayName = (cnMatch[2] || cnMatch[3]).trim();
  } else {
    publisherDisplayName = publisher;
  }
}
if (publisherDisplayName === '85305F22-8B2B-4D8B-9F71-2EF94BF760F7') {
  // If CN is GUID-like, fallback to standard display name
  publisherDisplayName = 'Aventra Technologies';
}

// Format version: 1.1.28 -> 1.1.28.0 (MSIX requires a 4-part version number)
let version = packageJson.version || '1.0.0';
const cleanedParts = version.split('-')[0].split('.').map(p => parseInt(p, 10) || 0);
while (cleanedParts.length < 4) {
  cleanedParts.push(0);
}
const msixVersion = cleanedParts.slice(0, 4).join('.');

console.log(`Identity Name:          ${identityName}`);
console.log(`Display Name:           ${displayName}`);
console.log(`Publisher ID:           ${publisher}`);
console.log(`Publisher Display Name: ${publisherDisplayName}`);
console.log(`Version:                ${msixVersion} (original: ${version})`);

// 4. Directory paths
const releaseDir = path.join(__dirname, '..', 'release');
const stagingDir = path.join(releaseDir, 'msix-staging');
const releaseStoreDir = path.join(__dirname, '..', 'release-store');
const outputMsixPath = path.join(releaseStoreDir, 'Flux_Tasks.msix');

// Recreate release-store and staging folders
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

if (!fs.existsSync(releaseStoreDir)) {
  fs.mkdirSync(releaseStoreDir, { recursive: true });
}

// 5. Compile frontend and electron app, build win-unpacked
const unpackedDir = runCompilation();

// 6. Copy win-unpacked files to staging directory
console.log('\n--- Step 2: Copying App Files to MSIX Staging Directory ---');
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}
copyRecursiveSync(unpackedDir, stagingDir);
console.log(`Copied unpacked files to: ${stagingDir}`);

// 7. Auto-generate Assets
console.log('\n--- Step 3: Generating MSIX Visual Assets ---');
const assetsDir = path.join(stagingDir, 'Assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Source PNG
const sourcePngPath = [
  path.join(__dirname, '..', 'assets', 'icon.png'),
  path.join(__dirname, '..', 'assets', 'logo.png')
].find(fs.existsSync);

if (!sourcePngPath) {
  console.error('Error: Source PNG icon was not found in assets/ directory.');
  process.exit(1);
}
console.log(`Using source image: ${sourcePngPath}`);

// Write PowerShell resizer script
const resizeHelperPath = path.join(releaseDir, 'resize-helper.ps1');
const resizeHelperScript = `param(
    [string]$srcPath,
    [string]$destPath,
    [int]$targetWidth,
    [int]$targetHeight
)
try {
    [System.Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.Clear([System.Drawing.Color]::Transparent)
    
    $srcAspect = $src.Width / $src.Height
    $targetAspect = $targetWidth / $targetHeight
    
    if ($srcAspect -gt $targetAspect) {
        $drawWidth = $targetWidth
        $drawHeight = [int]($targetWidth / $srcAspect)
        $x = 0
        $y = [int](($targetHeight - $drawHeight) / 2)
    } else {
        $drawHeight = $targetHeight
        $drawWidth = [int]($targetHeight * $srcAspect)
        $x = [int](($targetWidth - $drawWidth) / 2)
        $y = 0
    }
    
    $g.DrawImage($src, $x, $y, $drawWidth, $drawHeight)
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    $src.Dispose()
    Write-Output "Success"
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
`;

fs.writeFileSync(resizeHelperPath, resizeHelperScript, 'utf8');

const assetSizes = [
  { name: 'StoreLogo.png', w: 50, h: 50 },
  { name: 'Square44x44Logo.png', w: 44, h: 44 },
  { name: 'Square150x150Logo.png', w: 150, h: 150 },
  { name: 'Square310x310Logo.png', w: 310, h: 310 },
  { name: 'Wide310x150Logo.png', w: 310, h: 150 }
];

try {
  for (const size of assetSizes) {
    const destPath = path.join(assetsDir, size.name);
    console.log(`Generating ${size.name} (${size.w}x${size.h})...`);
    execSync(`powershell -ExecutionPolicy Bypass -File "${resizeHelperPath}" -srcPath "${sourcePngPath}" -destPath "${destPath}" -targetWidth ${size.w} -targetHeight ${size.h}`, { stdio: 'inherit' });
  }
} catch (err) {
  console.error('Failed to generate image assets:', err.message);
  if (fs.existsSync(resizeHelperPath)) fs.unlinkSync(resizeHelperPath);
  process.exit(1);
} finally {
  if (fs.existsSync(resizeHelperPath)) {
    fs.unlinkSync(resizeHelperPath);
  }
}

// 8. Scan for main executable in staging directory
const files = fs.readdirSync(stagingDir);
const exeFiles = files.filter(f => f.endsWith('.exe'));
let mainExe = exeFiles.find(f => f.toLowerCase() === `${packageJson.productName.toLowerCase()}.exe`) ||
              exeFiles.find(f => f.toLowerCase() === `${packageJson.name.toLowerCase()}.exe`) ||
              exeFiles[0] ||
              'Flux Tasks.exe';

console.log(`Main Executable: ${mainExe}`);

// 9. Generate AppxManifest.xml
const backgroundColor = process.env.MSIX_BACKGROUND_COLOR || '#2d3748';
const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  xmlns:desktop7="http://schemas.microsoft.com/appx/manifest/desktop/windows10/7"
  IgnorableNamespaces="uap rescap desktop7">

  <Identity
    Name="${escapeXml(identityName)}"
    Publisher="${escapeXml(publisher)}"
    Version="${escapeXml(msixVersion)}"
    ProcessorArchitecture="x64" />

  <Properties>
    <DisplayName>${escapeXml(displayName)}</DisplayName>
    <PublisherDisplayName>${escapeXml(publisherDisplayName)}</PublisherDisplayName>
    <Logo>Assets\\StoreLogo.png</Logo>
    <Description>${escapeXml(description)}</Description>
  </Properties>

  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.22000.0" />
  </Dependencies>

  <Resources>
    <Resource Language="en-US" />
  </Resources>

  <Applications>
    <Application Id="App"
      Executable="${escapeXml(mainExe)}"
      EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements
        DisplayName="${escapeXml(displayName)}"
        Description="${escapeXml(description)}"
        BackgroundColor="${escapeXml(backgroundColor)}"
        Square150x150Logo="Assets\\Square150x150Logo.png"
        Square44x44Logo="Assets\\Square44x44Logo.png">
        <uap:DefaultTile Wide310x150Logo="Assets\\Wide310x150Logo.png" Square310x310Logo="Assets\\Square310x310Logo.png">
          <uap:ShowNameOnTiles>
            <uap:ShowOn Tile="square150x150Logo"/>
            <uap:ShowOn Tile="wide310x150Logo"/>
            <uap:ShowOn Tile="square310x310Logo"/>
          </uap:ShowNameOnTiles>
        </uap:DefaultTile>
        <uap:SplashScreen Image="Assets\\Square150x150Logo.png" />
      </uap:VisualElements>
      <Extensions>
        <desktop7:Extension Category="windows.shortcut">
          <desktop7:Shortcut
            File="[{Desktop}]\\${escapeXml(displayName)}.lnk"
            Icon="Assets\\Square150x150Logo.png" />
        </desktop7:Extension>
      </Extensions>
    </Application>
  </Applications>

  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
</Package>
`;

const manifestPath = path.join(stagingDir, 'AppxManifest.xml');
fs.writeFileSync(manifestPath, manifestXml, 'utf8');
console.log(`Generated AppxManifest.xml at: ${manifestPath}`);

// Helper to locate tools in the Windows SDK
function findSdkTool(toolName) {
  try {
    const output = execSync(`where ${toolName}`, { stdio: 'pipe' }).toString().trim().split('\n')[0].trim();
    if (output && fs.existsSync(output)) {
      return output;
    }
  } catch (e) {}

  const sdkPaths = [
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin',
    'C:\\Program Files\\Windows Kits\\10\\bin',
    'C:\\Program Files (x86)\\Windows Kits\\8.1\\bin',
    'C:\\Program Files\\Windows Kits\\8.1\\bin'
  ];

  const candidates = [];
  for (const sdkPath of sdkPaths) {
    if (fs.existsSync(sdkPath)) {
      const dirs = fs.readdirSync(sdkPath).filter(f => fs.statSync(path.join(sdkPath, f)).isDirectory());
      for (const dir of dirs) {
        const x64Path = path.join(sdkPath, dir, 'x64', toolName);
        if (fs.existsSync(x64Path)) {
          candidates.push(x64Path);
        }
      }
      const directPath = path.join(sdkPath, 'x64', toolName);
      if (fs.existsSync(directPath)) {
        candidates.push(directPath);
      }
    }
  }

  const ackPath = `C:\\Program Files (x86)\\Windows Kits\\10\\App Certification Kit\\${toolName}`;
  if (fs.existsSync(ackPath)) {
    candidates.push(ackPath);
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      const aVer = a.match(/10\.\d+\.\d+\.\d+/) ? a.match(/10\.\d+\.\d+\.\d+/)[0] : '';
      const bVer = b.match(/10\.\d+\.\d+\.\d+/) ? b.match(/10\.\d+\.\d+\.\d+/)[0] : '';
      if (aVer && bVer) {
        return bVer.localeCompare(aVer, undefined, { numeric: true });
      }
      return aVer ? -1 : 1;
    });
    return candidates[0];
  }
  return null;
}

const makeappxPath = findSdkTool('makeappx.exe');
if (!makeappxPath) {
  console.error('\nError: makeappx.exe was not found. Please install the Windows SDK.');
  process.exit(1);
}
console.log(`Found MakeAppx at: ${makeappxPath}`);

// 10. Run MakeAppx pack
console.log('\n--- Step 4: Packaging MSIX with MakeAppx ---');
try {
  const packCmd = `"${makeappxPath}" pack /d "${stagingDir}" /p "${outputMsixPath}" /o`;
  console.log(`Running: ${packCmd}`);
  execSync(packCmd, { stdio: 'inherit' });
  console.log(`✓ MSIX Package packed successfully at: ${outputMsixPath}`);
} catch (err) {
  console.error('Packaging failed:', err.message);
  process.exit(1);
}

// 11. Handle Signing
const signCert = process.env.SIGN_CERT;
const signPassword = process.env.SIGN_PASSWORD;

if (signCert) {
  console.log('\n--- Step 5: Signing MSIX Package ---');
  const signtoolPath = findSdkTool('signtool.exe');
  if (!signtoolPath) {
    console.error('Error: signtool.exe not found. Cannot sign MSIX package.');
    process.exit(1);
  }
  console.log(`Found SignTool at: ${signtoolPath}`);

  try {
    let signCmd = `"${signtoolPath}" sign /f "${signCert}"`;
    if (signPassword) {
      signCmd += ` /p "${signPassword}"`;
    }
    signCmd += ` /fd SHA256 "${outputMsixPath}"`;
    
    console.log(`Running signature command...`);
    execSync(signCmd, { stdio: 'inherit' });
    console.log('✓ MSIX Package signed successfully.');
  } catch (err) {
    console.error('Signing failed:', err.message);
    process.exit(1);
  }
} else {
  console.log('\n--- Step 5: Signing MSIX Package (Skipped) ---');
  console.log('No SIGN_CERT environment variable specified. Package remains unsigned (valid for local testing / self-signing setup, but required for Store publishing).');
}

// 12. Run Automatic Verification
console.log('\n--- Step 6: Running Automatic Verification ---');
function runVerification() {
  const errors = [];
  
  // A. Check file existence and size
  if (!fs.existsSync(outputMsixPath)) {
    errors.push(`MSIX file does not exist at: ${outputMsixPath}`);
    return errors;
  }
  const stats = fs.statSync(outputMsixPath);
  if (stats.size === 0) {
    errors.push('MSIX file is empty (0 bytes).');
  } else {
    console.log(`✓ MSIX package size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
  }

  // B. Verify Manifest
  if (!fs.existsSync(manifestPath)) {
    errors.push('AppxManifest.xml is missing from staging directory.');
  } else {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    if (!manifestContent.trim().startsWith('<?xml')) {
      errors.push('AppxManifest.xml does not start with XML declaration.');
    }
    if (!manifestContent.includes('<Package') || !manifestContent.includes('</Package>')) {
      errors.push('AppxManifest.xml is missing <Package> root element.');
    }
    if (!manifestContent.includes('<Identity') || !manifestContent.includes('<Properties>')) {
      errors.push('AppxManifest.xml is missing <Identity> or <Properties> tags.');
    }
    if (!manifestContent.includes('EntryPoint="Windows.FullTrustApplication"')) {
      errors.push('AppxManifest.xml must specify EntryPoint="Windows.FullTrustApplication" for Electron apps.');
    }
    if (!manifestContent.includes('runFullTrust')) {
      errors.push('AppxManifest.xml is missing "runFullTrust" capability.');
    }
    console.log('✓ AppxManifest.xml structure checks passed.');
  }

  // C. Verify assets
  const requiredAssets = [
    'StoreLogo.png',
    'Square44x44Logo.png',
    'Square150x150Logo.png',
    'Square310x310Logo.png',
    'Wide310x150Logo.png'
  ];
  if (!fs.existsSync(assetsDir)) {
    errors.push('Assets directory is missing.');
  } else {
    for (const asset of requiredAssets) {
      const assetPath = path.join(assetsDir, asset);
      if (!fs.existsSync(assetPath)) {
        errors.push(`Mandatory asset is missing: Assets/${asset}`);
      } else {
        const assetStats = fs.statSync(assetPath);
        if (assetStats.size === 0) {
          errors.push(`Asset is empty (0 bytes): Assets/${asset}`);
        }
      }
    }
    console.log('✓ All mandatory asset files exist and are valid.');
  }

  // D. Verify opening package using MakeAppx unpack (Windows SDK)
  const verifyUnpackDir = path.join(releaseDir, 'msix-verify-temp');
  if (fs.existsSync(verifyUnpackDir)) {
    fs.rmSync(verifyUnpackDir, { recursive: true, force: true });
  }
  fs.mkdirSync(verifyUnpackDir, { recursive: true });

  try {
    console.log('Verifying package readability using MakeAppx unpack...');
    execSync(`"${makeappxPath}" unpack /p "${outputMsixPath}" /d "${verifyUnpackDir}" /o`, { stdio: 'pipe' });
    
    const unpackedManifest = path.join(verifyUnpackDir, 'AppxManifest.xml');
    if (!fs.existsSync(unpackedManifest)) {
      errors.push('MakeAppx unpack succeeded but AppxManifest.xml was not found in the unpacked files.');
    } else {
      console.log('✓ MSIX package successfully verified by Windows SDK (MakeAppx unpack).');
    }
  } catch (err) {
    errors.push(`MakeAppx failed to unpack the built MSIX: ${err.message}`);
  } finally {
    if (fs.existsSync(verifyUnpackDir)) {
      fs.rmSync(verifyUnpackDir, { recursive: true, force: true });
    }
  }

  // E. Verify signature if signed
  if (signCert) {
    console.log('Verifying authenticode signature...');
    const signtoolPath = findSdkTool('signtool.exe');
    if (signtoolPath) {
      try {
        execSync(`"${signtoolPath}" verify /pa "${outputMsixPath}"`, { stdio: 'pipe' });
        console.log('✓ Authenticode signature verified successfully.');
      } catch (err) {
        errors.push(`MSIX signature verification failed: ${err.message}`);
      }
    } else {
      console.log('Warning: signtool.exe not found. Skipping signature verification.');
    }
  }

  return errors;
}

const verificationErrors = runVerification();
if (verificationErrors.length > 0) {
  console.error('\n=== Verification FAILED with the following errors: ===');
  for (const err of verificationErrors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

console.log('\n=== MSIX Build and Verification Successfully Completed! ===');
console.log(`MSIX Package created at: ${outputMsixPath}`);
