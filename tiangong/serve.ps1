param([int]$Port = 8731, [string]$Root = '')

$ErrorActionPreference = 'Stop'
if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }
$Root = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $Root).Path)
$rootPrefix = $Root.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.map'  = 'application/json; charset=utf-8'
  '.txt'  = 'text/plain; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.webp' = 'image/webp'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.woff' = 'font/woff'
  '.woff2' = 'font/woff2'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
try { $listener.Start() }
catch {
  Write-Host "Cannot listen on port $Port. $($_.Exception.Message)"
  Read-Host 'Press Enter to close'
  exit 1
}
Write-Host "Serving $Root"
Write-Host "Open http://127.0.0.1:$Port/tiangong/index.html"
Write-Host 'Close this window to stop the server.'

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart([char]'/')
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'tiangong/index.html' }
    $full = [IO.Path]::GetFullPath((Join-Path $Root $rel))
    if (-not $full.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403
    }
    else {
      if (Test-Path -LiteralPath $full -PathType Container) { $full = Join-Path $full 'index.html' }
      if (Test-Path -LiteralPath $full -PathType Leaf) {
        $ext = [IO.Path]::GetExtension($full).ToLower()
        $ct = $mime[$ext]
        if (-not $ct) { $ct = 'application/octet-stream' }
        $bytes = [IO.File]::ReadAllBytes($full)
        $res.StatusCode = 200
        $res.ContentType = $ct
        $res.ContentLength64 = $bytes.Length
        $res.AddHeader('Cache-Control', 'no-store')
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      }
      else { $res.StatusCode = 404 }
    }
  }
  catch { try { $res.StatusCode = 500 } catch { } }
  finally { try { $res.Close() } catch { } }
}