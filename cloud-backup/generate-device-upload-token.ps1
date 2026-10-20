# Gloria backup: generate a private, high-entropy device token and public SHA256
# digest for Cloudflare. Secret never prints or leaves the owner's Windows PC.
# Windows PowerShell 5.1+ uses per-user DPAPI to protect the saved secret.
param([switch]$CopyToken)
$ErrorActionPreference = "Stop"
$folder = Join-Path $env:APPDATA "GloriaBackup"
$vault = Join-Path $folder "upload-token.dpapi"
if ($CopyToken) {
    if (-not (Test-Path $vault)) { throw "No Gloria device token saved on this Windows account." }
    $secure = (Get-Content -Raw -Path $vault).Trim() | ConvertTo-SecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        Set-Clipboard -Value ([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr))
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
    Write-Host "PRIVATE device token copied. Paste only into Gloria's private pairing screen."
    exit
}
if (Test-Path $vault) {
    Write-Host "Gloria device token already exists. NOT regenerated, so current access stays valid."
    Write-Host "To retrieve it, run this script with -CopyToken."
    exit
}
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
$token = [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+","-").Replace("/","_")
$sha = [System.Security.Cryptography.SHA256]::Create()
try {
    $digest = [BitConverter]::ToString(
        $sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($token))
    ).Replace("-", "").ToLowerInvariant()
} finally { $sha.Dispose() }
$secret = ConvertTo-SecureString -String $token -AsPlainText -Force
$secret | ConvertFrom-SecureString | Set-Content -Encoding ASCII -NoNewline -Path $vault
Set-Clipboard -Value $digest
Write-Host "SUCCESS: SHA256 digest copied to clipboard (not the secret token)."
Write-Host "In Cloudflare Worker Settings -> Variables and Secrets add:"
Write-Host "Type Secret, name BACKUP_TOKEN_SHA256, value PASTE YOUR CLIPBOARD."
Write-Host "PRIVATE token saved using Windows DPAPI at: $vault"
Write-Host "DO NOT screenshot/show the saved token or paste it in chat."
