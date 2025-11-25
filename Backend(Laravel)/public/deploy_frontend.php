<?php
$projectDir = '/var/www/html/erp_ginfo/frontend';
$logFile = '/var/www/html/erp_ginfo/api/public/deploy_frontend.log';
$sshKey = '/var/www/html/zellisau';

// Logging function
function logLine($message) {
    global $logFile;
    $time = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$time] $message\n", FILE_APPEND);
}

logLine("========== Starting Frontend Deploy ==========");
logLine("Changing directory to $projectDir");

// Go to project directory
if (!chdir($projectDir)) {
    logLine("ERROR: Could not change directory to $projectDir");
    exit(1);
}

// --- Set Git safe directory locally (no global config) ---
exec("git config --file $projectDir/.git/config --add safe.directory $projectDir 2>&1", $output, $status);
logLine("Git safe.directory:\n" . implode("\n", $output));
if ($status !== 0) {
    logLine("ERROR: Setting Git safe.directory failed with status $status");
    exit(1);
}

// --- Pull latest code using SSH key explicitly ---
$gitFetch = "GIT_SSH_COMMAND='ssh -i $sshKey -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no' git fetch origin 2>&1";
exec($gitFetch, $output, $status);
logLine("Git fetch:\n" . implode("\n", $output));
if ($status !== 0) {
    logLine("ERROR: Git fetch failed with status $status");
    exit(1);
}

$gitReset = "GIT_SSH_COMMAND='ssh -i $sshKey -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no' git reset --hard origin/main 2>&1";
exec($gitReset, $output, $status);
logLine("Git reset hard:\n" . implode("\n", $output));
if ($status !== 0) {
    logLine("ERROR: Git reset failed with status $status");
    exit(1);
}

// // --- Optional: Install dependencies (npm/yarn) ---
// $npmInstall = "npm install --legacy-peer-deps 2>&1";
// exec($npmInstall, $output, $status);
// logLine("NPM install:\n" . implode("\n", $output));
// if ($status !== 0) {
//     logLine("ERROR: NPM install failed with status $status");
//     exit(1);
// }

// // --- Optional: Build frontend ---
// $npmBuild = "npm run build 2>&1";
// exec($npmBuild, $output, $status);
// logLine("NPM build:\n" . implode("\n", $output));
// if ($status !== 0) {
//     logLine("ERROR: NPM build failed with status $status");
//     exit(1);
// }

// --- Set permissions ---
exec("chown -R www-data:www-data $projectDir 2>&1", $output, $status);
exec("chmod -R 775 $projectDir 2>&1", $output, $status);

logLine("Frontend deploy finished successfully at " . date('Y-m-d H:i:s'));
logLine("====================================\n");
