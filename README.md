
# NA-PCManager64

A flexible software that allows you to control your PC remotely via a local server on your PC using any other connected device to the same Wi-Fi as your PC.

## Architecture

```text
NA-PCManager64/
│
├── Server/
│   │
│   ├── Nircmdx64/
│   │   ├── NirCmd.chm                # NirCmd documentation
│   │   ├── nircmd.exe                # NirCmd executable
│   │   └── nircmdc.exe               # Command-line version of NirCmd
│   │
│   ├── Web/
│   │   │
│   │   ├── LastScreenshot/
│   │   │   └── README.txt            # README file for LastScreenshot/ 
│   │   │
│   │   ├── index.html                # Web interface
│   │   └── style.css                 # Web interface styles
│   │
│   ├── Configuration.json            # Server configuration settings
│   ├── README.txt                    # Server documentation
│   ├── Server.js                     # Main server implementation
│   ├── Server2.js                    # Secondary server implementation
│   ├── ServerOutputs.txt             # Server logs / outputs
│   ├── StartPCManagerJSServer.vbs    # Starts Server.js
│   └── StartPCManagerJSServer2.vbs   # Starts Server2.js
│
├── app_version.txt                   # Application version information
├── Icon.ico                          # Application icon
├── NA-PCManager64.py                 # Main Python application
├── NA-PCManager64.rar                # Archived project package
├── node-v22.11.0-x64.msi             # Node.js installer dependency
└── README.md                         # Project documentation
```

## Instructions for normal user

To download the software, download the `exe_program.rar` file and extract it
<br>
Then you can use it as an ordinary exe program.
<br>
Note that this works for `Windows 10+ 64-bit`.

<img width="297" height="83" alt="files" src="https://github.com/user-attachments/assets/bba3c3e9-84a0-407d-8279-a159653e2e4a" />

## Version
- Current version: 1.7.0

## Software's User interface
When you open the software, you are going to see this interface:

<img width="271" height="130" alt="serverclosed" src="https://github.com/user-attachments/assets/e94602fc-8c18-4646-b0b3-93d575355feb" />

<img width="271" height="130" alt="serverrunning" src="https://github.com/user-attachments/assets/52f6c97f-6efa-40c5-9d5f-dbd3e6f68cfc" />

- On top, there is a **server status** text label, it tells you whether the server is running or not and also shows you the URL of the web-application.
- Then, there is a section where it shows you 4 options:

1. **Server port**, you can choose the port that the server uses, make sure that this port is not used by any other service, default is 3000.
2. **Server access key**, you can make your own access key for the web-application, every device that visits the web-application is asked for access key in order to have access to the full web-application, default is admin.
3. **Server images quality**, in the web-application, you can choose the quality percentage of every image shown, default is 0.7.
4. **Run the server on every Windows startup**, toggling this option on will start the sever on Windows startup automatically for you, keep in mind that the server doesn't need the program to be opened in order to be running. default is ON. 

- Then, there is the buttons section where it shows you 5 buttons:

1. **Start server**, this button starts hosting the server locally on your machine using the port that you chose earlier.
2. **Stop server**, this button sends a request to the server to shut down.
3. **Save changes**, every change you make in any option won't be saved unless you click this button.
4. **Open website**, clicking this button will open the web-application automatically for you.
5. **Open server outputs**, clicking this button will open a new window where it shows you the server outputs.

<img width="960" height="519" alt="outputs" src="https://github.com/user-attachments/assets/8bc93065-ab5d-474e-92ba-8c478e9f6c00" />

- Then, in the bottom section, There is a status text label that tells you what is happening right now in terms of fetching server status or saving changes, etc.

## Web-Application's user interface
When you open the web-application, you are going to encounter this interface:

<img width="958" height="362" alt="webinterface1" src="https://github.com/user-attachments/assets/c4b34b10-2384-401b-83d0-05332d87bf23" />

<img width="960" height="282" alt="webinterface2" src="https://github.com/user-attachments/assets/fecfbd7b-8aac-4a2f-acec-ca4054c6a645" />

<img width="960" height="414" alt="web interface3" src="https://github.com/user-attachments/assets/c0639708-3eb2-43c2-8f3c-c7f004049f2c" />

- First thing you see when you open the web-application is an entry that asks you for the server access key, you need to enter the right access key in order to continue.
- Then - if you entered the right access key - you will see a bunch of boxes, every box has its own function, you will see also your PC's username at the top.
- The current available 21 boxes are:

| # | Feature | Description |
|---|---------|-------------|
| 1 | **System info** | Shows basic system information such as Host Name, OS Name, OS Version, Total Physical Memory, and more. |
| 2 | **CPU info** | Displays CPU information including AddressWidth, Architecture, Availability, Caption, and other details. |
| 3 | **GPU info** | Displays GPU information such as AcceleratorCapabilities, AdapterCompatibility, AdapterDACType, and more. |
| 4 | **Disks info** | Shows detailed information about all available disks. |
| 5 | **Drivers info** | Displays a large amount of information about installed drivers. |
| 6 | **Opened apps** | Shows all currently opened applications. |
| 7 | **Resources Monitor** | Displays current RAM usage, CPU usage, disk sizes, and disk usage statistics. |
| 8 | **Shutdown PC** | Allows you to shut down the PC remotely. |
| 9 | **Restart PC** | Allows you to restart the PC remotely. |
| 10 | **Sleep PC** | Allows you to put the PC into sleep mode remotely. |
| 11 | **Sign out PC** | Allows you to sign out of the current Windows session remotely. |
| 12 | **Close all apps** | Allows you to close all currently opened applications. |
| 13 | **Request a screenshot** | Captures and displays a screenshot of the PC's screen. |
| 14 | **Speak a text** | Converts entered text into speech and plays it on the PC. |
| 15 | **Send a message** | Displays a custom message on the PC's screen. |
| 16 | **Play the standard beep of Windows** | Plays the default Windows beep sound. |
| 17 | **Send an error** | Displays a custom error message on the PC's screen. |
| 18 | **Run a file** | Executes a specified executable file using its path. |
| 19 | **Download a file** | Downloads a file from the PC using its path. |
| 20 | **File Explorer** | Allows browsing of files and folders and viewing their paths. |
| 21 | **Server Outputs** | Displays real-time server logs and output messages. |

## Additional notes
- This software requires NodeJs installed on your device in order to work, you can install it from the artificial NodeJs website, or you can run the `node-v22.11.0-x64.msi` file to install it directly. 
- The server can run in the background without a noticeable effect on your device's resources, and does not stop if you closed the program, to stop it, stop it from the program's interface.
- Do NOT modify anything in the program files to avoid unexpected errors.

- Developed by Ayman Saied -
- Please contact me [ clulyf88@gmail.com ] if you face any problem with the program, so I can fix it -

## Some information for developers on GitHub
- This project is written in `NodeJs` 'for the server', `VBS` 'for starting server command',  `Python` 'for the program', `Javascript` 'for handling web-application interactions and sending data', `HTML` 'for main web-application interface', `CSS` 'for web-application user interface styling'.
- This project uses **NirCmd command-line utility by NirSoft**.
- Libraries used in Python:

```python
import socket
import time
import shutil
import requests
from requests.exceptions import RequestException
import threading
import webbrowser
import subprocess
import tkinter
from tkinter import *
from tkinter import messagebox
from tkinter import scrolledtext
from tkinter import font
from tkinter.ttk import *
import os
import sys
import json
```

- Libraries used in NodeJs:

```js
const os = require("os");
const fs = require("fs");
const path = require("path");
const http = require("http");
```

- To run the software run the NA-PCManager64.py file or use this command `python NA-PCManager64.py`.
- The source code of this software is converted into an exe program using pyinstaller.
