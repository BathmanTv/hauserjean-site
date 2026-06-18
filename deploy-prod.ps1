# Deploy website-v2/dist (React build) to OVH /www - production hauserjean.fr.
# Reuses FTP credentials from ../website/deploy-ovh.config.ps1 (gitignored).
# Usage: powershell -ExecutionPolicy Bypass -File .\deploy-prod.ps1 [-DryRun]
param([switch]$DryRun)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$dist = Join-Path $root 'dist'
if (-not (Test-Path $dist)) { Write-Host "X dist/ missing - run npm run build first." -ForegroundColor Red; exit 1 }

$configPath = Join-Path (Split-Path $root -Parent) 'website\deploy-ovh.config.ps1'
if (-not (Test-Path $configPath)) { Write-Host "X config not found: $configPath" -ForegroundColor Red; exit 1 }
. $configPath

$files = Get-ChildItem $dist -Recurse -File
$cnt = $files.Count
Write-Host ""
Write-Host "Deploy v2 to ftp://$FtpHost$RemoteRoot - $cnt files" -ForegroundColor Cyan
Write-Host ""
if ($DryRun) {
  foreach ($f in $files) { Write-Host ("  [dry] " + $f.FullName.Substring($dist.Length).TrimStart('\').Replace('\','/')) }
  exit 0
}

$cred = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
$made = @{}
function Ensure($d) {
  if ([string]::IsNullOrEmpty($d) -or $made.ContainsKey($d)) { return }
  $p = ($d -replace '/[^/]+$', '')
  if ($p -ne $d) { Ensure $p }
  try {
    $r = [System.Net.FtpWebRequest]::Create("ftp://$FtpHost$d")
    $r.Credentials = $cred; $r.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    $r.EnableSsl = $UseSsl; $r.UsePassive = $true; $r.GetResponse().Close()
  } catch {}
  $made[$d] = $true
}

$n = 0
foreach ($f in $files) {
  $rel = $f.FullName.Substring($dist.Length).TrimStart('\').Replace('\', '/')
  $remote = "$RemoteRoot/$rel"
  $dir = ($remote -replace '/[^/]+$', '')
  Ensure $dir
  try {
    $r = [System.Net.FtpWebRequest]::Create("ftp://$FtpHost$remote")
    $r.Credentials = $cred; $r.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $r.EnableSsl = $UseSsl; $r.UsePassive = $true; $r.UseBinary = $true
    $b = [System.IO.File]::ReadAllBytes($f.FullName); $r.ContentLength = $b.Length
    $s = $r.GetRequestStream(); $s.Write($b, 0, $b.Length); $s.Close(); $r.GetResponse().Close()
    $n++; Write-Host "  OK  $rel" -ForegroundColor DarkGray
  } catch {
    Write-Host "  FAIL $rel -> $($_.Exception.Message)" -ForegroundColor Red
  }
}
Write-Host ""
Write-Host "Done. $n of $cnt files uploaded to $RemoteRoot" -ForegroundColor Green
Write-Host "Verify: https://hauserjean.fr" -ForegroundColor Green
