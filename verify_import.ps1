# Step 1: Login and get access token
Write-Host "Step 1: Logging in as admin@test.com..."
$loginBody = @{
    email = "admin@test.com"
    password = "AdminPass123!"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    $loginResponse = Invoke-RestMethod -Uri "https://onlymarket-app-production.up.railway.app/api/v1/auth/login" -Method Post -Body $loginBody -Headers $headers
    $accessToken = $loginResponse.accessToken
    Write-Host "Login successful. Token obtained: $($accessToken.Substring(0, [Math]::Min(20, $accessToken.Length)))..."
} catch {
    Write-Host "Login failed: $_"
    exit 1
}

# Step 2: Call admin import endpoint
Write-Host "`nStep 2: Calling admin import endpoint..."
$authHeader = "Bearer $accessToken"

$importHeaders = @{
    "Authorization" = $authHeader
    "Content-Type" = "application/json"
}

try {
    $importResponse = Invoke-RestMethod -Uri "https://onlymarket-app-production.up.railway.app/api/v1/admin/products/import" -Method Post -Headers $importHeaders
    Write-Host "Import response type: $($importResponse.GetType().Name)"
    Write-Host "Import response: $importResponse"
    
    # The response might be a plain string (job ID) or an object with jobId property
    if ($importResponse -is [string]) {
        $jobId = $importResponse
    } else {
        $jobId = $importResponse.jobId
    }
    
    if ([string]::IsNullOrEmpty($jobId)) {
        Write-Host "ERROR: Job ID is null or empty!"
        exit 1
    }
    Write-Host "Import started. Job ID: $jobId"
} catch {
    Write-Host "Import failed: $_"
    exit 1
}

# Step 3: Poll job until COMPLETED
Write-Host "`nStep 3: Polling job status..."
$maxAttempts = 60
$attempt = 0
$jobStatus = ""

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Seconds 2
    try {
        $jobStatusResponse = Invoke-RestMethod -Uri "https://onlymarket-app-production.up.railway.app/api/v1/admin/products/import/$jobId/status" -Method Get -Headers $importHeaders
        Write-Host "Attempt $($attempt + 1): Full response = $jobStatusResponse"
        
        # Parse the pipe-delimited response: STATUS|PERCENTAGE|MESSAGE
        $parts = $jobStatusResponse -split '\|'
        if ($parts.Length -ge 1) {
            $jobStatus = $parts[0].Trim()
        }
        
        Write-Host "Attempt $($attempt + 1): Status = $jobStatus"
        
        if ($jobStatus -eq "COMPLETED") {
            Write-Host "Job completed successfully!"
            if ($parts.Length -ge 3) {
                Write-Host "Details: $($parts[2])"
            }
            break
        } elseif ($jobStatus -eq "FAILED") {
            Write-Host "Job failed!"
            exit 1
        }
    } catch {
        Write-Host "Error polling job status: $_"
    }
    
    $attempt++
}

if ($jobStatus -ne "COMPLETED") {
    Write-Host "Job did not complete within timeout"
    exit 1
}

