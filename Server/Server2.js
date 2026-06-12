const os = require("os");
const fs = require("fs");
const path = require("path");
const http = require("http");
const jsonConfigrationData = require("./Configuration.json");
const accessKey = jsonConfigrationData['Key'].replaceAll(".png", ".p&ng").replaceAll("-", "%&%2%");
const PORT = jsonConfigrationData['PORT'];
const screenshotLastShotFullPath = jsonConfigrationData['LastShotPath'];
const screenshotLastShotFullPath2 = jsonConfigrationData['LastShotPath2'];
const serverOutputsfilePath = jsonConfigrationData['ServerOutputsPath'];
const otherSeverScriptRunnerPath = jsonConfigrationData['OtherServerRunnerScriptPath'];
const nircmdPath = jsonConfigrationData['NircmdPath'];
const screenshotCompressionValue = jsonConfigrationData['ImageCompressionValue']
let server;

const { exec } = require("child_process");
const { Server } = require("net");
const { rejects } = require("assert");
const { error } = require("console");

function clearShotsAndTempFiles(){
    fs.readdirSync(screenshotLastShotFullPath).forEach((file) => {
        if (path.extname(file) === ".png" && path.basename(file, '.png').length == 8) {
            let filepath = path.join(screenshotLastShotFullPath, file);

            // Be carefull here
            fs.unlinkSync(filepath);

            console.log("Removing " + path.basename(file) + "...");
        }
    });

    fs.readdirSync(__dirname).forEach((file) => {
        if (path.basename(file) === "RPCError82737257.vbs" ) {
            let filepath = path.join(__dirname + "/", file);

            // Be carefull here
            fs.unlinkSync(filepath);

            console.log("Removing " + path.basename(file) + "...");
        }
    });
}

function getDiskUsage() {
    const disks = [];

    const drives = getWindowsDrives();
    
    for (const drive of drives) {
        try {
            const stats = fs.statfsSync ? fs.statfsSync(drive) : null;
            if (stats) {
                const total = stats.blocks * stats.bsize;
                const free = stats.bfree * stats.bsize;
                const used = total - free;
                const percentage = ((used / total) * 100).toFixed(2);
                
                disks.push({
                    drive: drive,
                    total: total,
                    used: used,
                    free: free,
                    percentage: percentage
                });
            } else {
                disks.push(getDiskInfoFallback(drive));
            }
        } catch (error) {
            console.error(`Error while reading disk: ${drive}`, error.message);
        }
    }
    
    return disks;
}

function waitForFileExists(filepath, timeout = 5000){
return new Promise((resolve, reject) => {
const start = Date.now();

function check(){
    if (fs.existsSync(filepath)){
        resolve(true);
    } else if (Date.now() - start > timeout) {
        reject(new Error(`Timeout waiting for file ${filepath}`));
    } else {
        setTimeout(check, 100);
    }
}

check();
});
}

function getWindowsDrives() {
    const drives = [];
    for (let i = 65; i <= 90; i++) {  
        const drive = String.fromCharCode(i) + ':\\';
        try {
            if (fs.existsSync(drive)) {
                drives.push(drive);
            }
        } catch (error) {
            // Ignore errors 
        }
    }
    return drives;
}


function getDiskInfoFallback(drive) {
    try {
        const { execSync } = require('child_process');
        let command, regex;
        
        if (os.platform() === 'win32') {
            command = `wmic logicaldisk where "DeviceID='${drive.substring(0, 2)}'" get Size,FreeSpace`;
            regex = /(\d+)\s+(\d+)/;
        } else {
            command = `df -k ${drive} | tail -1`;
            regex = /\S+\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+%)/;
        }
        
        const output = execSync(command, { encoding: 'utf8' });
        const match = output.match(regex);
        
        if (match) {
            let total, free;

            free = parseInt(match[2]);
            total = parseInt(match[1]);
        
            const used = total - free;
            const percentage = ((used / total) * 100).toFixed(2);
            
            return {
                drive: drive,
                total: total,
                used: used,
                free: free,
                percentage: percentage
            };
        }
    } catch (error) {
        console.error(`Error while getting data from disk: ${drive}`, error.message);
    }
    
    const total = 100 * 1024 * 1024 * 1024; 
    const used = Math.floor(Math.random() * 80 * 1024 * 1024 * 1024); 
    const free = total - used;
    const percentage = ((used / total) * 100).toFixed(2);
    
    return {
        drive: drive,
        total: total,
        used: used,
        free: free,
        percentage: percentage
    };
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function displayDiskUsage() {
    let inf = ""

    const disks = getDiskUsage();
    
    if (disks.length === 0) {
        console.log('Cannot find any disk');
        return;
    }
    
    disks.forEach(disk => {        
        const barLength = 20;
        const usedLength = Math.round((disk.percentage / 100) * barLength);
        const freeLength = barLength - usedLength;
        
        const usedBar = '█'.repeat(usedLength);
        const freeBar = '░'.repeat(freeLength);

        inf += `Disk: ${disk.drive}\nTotal size: ${formatBytes(disk.total)}\nUsage: ${formatBytes(disk.used)} | ${disk.percentage}%\nFree space: ${formatBytes(disk.free)}\nProgress bar: [${usedBar}${freeBar}] ${disk.percentage}%\n\n`;
    });

    return inf;
}

let previousCpuMeasurements = null;
let isFirstMeasurement = true;
function getSystemResourcesUsage(){
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePrecentage = ((usedMem / totalMem) * 100).toFixed(2);

    const cpus = os.cpus();

 let currentMeasurements = {
        total: 0,
        idle: 0
    };

   cpus.forEach(cpu => {
        currentMeasurements.idle += cpu.times.idle;
        for (let type in cpu.times) {
            currentMeasurements.total += cpu.times[type];
        }
    });

    if (isFirstMeasurement) {
        previousCpuMeasurements = currentMeasurements;
        isFirstMeasurement = false;
    }

    const totalDiff = currentMeasurements.total - previousCpuMeasurements.total;
    const idleDiff = currentMeasurements.idle - previousCpuMeasurements.idle;

    if (totalDiff === 0 || idleDiff === 0) {
        previousCpuMeasurements = currentMeasurements;
    }

    const totalCpuUage = ((1 - idleDiff / totalDiff) * 100).toFixed(2);
    
    previousCpuMeasurements = currentMeasurements;

    return `RAM Usage: ${memUsagePrecentage}% | ${bytesToMB(usedMem)} MB / ${bytesToMB(totalMem)} MB\n\nCPU Usage: ${totalCpuUage}%\n\n${displayDiskUsage()}`
}

function shutdown(){
const cmd = `shutdown /s /t 0 /f`;

console.log('Running: ', cmd);

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
    } else {
        console.log("Command sent successfully");
    }
});
}

function restart(){
const cmd = `shutdown /r /t 0 /f`;

console.log('Running: ', cmd);

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
    } else {
        console.log("Command sent successfully");
    }
});
}

function signout(){
const cmd = `shutdown /l`;

console.log('Running: ', cmd);

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
    } else {
        console.log("Command sent successfully");
    }
});
}

function sleep(){
const cmd = `powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState('Suspend', $false, $false)"`;

console.log('Running: ', cmd);

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
    } else {
        console.log("Command sent successfully");
    }
});
}

function closeallapps(){
const cmd = `powershell "Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.ProcessName -ne 'explorer' } | ForEach-Object { $_.CloseMainWindow() | Out-Null }"`;

console.log('Running: ', cmd);

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
    } else {
        console.log("Command sent successfully");
    }
});
}

function screenshot(){
const ranName = Math.floor(Math.random() * 100000000).toString().padStart(8, '0') + ".png";
const cmd = `"${nircmdPath}" savescreenshotfull "${screenshotLastShotFullPath}${ranName}"`;
const cmd2 = `powershell -command "Add-Type -AssemblyName System.Drawing; $img = [Drawing.Image]::FromFile('${screenshotLastShotFullPath}${ranName}'); $newWidth = [int]($img.Width * ${screenshotCompressionValue}); $newHeight = [int]($img.Height * ${screenshotCompressionValue}); $newImg = New-Object Drawing.Bitmap($newWidth, $newHeight); $graphics = [Drawing.Graphics]::FromImage($newImg); $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight); $img.Dispose(); $newImg.Save('${screenshotLastShotFullPath}${ranName}', [Drawing.Imaging.ImageFormat]::Png); $newImg.Dispose(); $graphics.Dispose()"`;

console.log('Running: ', cmd);

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");

        return 'Unexpected error';
    } else {
        console.log("Command sent successfully");
    }
});

console.log('Running 2: ', cmd2);
exec(cmd2, (error, stdout, stderr) => {
    if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");

        return 'Unexpected error';
    } else {
        console.log("Second Command sent successfully");
    }
});

return `${screenshotLastShotFullPath2}${ranName}`;
}

function sendmessage(msg){
const cmd = `msg ${os.userInfo().username} "${msg.replaceAll("%20", " ").replaceAll("*032856252659660*", "%20")}"`;

console.log('Running: ', cmd);

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
    } else {
        console.log("Command sent successfully");
    }
});
}

function runProg(progpath){
console.log('Running: ', progpath.replaceAll("%20", " ").replaceAll("/", "\\").replaceAll("*0*", "%20"));

exec(`"${progpath.replaceAll('%20', ' ').replaceAll('/', '\\').replaceAll("*0*", "%20")}"`, (error, stdout, stderr) => {
    if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
    } else {
        console.log("Command sent successfully");
    }
});
}

function senderror(err){
const cmd = `echo x=msgbox("${err.replaceAll("%20", " ").replaceAll("*032856252659660*", "%20")}", 16, "Error") > RPCError82737257.vbs && RPCError82737257.vbs && del RPCError82737257.vbs`;

console.log('Running: ', cmd);

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
    } else {
        console.log("Command sent successfully");
    }
});
}


function startServer(){
 fs.writeFileSync(serverOutputsfilePath, "");
 clearShotsAndTempFiles();

 server = http.createServer(async (req, res) => {
    if (req.url === "/"){
        console.log("+1 New visit...");
        fs.readFile(path.join(__dirname, "Web/index.html"), (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/html; charest=utf-8" });
                res.end("<h1>Error while loading page!</h1>");
            }else{
                res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
                res.end(data);
            }
        });
    } else if (req.url === "/Web/style.css"){
        fs.readFile(path.join(__dirname, "Web/style.css"), (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/css; charest=utf-8" });
                res.end("<h1>Error while loading page!</h1>");
            }else{
                res.writeHead(200, { "Content-Type": "text/css; charest=utf-8" });
                res.end(data);
            }
        });
    } else if (req.url.split("?")[0].endsWith(".png") && !req.url.startsWith("/downloadfile")){
        console.log(`Sending image ${req.url}...`);

        if (req.url.includes("?")){
        await waitForFileExists(path.join(__dirname, req.url.split("?")[0]), 3000);
        }else{
        await waitForFileExists(path.join(__dirname, req.url), 3000);
        }
        try{
        let imagePath = path.join(__dirname, req.url);

        if (req.url.includes("?")){
            imagePath = path.join(__dirname, req.url.split("?")[0]);
        }

        const stats = fs.statSync(imagePath);
        const fileSize = stats.size;

        res.writeHead(200, {
            "Content-Type": "image/png",
            "Content-Length": fileSize,
            "Cache-Control": "no-cache",
            "Connection": "Keep-alive"
        });

        const readStream = fs.createReadStream(imagePath);

        readStream.on('error', (error) => {
            console.error("Error while loading image ", error);
            
            if (!res.headersSent) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Error while loading image!");
            }
        });

        let bytesSent = 0;
        readStream.on('data', (chunk) => {
            bytesSent += chunk.length;
        });

        readStream.on('end', () =>{
            console.log(`The image ${req.url} has been sent successfully`);
            res.end();
        });

        readStream.pipe(res);

        req.on('close', () => {
            if (bytesSent < fileSize){
                console.log("The connection has been closed - readStream - sending image");
                readStream.destroy();
            }
        })
        } catch (err) {
            console.error("Error while sending image " + err);

                if (!res.headersSent) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Server error!");
            }
        }
    } else if (req.url.startsWith("/downloadfile") && !req.url.split("?")[0].endsWith(".png")){
        console.log(`Sending file ${req.url.replaceAll("*0*", "%20")}...`);

        let filePath = req.url.split("-").slice(2).join("-"); 

        filePath = filePath.replaceAll("%20", " ").replaceAll("*0*", "%20");
        filePath = filePath.replaceAll("/", "\\");

        let key = req.url.split("-")[1];

        if (key == accessKey){

            await waitForFileExists(filePath, 3000);
    try{
        const filePath2 = filePath;

        const stats = fs.statSync(filePath2);
        const fileSize = stats.size;

        res.writeHead(200);

        const readStream = fs.createReadStream(filePath2);

        readStream.on('error', (error) => {
            console.error("Error while loading file ", error);
            
            if (!res.headersSent) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Error while loading file!");
            }
        });

        let bytesSent = 0;
        readStream.on('data', (chunk) => {
            bytesSent += chunk.length;
        });

        readStream.on('end', () =>{
            console.log(`The file ${filePath} has been sent successfully`);
            res.end();
        });

        readStream.pipe(res);

        req.on('close', () => {
            if (bytesSent < fileSize){
                console.log("The connection has been closed - readStream - sending file");
                readStream.destroy();
            }
        })
        } catch (err) {
            console.error("Error while sending file " + err);

                if (!res.headersSent) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Server error!");
            }
        }
        }else{
            res.writeHead(500, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
       
    } else if (req.url.startsWith("/shutdownpc")){
        let key = req.url.split("-")[1]
        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>Shutdownninig PC...</h1>");
            console.log("Shutdownninig PC...");

            server.close();
            shutdown();
        } else {
            res.writeHead(500, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
    } else if (req.url.startsWith("/closeallapps")){
        let key = req.url.split("-")[1]
        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>Closing apps...</h1>");
            console.log("Closing apps...");

            closeallapps();
        } else {
            res.writeHead(500, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
    } else if (req.url.startsWith("/signoutpc")){
        let key = req.url.split("-")[1]
        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>Signing out PC...</h1>");
            console.log("Signing out PC...");

            signout();
        } else {
            res.writeHead(500, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
    } else if (req.url.startsWith("/sleeppc")){
        let key = req.url.split("-")[1]
        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>Sleeping PC...</h1>");
            console.log("Sleeping PC...");

            sleep();
        } else {
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
    } else if (req.url.startsWith("/reqscreenshot")){
        let key = req.url.split("-")[1]
        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/plain; charest=utf-8" });
            console.log("Requesting screenshot...");

            res.end(screenshot());
        } else {
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
    } else if (req.url.startsWith("/shutdownserver")){
        let key = req.url.split("-")[1]
        if (key == accessKey){
            res.end("Shutdowning server...");
            process.exit(0);
        } else {
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
    } else if (req.url.startsWith("/restartpc")){
        let key = req.url.split("-")[1]
        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>Restarting PC...</h1>");
            console.log("Restarting PC...");

            restart();
        } else {
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
    } else if (req.url.startsWith("/reqkey")){
        let key = req.url.split("-")[1]
        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/plain; charest=utf-8" });
            res.end("Right");
        } else {
            res.writeHead(200, { "Content-Type": "text/plain; charest=utf-8" });
            res.end("Wrong");
        }
    } else if (req.url === "/requsrname"){
        console.log('Requesting PC Username...', );
        res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
        res.end(os.userInfo().username);
    } else if (req.url.startsWith("/sendmessage")){
        let key = req.url.split("-")[req.url.split("-").length - 1];
        let msg = getValueBArray(req.url.split("-"));

        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>Sending message...</h1>");
            console.log("Sending message...");

            sendmessage(msg);
        } else {
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
    } else if (req.url.startsWith("/speaktext")){
        let key = req.url.split("-")[req.url.split("-").length - 1];
        let text = getValueBArray(req.url.split("-"));

        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });

            const cmdLine = `"${nircmdPath}" speak text "${text.replaceAll("%20", " ").replaceAll("*032856252659660*", "%20")}" -2 100`;

        console.log('Running: ', cmdLine);

    exec(cmdLine, (error, stdout, stderr) => {
        if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");

        } else {
           res.end(stdout.slice(2));
           console.log("Command sent successfully");
        }
    });
        } else {
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
    } else if (req.url === "/sysinfo"){
        res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
        const cmdLine = `systeminfo`;

        console.log('Running: ', cmdLine);

    exec(cmdLine, (error, stdout, stderr) => {
        if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");

        } else {
           res.end(stdout.slice(2));
           console.log("Command sent successfully");
        }
    });
       
    } else if (req.url.startsWith("/playbeeb")){
        res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
        const cmdLine = `"${nircmdPath}" stdbeep`;

        console.log('Running: ', cmdLine);

    exec(cmdLine, (error, stdout, stderr) => {
        if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");

        } else {
           res.end(stdout.slice(2));
           console.log("Command sent successfully");
        }
    });
    } else if (req.url === "/cpuinfo"){
        res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
        const cmdLine = `wmic cpu list full`;

        console.log('Running: ', cmdLine);

    exec(cmdLine, (error, stdout, stderr) => {
        if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
       
    } else {
        res.end(stdout.slice(6));
        console.log("Command sent successfully");
    }
    });

    } else if (req.url === "/gpuinfo"){
        res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
        const cmdLine = `wmic path win32_videocontroller get /format:list`;

        console.log('Running: ', cmdLine);

    exec(cmdLine, (error, stdout, stderr) => {
        if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
       
    } else {
        res.end(stdout.slice(6));
        console.log("Command sent successfully");
    }
    });

    } else if (req.url === "/getoutpus"){
        res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
        
        let ServerOutPutsText = fs.readFileSync(serverOutputsfilePath, 'utf-8');
        res.end(ServerOutPutsText)
    } else if (req.url === "/getResUsage"){
        res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
        res.end(getSystemResourcesUsage());
    }  else if (req.url === "/health-check"){
        res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
        res.end("Everything is okay!");
    } else if (req.url === "/disksinfo"){
        res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
        const cmdLine = `wmic logicaldisk list full`;

        console.log('Running: ', cmdLine);

    exec(cmdLine, (error, stdout, stderr) => {
        if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
       
    } else {
        res.end(stdout.slice(6));
        console.log("Command sent successfully");
    }
    });

    } else if (req.url === "/driversinfo"){
        res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
        const cmdLine = `driverquery /v`;

        console.log('Running: ', cmdLine);

    exec(cmdLine, (error, stdout, stderr) => {
        if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
       
    } else {
        res.end(stdout.slice(2));
        console.log("Command sent successfully");
    }
    });

    } else if (req.url === "/openedapps"){
        res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
        const cmdLine = `powershell -command "Get-Process | Where-Object {$_.MainWindowTitle -ne '' } | Select-Object Id, ProcessName, MainWindowTitle"`;

    exec(cmdLine, (error, stdout, stderr) => {
        if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Unexpected error");
       
    } else {
        res.end(stdout.slice(2));
    }
    });

    } else if (req.url.startsWith("/senderror")){
        let key = req.url.split("-")[req.url.split("-").length - 1];
        let err = getValueBArray(req.url.split("-"));

        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>Sending error...</h1>");
            console.log("Sending error...");

            senderror(err);
        } else {
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
    } else if (req.url.startsWith("/restartserver")){
        let key = req.url.split("-")[1]

        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>Restarting server...</h1>");
            console.log("Restarting server...");

             const cmdLine = `"${otherSeverScriptRunnerPath.replaceAll('/', '\\')}"`;


    exec(cmdLine, (error, stdout, stderr) => {
        if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Path not found");
    } else {
        res.end(stdout);
        console.log("Command sent successfully");
        process.exit(0);
    }
    });
            
        } else {
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
    } else if (req.url.startsWith("/runprogram")){
        let key = req.url.split("-")[req.url.split("-").length - 1];
        let progPath = getValueBArray(req.url.split("-"));

        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>Starting a program...</h1>");
            console.log("Starting a program...");

            runProg(progPath);
        } else {
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            res.end("<h1>This is a wrong key!</h1>");
            console.log(`Wrong key entered: ${key}`);
        }
    } else if (req.url.startsWith("/1expfls")){
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            console.log("Getting data...");

         const cmdLine = `dir \\`;

        console.log('Running: ', cmdLine);

    exec(cmdLine, (error, stdout, stderr) => {
        if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Path not found");
    } else {
        res.end(stdout);
        console.log("Command sent successfully");
    }
    });
    } else if (req.url.startsWith("/expfls")){
        let key = req.url.split("-")[req.url.split("-").length - 1];
        let path = getValueBArray(req.url.split("-"));

        path = path.replaceAll("%20", " ").replaceAll("*0*", "%20");
        path = path.replaceAll("/", "\\");

        if (key == accessKey){
            res.writeHead(200, { "Content-Type": "text/plain; charest=utf-8" });
            console.log("Getting data...");

 const cmdLine = `dir "${path}"`;

        console.log('Running: ', cmdLine);

    exec(cmdLine, (error, stdout, stderr) => {
        if (error) {
        console.log("Failed: ", error.message);
        console.error("stderr: ", stderr);
        res.end("Path not found");
    } else {
        res.end(stdout);
        console.log("Command sent successfully");
    }
    });
        } else {
            res.writeHead(200, { "Content-Type": "text/html; charest=utf-8" });
            console.log(`Wrong key entered: ${key}`);
        }
    } else {
        res.writeHead(404, { "Content-Type": "text/html; charest=utf-8" });
        res.end("<h1>Not found!</h1>");
    }
});

server.listen(PORT, () => {
    console.log(`The server is running at: http://${getLOcalIP()}:${PORT} or http://localhost:${PORT}`);
});

}

startServer();

function getLOcalIP(){
    const interfaces = os.networkInterfaces();

    for (let name in interfaces){
        for (let net of interfaces[name]){
            if (net.family === "IPv4" && !net.internal) {
                return net.address;
            }
        }
    }
    return "IP not found!";
} 

process.on("uncaughtException", (err) => {
console.error("UncaughtExceptionError: ", err);
});

process.on("unhandledRejection", (reason) => {
console.error("UnhandledRejectionError: ", reason);
});

function getValueBArray(arr){
if (arr.length < 2) return '';

const valueBetween = arr.slice(1, -1);
return valueBetween.join('-');
}

function bytesToMB(byets){
    return (byets / (1024 * 1024)).toFixed(2);
}

const orclog = console.log;

console.log = function (...args){
    let ServerOutPutsText = fs.readFileSync(serverOutputsfilePath, 'utf-8');

    if (ServerOutPutsText.replaceAll(" ", "") == ""){
        let currTime = new Date()

        hour = String(currTime.getHours()).padStart(2, '0');
        min = String(currTime.getMinutes()).padStart(2, '0');
        sec = String(currTime.getSeconds()).padStart(2, '0');

        fs.writeFileSync(serverOutputsfilePath, `${hour}:${min}:${sec} ${args.join("")}`);

        orclog(...args);
    }else{
        let currTime = new Date()

        hour = String(currTime.getHours()).padStart(2, '0');
        min = String(currTime.getMinutes()).padStart(2, '0');
        sec = String(currTime.getSeconds()).padStart(2, '0');

        fs.writeFileSync(serverOutputsfilePath, `${ServerOutPutsText}\n${hour}:${min}:${sec} ${args.join("")}`);

        orclog(...args);
    }
}

const orcerr = console.error;

console.error = function (...args){
    let ServerOutPutsText = fs.readFileSync(serverOutputsfilePath, 'utf-8');

    if (ServerOutPutsText.replaceAll(" ", "") == ""){
        let currTime = new Date()

        hour = String(currTime.getHours()).padStart(2, '0');
        min = String(currTime.getMinutes()).padStart(2, '0');
        sec = String(currTime.getSeconds()).padStart(2, '0');

        fs.writeFileSync(serverOutputsfilePath, `${ServerOutPutsText}\n${hour}:${min}:${sec} ${args.join("")}`);
        
        orcerr(...args);
    }else{
        let currTime = new Date()

        hour = String(currTime.getHours()).padStart(2, '0');
        min = String(currTime.getMinutes()).padStart(2, '0');
        sec = String(currTime.getSeconds()).padStart(2, '0');

        fs.writeFileSync(serverOutputsfilePath, `${ServerOutPutsText}\n${hour}:${min}:${sec} ${args.join("")}`);

        orcerr(...args);
    }
}