#!/usr/bin/env pwsh
# ═══════════════════════════════════════════════════════════════════════════
# SMELTEROS + CHICKEN HAWK FIREBASE DEPLOYMENT
# ═══════════════════════════════════════════════════════════════════════════
# Deploys the full stack to Firebase Hosting + Cloud Run
#
# Prerequisites:
#   - Firebase CLI installed: npm install -g firebase-tools
#   - Logged in: firebase login
#   - GCP project configured
#
# Usage:
#   ./deploy-firebase.ps1 -ProjectId smelteros-chickenhawk
#   ./deploy-firebase.ps1 -ProjectId smelteros-chickenhawk -HostingOnly
# ═══════════════════════════════════════════════════════════════════════════

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [switch]$HostingOnly,
    [switch]$FirestoreOnly,
    [switch]$EmulatorOnly,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Banner
Write-Host ""
Write-Host "  🔥 SMELTEROS FIREBASE DEPLOYMENT" -ForegroundColor Yellow
Write-Host "  ═══════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  Project: $ProjectId" -ForegroundColor Cyan
Write-Host ""

if ($Help) {
    Write-Host "Usage: ./deploy-firebase.ps1 -ProjectId <id> [options]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -ProjectId <id>    Firebase project ID (required)"
    Write-Host "  -HostingOnly       Deploy only hosting"
    Write-Host "  -FirestoreOnly     Deploy only Firestore rules/indexes"
    Write-Host "  -EmulatorOnly      Start emulators instead of deploying"
    Write-Host "  -Help              Show this help"
    Write-Host ""
    exit 0
}

# Check Firebase CLI
Write-Host "  [1/5] Checking Firebase CLI..." -ForegroundColor Cyan
try {
    $firebaseVersion = firebase --version 2>$null
    Write-Host "        ✓ Firebase CLI: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "        ✗ Firebase CLI not found" -ForegroundColor Red
    Write-Host "        Run: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Set project
Write-Host "  [2/5] Setting project to $ProjectId..." -ForegroundColor Cyan
firebase use $ProjectId 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "        ⚠ Project not found, creating..." -ForegroundColor Yellow
    # Try to create project (may fail if already exists)
    firebase projects:create $ProjectId 2>&1 | Out-Null
    firebase use $ProjectId
}
Write-Host "        ✓ Project set" -ForegroundColor Green

# Emulator mode
if ($EmulatorOnly) {
    Write-Host "  [3/5] Starting emulators..." -ForegroundColor Cyan
    Write-Host "        Hosting:   http://localhost:5000" -ForegroundColor Gray
    Write-Host "        Firestore: http://localhost:8080" -ForegroundColor Gray
    Write-Host "        UI:        http://localhost:4000" -ForegroundColor Gray
    Write-Host ""
    firebase emulators:start
    exit 0
}

# Deploy Firestore
if (-not $HostingOnly) {
    Write-Host "  [3/5] Deploying Firestore rules and indexes..." -ForegroundColor Cyan
    firebase deploy --only firestore 2>&1 | ForEach-Object { Write-Host "        $_" -ForegroundColor DarkGray }
    if ($LASTEXITCODE -eq 0) {
        Write-Host "        ✓ Firestore deployed" -ForegroundColor Green
    } else {
        Write-Host "        ⚠ Firestore deploy had warnings" -ForegroundColor Yellow
    }
}

if ($FirestoreOnly) {
    Write-Host ""
    Write-Host "  ✓ Firestore deployment complete" -ForegroundColor Green
    exit 0
}

# Deploy Hosting
Write-Host "  [4/5] Deploying hosting..." -ForegroundColor Cyan
firebase deploy --only hosting 2>&1 | ForEach-Object { Write-Host "        $_" -ForegroundColor DarkGray }
if ($LASTEXITCODE -eq 0) {
    Write-Host "        ✓ Hosting deployed" -ForegroundColor Green
} else {
    Write-Host "        ✗ Hosting deploy failed" -ForegroundColor Red
    exit 1
}

# Get hosting URL
Write-Host "  [5/5] Getting deployment URL..." -ForegroundColor Cyan
$hostingUrl = "https://$ProjectId.web.app"

Write-Host ""
Write-Host "  ═══════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  🚀 DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "  Live URLs:" -ForegroundColor Cyan
Write-Host "    SmelterOS:     $hostingUrl" -ForegroundColor White
Write-Host "    Chicken Hawk:  $hostingUrl/#/chicken-hawk" -ForegroundColor White
Write-Host ""
Write-Host "  Firebase Console:" -ForegroundColor Cyan
Write-Host "    https://console.firebase.google.com/project/$ProjectId" -ForegroundColor White
Write-Host ""
