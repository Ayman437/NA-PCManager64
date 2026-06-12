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

isOpeningOutputs = False

def getLocalIp():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()

        return local_ip
    except Exception as e:
        print(e)
        return "IP not found!"


configurationJsonFilePath = "Server/Configuration.json"

try:
    if not os.path.exists(configurationJsonFilePath):
        with open(configurationJsonFilePath, "w", encoding="utf-8") as file:
            file.write('{"IsItOn": true,\n"PORT": 3000,\n"Key": "admin",\n"LastShotPath": "",\n"LastShotPath2": "Web/LastScreenshot/",\n"ServerOutputsPath": "",\n"OtherServerRunnerScriptPath": "",\n"OtherServerRunnerScriptPath2": "",\n"NircmdPath": "",\n"ImageCompressionValue": "0.7"}')
        file.close()
except Exception as e:
    print(e)

ip = getLocalIp()

def getServerStats():
    global serverStatusVar
    global serverStatusLbl
    global stopServerBtn
    global StartServerBtn
    global openWebsiteBtn
    global saveChangesBtn
    global serverPortEntry
    global startRunBtn
    global stl
    global stLbl

    stl.set("Getting server status...")
    stLbl.config(fg="black")

    try:
        with open(configurationJsonFilePath, 'r', encoding='utf-8') as file:
            data = json.load(file)

        response = requests.get(f"http://{ip}:{data.get('PORT')}/health-check")
        if response:
            serverStatusVar.set(f"  The server is online\n  The server is running at: http://{ip}:{data.get('PORT')}/ or http://localhost:{data.get('PORT')}/")
            serverStatusLbl.config(fg="green")

            stopServerBtn.config(state=NORMAL)
            openWebsiteBtn.config(state=NORMAL)
            StartServerBtn.config(state=DISABLED)
            serverPortEntry.config(state=DISABLED)
            serverPassEntry.config(state=DISABLED)
            serverImgQuEntry.config(state=DISABLED)
            startRunBtn.config(state=DISABLED)
            saveChangesBtn.config(state=DISABLED)

        file.close()

    except RequestException:
        serverStatusVar.set("  The server is offline")
        serverStatusLbl.config(fg="red")

        stopServerBtn.config(state=DISABLED)
        openWebsiteBtn.config(state=DISABLED)
        StartServerBtn.config(state=NORMAL)
        serverPortEntry.config(state=NORMAL)
        serverPassEntry.config(state=NORMAL)
        serverImgQuEntry.config(state=NORMAL)
        startRunBtn.config(state=NORMAL)
        saveChangesBtn.config(state=NORMAL)

    stl.set("Server status fetched successfully")
    stLbl.config(fg="green")

    getServerDataConf()

def openWebsite():
    global openWebsiteBtn
    global stl
    global stLbl

    stl.set("Opening website...")
    stLbl.config(fg="black")

    with open(configurationJsonFilePath, 'r', encoding='utf-8') as file:
        data = json.load(file)

    openWebsiteBtn.config(state=DISABLED)
    webbrowser.open(f"http://{ip}:{data.get('PORT')}/")
    openWebsiteBtn.config(state=NORMAL)

    stl.set("The website has been opened successfully")
    stLbl.config(fg="green")
    file.close()

def openWebsiteThread():
    threading.Thread(target=openWebsite).start()

def stopServer():
    global stopServerBtn
    global StartServerBtn
    global openWebsiteBtn
    global serverStatusVar
    global serverStatusLbl
    global serverPortEntry
    global saveChangesBtn
    global startRunBtn
    global stl
    global stLbl


    stopServerBtn.config(state=DISABLED)
    stl.set("Closing the server...")
    stLbl.config(fg="black")


    try:
        with open(configurationJsonFilePath, 'r', encoding='utf-8') as file:
            data = json.load(file)

        response = requests.get(f"http://{ip}:{data.get('PORT')}/shutdownserver-{data.get('Key')}")
        file.close()

        if response:
            threading.Thread(target=getServerStats).start()
        else:
            stopServerBtn.config(state=NORMAL)
            openWebsiteBtn.config(state=NORMAL)
            StartServerBtn.config(state=DISABLED)
            serverPortEntry.config(state=DISABLED)
            serverPassEntry.config(state=DISABLED)
            serverImgQuEntry.config(state=DISABLED)
            startRunBtn.config(state=DISABLED)

            saveChangesBtn.config(state=DISABLED)
    except RequestException:
        stopServerBtn.config(state=NORMAL)
        openWebsiteBtn.config(state=NORMAL)
        StartServerBtn.config(state=DISABLED)
        serverPortEntry.config(state=DISABLED)
        serverPassEntry.config(state=DISABLED)
        serverImgQuEntry.config(state=DISABLED)
        startRunBtn.config(state=DISABLED)
        saveChangesBtn.config(state=DISABLED)

    stl.set("The server has been closed successfully")
    stLbl.config(fg="green")

def stopServerThread():
    threading.Thread(target=stopServer).start()

def startServer():
    global StartServerBtn
    global serverPortEntry
    global startRunBtn
    global stl
    global entr1
    global stLbl

    stl.set("Starting the server...")
    stLbl.config(fg="black")

    StartServerBtn.config(state=DISABLED)
    serverPortEntry.config(state=DISABLED)
    serverPassEntry.config(state=DISABLED)
    serverImgQuEntry.config(state=DISABLED)
    startRunBtn.config(state=DISABLED)

    with open(configurationJsonFilePath, 'r', encoding='utf-8') as file:
        data = json.load(file)
    file.close()

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        isPort = s.connect_ex(((ip), data.get('PORT'))) != 0

    if isPort == True:
        with open(configurationJsonFilePath, 'r', encoding='utf-8') as file:
            data = json.load(file)

        file.close()
        if not os.path.exists(data.get("OtherServerRunnerScriptPath2")):
            messagebox.showwarning("Missing file/folder error", "The StartPCManagerJSServer2.vbs file is missing, the program will be closed now!")
            root.destroy()
            try:
                sys.exit()
            except SystemExit:
                os._exit(0)

        try:
            entr1.config(state=NORMAL)
            entr1.delete("1.0", "end")
            entr1.config(state=DISABLED)
        except Exception:
            pass

        subprocess.run([data.get("OtherServerRunnerScriptPath2")], shell=True)
        threading.Thread(target=getServerStats).start()
    else:
        stl.set("Cannot use this port")
        stLbl.config(fg="red")
        messagebox.showwarning("Invalid inputs", f"Port {str(serverPortIntVar.get())} is already in use, please choose a different port number")
        StartServerBtn.config(state=NORMAL)
        serverPortEntry.config(state=NORMAL)
        serverPassEntry.config(state=NORMAL)
        serverImgQuEntry.config(state=NORMAL)
        startRunBtn.config(state=NORMAL)

def startServerThread():
    threading.Thread(target=startServer).start()

def getServerDataConf():
    global serverPassVar
    global serverPortIntVar
    global serverImgQuVar
    global startRunCheckText
    global startRunCheck

    if os.path.exists(configurationJsonFilePath):
        try:
            with open(configurationJsonFilePath, 'r', encoding='utf-8') as file:
                data = json.load(file)

            serverPassVar.set(data.get("Key"))
            serverPortIntVar.set(data.get("PORT"))
            serverImgQuVar.set(data.get("ImageCompressionValue"))
            if data.get("IsItOn"):
                startRunCheckText.set("Yes")
                startRunCheck.set(True)
            else:
                startRunCheckText.set("No")
                startRunCheck.set(False)

            file.close()
        except Exception as e:
            messagebox.showwarning("Unexpected error", f"{e}")
            root.destroy()
            try:
                sys.exit()
            except SystemExit:
                os._exit(0)

    else:
        messagebox.showwarning("Missing file/folder error", "The Configuration.json file is missing, the program will be closed now!")
        root.destroy()
        try:
            sys.exit()
        except SystemExit:
            os._exit(0)

def saveChanges():
    global serverPassVar
    global serverPortIntVar
    global serverPortEntry
    global serverImgQuVar
    global stopServerBtn
    global StartServerBtn
    global openWebsiteBtn
    global saveChangesBtn
    global isPortNumric
    global isQuNumric
    global stl
    global stLbl
    global startRunCheck
    global startRunBtn

    stl.set("Saving changes...")
    stLbl.config(fg="black")

    stopServerBtn.config(state=DISABLED)
    openWebsiteBtn.config(state=DISABLED)
    StartServerBtn.config(state=DISABLED)
    serverPortEntry.config(state=DISABLED)
    serverPassEntry.config(state=DISABLED)
    serverImgQuEntry.config(state=DISABLED)
    startRunBtn.config(state=DISABLED)
    saveChangesBtn.config(state=DISABLED)

    isPortNumric = False
    isQuNumric = False

    try:
        int(str(serverPortIntVar.get()))
        isPortNumric = True
    except Exception:
        isPortNumric = False

    try:
        float(str(serverImgQuVar.get()))
        isQuNumric = True
    except Exception:
        isQuNumric = False

    if isPortNumric == True:
        if int(serverPortIntVar.get()) >= 1 and int(serverPortIntVar.get()) <= 65535:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                isPort = s.connect_ex(((ip), int(serverPortIntVar.get()))) != 0

            if isPort == True:
                if serverPassVar.get().replace(" ", "") != "":
                    if isQuNumric == True:
                        if float(serverImgQuVar.get()) <= 1 and float(serverImgQuVar.get()) >= 0:
                            with open(configurationJsonFilePath, 'r', encoding='utf-8') as file:
                                data = json.load(file)

                            data["Key"] = serverPassVar.get()
                            data["ImageCompressionValue"] = serverImgQuVar.get()
                            data["PORT"] = serverPortIntVar.get()
                            data["IsItOn"] = startRunCheck.get()

                            file.close()

                            with open(configurationJsonFilePath, "w", encoding="utf-8") as file:
                                json.dump(data, file, indent=4, ensure_ascii=False)

                            file.close()

                            stl.set("Changes saved successfully")
                            stLbl.config(fg="green")

                            stopServerBtn.config(state=DISABLED)
                            openWebsiteBtn.config(state=DISABLED)
                            StartServerBtn.config(state=NORMAL)
                            serverPortEntry.config(state=NORMAL)
                            serverPassEntry.config(state=NORMAL)
                            serverImgQuEntry.config(state=NORMAL)
                            startRunBtn.config(state=NORMAL)
                            saveChangesBtn.config(state=NORMAL)
                        else:
                            stl.set("Cannot save changes")
                            stLbl.config(fg="red")
                            messagebox.showwarning("Invalid inputs", "Please enter a server images quality value between 0 and 1")
                            stopServerBtn.config(state=DISABLED)
                            openWebsiteBtn.config(state=DISABLED)
                            StartServerBtn.config(state=NORMAL)
                            serverPortEntry.config(state=NORMAL)
                            serverPassEntry.config(state=NORMAL)
                            serverImgQuEntry.config(state=NORMAL)
                            startRunBtn.config(state=NORMAL)
                            saveChangesBtn.config(state=NORMAL)
                    else:
                        stl.set("Cannot save changes")
                        stLbl.config(fg="red")
                        messagebox.showwarning("Invalid inputs", "Please enter a valid server images quality value")
                        stopServerBtn.config(state=DISABLED)
                        openWebsiteBtn.config(state=DISABLED)
                        StartServerBtn.config(state=NORMAL)
                        serverPortEntry.config(state=NORMAL)
                        serverPassEntry.config(state=NORMAL)
                        serverImgQuEntry.config(state=NORMAL)
                        startRunBtn.config(state=NORMAL)
                        saveChangesBtn.config(state=NORMAL)
                else:
                    stl.set("Cannot save changes")
                    stLbl.config(fg="red")
                    messagebox.showwarning("Invalid inputs", "Please enter a valid server access key")
                    stopServerBtn.config(state=DISABLED)
                    openWebsiteBtn.config(state=DISABLED)
                    StartServerBtn.config(state=NORMAL)
                    serverPortEntry.config(state=NORMAL)
                    serverPassEntry.config(state=NORMAL)
                    serverImgQuEntry.config(state=NORMAL)
                    startRunBtn.config(state=NORMAL)
                    saveChangesBtn.config(state=NORMAL)
            else:
                stl.set("Cannot save changes")
                stLbl.config(fg="red")
                messagebox.showwarning("Invalid inputs", f"Port {str(serverPortIntVar.get())} is already in use, please choose a different port number")
                stopServerBtn.config(state=DISABLED)
                openWebsiteBtn.config(state=DISABLED)
                StartServerBtn.config(state=NORMAL)
                serverPortEntry.config(state=NORMAL)
                serverPassEntry.config(state=NORMAL)
                serverImgQuEntry.config(state=NORMAL)
                startRunBtn.config(state=NORMAL)
                saveChangesBtn.config(state=NORMAL)
        else:
            stl.set("Cannot save changes")
            stLbl.config(fg="red")
            messagebox.showwarning("Invalid inputs", "Please enter a port value between 1 and 65535")
            stopServerBtn.config(state=DISABLED)
            openWebsiteBtn.config(state=DISABLED)
            StartServerBtn.config(state=NORMAL)
            serverPortEntry.config(state=NORMAL)
            serverPassEntry.config(state=NORMAL)
            serverImgQuEntry.config(state=NORMAL)
            startRunBtn.config(state=NORMAL)
            saveChangesBtn.config(state=NORMAL)

    else:
        stl.set("Cannot save changes")
        stLbl.config(fg="red")
        messagebox.showwarning("Invalid inputs", "Please enter a valid port value")
        stopServerBtn.config(state=DISABLED)
        openWebsiteBtn.config(state=DISABLED)
        StartServerBtn.config(state=NORMAL)
        serverPortEntry.config(state=NORMAL)
        serverPassEntry.config(state=NORMAL)
        serverImgQuEntry.config(state=NORMAL)
        startRunBtn.config(state=NORMAL)
        saveChangesBtn.config(state=NORMAL)

def saveChangesThread():
    threading.Thread(target=saveChanges).start()


def upDatePaths():
    if os.path.exists(configurationJsonFilePath):
        try:
            with open(configurationJsonFilePath, 'r', encoding='utf-8') as file:
                data = json.load(file)

            if not os.path.exists(data.get("LastShotPath")):
                if not os.path.exists("Server/Web/LastScreenshot"):
                    messagebox.showwarning("Missing file/folder error", "The Server/Web/LastScreenshot folder is missing, the program will be closed now!")
                    root.destroy()
                    try:
                        sys.exit()
                    except SystemExit:
                        os._exit(0)

                data["LastShotPath"] = os.path.abspath("Server/Web/LastScreenshot").replace("\\", "/") + "/"

            if not os.path.exists(data.get("ServerOutputsPath")):
                if not os.path.exists("Server/ServerOutputs.txt"):
                    messagebox.showwarning("Missing file/folder error", "The Server/ServerOutputs.txt file is missing, the program will be closed now!")
                    root.destroy()
                    try:
                        sys.exit()
                    except SystemExit:
                        os._exit(0)

                data["ServerOutputsPath"] = os.path.abspath("Server/ServerOutputs.txt").replace("\\", "/")

            if not os.path.exists(data.get("OtherServerRunnerScriptPath")):
                if not os.path.exists("Server/StartPCManagerJSServer.vbs"):
                    messagebox.showwarning("Missing file/folder error", "The Server/StartPCManagerJSServer.vbs file is missing, the program will be closed now!")
                    root.destroy()
                    try:
                        sys.exit()
                    except SystemExit:
                        os._exit(0)

                data["OtherServerRunnerScriptPath"] = os.path.abspath("Server/StartPCManagerJSServer.vbs").replace("\\", "/")

            if not os.path.exists(data.get("OtherServerRunnerScriptPath2")):
                if not os.path.exists("Server/StartPCManagerJSServer2.vbs"):
                    messagebox.showwarning("Missing file/folder error", "The Server/StartPCManagerJSServer2.vbs file is missing, the program will be closed now!")
                    root.destroy()
                    try:
                        sys.exit()
                    except SystemExit:
                        os._exit(0)

                data["OtherServerRunnerScriptPath2"] = os.path.abspath("Server/StartPCManagerJSServer2.vbs").replace("\\", "/")

            if not os.path.exists(data.get("NircmdPath")):
                if not os.path.exists("Server/Nircmdx64/nircmd.exe"):
                    messagebox.showwarning("Missing file/folder error", "The Server/Nircmdx64/nircmd.exe file is missing, the program will be closed now!")
                    root.destroy()
                    try:
                        sys.exit()
                    except SystemExit:
                        os._exit(0)

                data["NircmdPath"] = os.path.abspath("Server/Nircmdx64/nircmd.exe").replace("\\", "/")

            if not os.path.exists(f"Server/{data.get('LastShotPath2')}") or data.get('LastShotPath2').replace(" ", "") == "":
                if not os.path.exists("Server/Web/LastScreenshot"):
                    messagebox.showwarning("Missing file/folder error", "The Server/Nircmdx64/nircmd.exe file is missing, the program will be closed now!")
                    root.destroy()
                    try:
                        sys.exit()
                    except SystemExit:
                        os._exit(0)

                data["LastShotPath2"] = "Web/LastScreenshot/"

            try:
                if (data.get("Key")).replace(" ", "") == "":
                    data["Key"] = "admin"
            except Exception:
                data["Key"] = "admin"

            try:
                int(str(data.get("PORT")))
                isPortNumric = True
            except Exception:
                isPortNumric = False

            if isPortNumric == False:
                data["PORT"] = 3000

            file.close()

            with open(configurationJsonFilePath, "w", encoding="utf-8") as file:
                json.dump(data, file, indent=4, ensure_ascii=False)

            file.close()

            with open('Server/StartPCManagerJSServer.vbs', "r", encoding="utf-8") as file:
                data = file.readlines()

            curDir = data[1].replace('"', '').replace("WshShell.CurrentDirectory = ", "").replace("\n", "")
            vbsFilePath = data[2].replace('"', '').replace("WshShell.Run node ", "").replace(", 0", "")

            file.close()

            if not os.path.exists(curDir) or os.path.abspath(curDir) != os.path.abspath("Server"):
                rightCurDirPath = os.path.abspath("Server")

                with open('Server/StartPCManagerJSServer.vbs', "r", encoding="utf-8") as file:
                    data = file.read()

                file.close()

                data = data.replace(f'"{curDir}"', f'"{rightCurDirPath}"')

                with open('Server/StartPCManagerJSServer.vbs', "w", encoding="utf-8") as file:
                    file.write(data)

                file.close()

            if not os.path.exists(vbsFilePath) or os.path.abspath(vbsFilePath) != os.path.abspath("Server/Server.js"):
                rightVnsPath = os.path.abspath("Server/Server.js")

                with open('Server/StartPCManagerJSServer.vbs', "r", encoding="utf-8") as file:
                    data = file.read()

                file.close()

                data = data.replace(vbsFilePath, rightVnsPath)

                with open('Server/StartPCManagerJSServer.vbs', "w", encoding="utf-8") as file:
                    file.write(data)

                file.close()


            with open('Server/StartPCManagerJSServer2.vbs', "r", encoding="utf-8") as file:
                data = file.readlines()

            curDir = data[1].replace('"', '').replace("WshShell.CurrentDirectory = ", "").replace("\n", "")
            vbsFilePath = data[2].replace('"', '').replace("WshShell.Run node ", "").replace(", 0", "")

            file.close()

            if not os.path.exists(curDir) or os.path.abspath(curDir) != os.path.abspath("Server"):
                rightCurDirPath = os.path.abspath("Server")

                with open('Server/StartPCManagerJSServer2.vbs', "r", encoding="utf-8") as file:
                    data = file.read()

                file.close()

                data = data.replace(f'"{curDir}"', f'"{rightCurDirPath}"')

                with open('Server/StartPCManagerJSServer2.vbs', "w", encoding="utf-8") as file:
                    file.write(data)

                file.close()

            if not os.path.exists(vbsFilePath) or os.path.abspath(vbsFilePath) != os.path.abspath("Server/Server2.js"):
                rightVnsPath = os.path.abspath("Server/Server2.js")

                with open('Server/StartPCManagerJSServer2.vbs', "r", encoding="utf-8") as file:
                    data = file.read()

                file.close()

                data = data.replace(vbsFilePath, rightVnsPath)

                with open('Server/StartPCManagerJSServer2.vbs', "w", encoding="utf-8") as file:
                    file.write(data)

                file.close()

            shutil.copy('Server/StartPCManagerJSServer.vbs', f"C:/Users/{os.getlogin()}/AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup/")

        except Exception as e:
            messagebox.showwarning("Unexpected error", f"{e}")
            root.destroy()
            try:
                sys.exit()
            except SystemExit:
                os._exit(0)

    else:
        messagebox.showwarning("Missing file/folder error", "The Configuration.json file is missing, the program will be closed now!")
        root.destroy()
        try:
            sys.exit()
        except SystemExit:
            os._exit(0)

    getServerDataConf()
    getServerStats()

def updateOutputText():
    global entr1
    global isOpeningOutputs

    while True:
        if isOpeningOutputs == True:
            try:
                linesToInsert = ""
                with open("Server/ServerOutputs.txt", "r", encoding="utf-8") as fileToRead:
                    for line in fileToRead:
                        linesToInsert += line.strip() + "\n"
                fileToRead.close()

                if linesToInsert.strip() != entr1.get("1.0", tkinter.END).strip():
                    atBottom = entr1.yview()[1] == 1.0

                    newLines = linesToInsert[len(entr1.get("1.0", tkinter.END)):]
                    entr1.config(state=NORMAL)
                    entr1.insert(tkinter.END, newLines)
                    if atBottom:
                        entr1.yview_moveto(1.0)
                    entr1.config(state=DISABLED)

                if linesToInsert.strip() == "":
                    entr1.delete(1.0, tkinter.END)
                    entr1.yview_moveto(1.0)
            except Exception as e:
                print(e)

        time.sleep(0.6)


def close_outputs(window):
    global isOpeningOutputs
    global serverOutputsBtn

    isOpeningOutputs = False
    serverOutputsBtn.config(state=NORMAL)

def openServerOutputs():
    global isOpeningOutputs
    global serverOutputsBtn
    global entr1

    isOpeningOutputs = True
    serverOutputsBtn.config(state=DISABLED)

    serverOutputsRoot = Toplevel(root)
    serverOutputsRoot.title("NA-PCManager64 | Server outputs")

    serverOutputsRoot.geometry("700x350")
    serverOutputsRoot.minsize(580, 250)
    if os.path.exists("Icon.ico"):
        serverOutputsRoot.iconbitmap("Icon.ico")

    entr1 = scrolledtext.ScrolledText(serverOutputsRoot)
    entr1.pack(expand=True, fill='both')

    threading.Thread(target=updateOutputText).start()

    serverOutputsRoot.bind("<Destroy>", close_outputs)



def openServerOutputsThread():
    threading.Thread(target=openServerOutputs).start()

def updateTextCheckBl():
    global startRunCheckText

    if startRunCheckText.get() == "No":
        startRunCheckText.set("Yes")
    else:
        startRunCheckText.set("No")


def onClose():
    root.destroy()

    try:
        sys.exit()
    except SystemExit:
        os._exit(0)


def onlyNumbers(P):
    return P.isdigit() or P.replace(" ", "") == "" or P == ""


def checkNodeJs():
    nodeCommandResult = subprocess.run(['node', '--version'], shell=True, timeout=10)

    if nodeCommandResult.returncode != 0:
        messagebox.showwarning("Requirements error", "This program requires NodeJs installed on your device in order to work properly")
        root.destroy()
        try:
            sys.exit()
        except SystemExit:
            os._exit(0)

root = Tk()

serverStatusVar = StringVar()
serverPassVar = StringVar()
serverImgQuVar = StringVar()
serverPortIntVar = IntVar()
startRunCheck = BooleanVar()
startRunCheckText = StringVar()
startRunCheckText.set("No")
stl = StringVar()

serverStatusVar.set("  Getting server status...")

root.title("NA-PCManager64")
root.maxsize(width=540, height=230)
root.minsize(width=540, height=230)
if os.path.exists("Icon.ico"):
    root.iconbitmap("Icon.ico")

customFont1 = font.Font(
    family="Arial",
    size=11,
    weight="bold",
    slant="roman",
    underline=False,
    overstrike=False
)

customFont2 = font.Font(
    family="Arial",
    size=10,
    weight="bold",
    slant="roman",
    underline=False,
    overstrike=False
)

vcmd = (root.register(onlyNumbers), "%P")

serverStatusLbl = tkinter.Label(root, textvariable=serverStatusVar, font=customFont1, justify="left", anchor="w")
serverStatusLbl.grid(row=0, column=0, sticky=W, pady=4)

serverPortLbl = tkinter.Label(root, text="  Server port", font=customFont1, justify="left", anchor="w")
serverPortLbl.grid(row=1, column=0, sticky=W, pady=4)

serverPortEntry = Entry(root, width=5, font=customFont1, justify="left", textvariable=serverPortIntVar, validate="key", validatecommand=vcmd)
serverPortEntry.grid(row=1, column=0, sticky=W, pady=4, padx=100)

serverPass = tkinter.Label(root, text=" |  Server access key", font=customFont1, justify="left", anchor="w")
serverPass.grid(row=1, column=0, sticky=W, pady=4, padx=150)

serverPassEntry = Entry(root, width=22, font=customFont1, justify="left", textvariable=serverPassVar)
serverPassEntry.grid(row=1, column=0, sticky=W, pady=4, padx=310)

serverImagesQu = tkinter.Label(root, text="  Server images quality", font=customFont1, justify="left", anchor="w")
serverImagesQu.grid(row=2, column=0, sticky=W, pady=4)

serverImgQuEntry = Entry(root, width=5, font=customFont1, justify="left", textvariable=serverImgQuVar)
serverImgQuEntry.grid(row=2, column=0, sticky=W, pady=4, padx=170)

startRun = tkinter.Label(root, text="  Run the server on every Windows startup", font=customFont1, justify="left", anchor="w")
startRun.grid(row=3, column=0, sticky=W, pady=4)

startRunBtn = Checkbutton(root, width=5, variable=startRunCheck, textvariable=startRunCheckText, command=updateTextCheckBl)
startRunBtn.grid(row=3, column=0, sticky=W, pady=4, padx=310)

stopServerBtn = Button(root, text="Stop server", width=15, command=stopServerThread)
stopServerBtn.grid(row=4, column=0, sticky=W, pady=4, padx=20)
stopServerBtn.config(state=DISABLED)

StartServerBtn = Button(root, text="Start server", width=15, command=startServerThread)
StartServerBtn.grid(row=4, column=0, sticky=W, pady=4, padx=140)
StartServerBtn.config(state=DISABLED)

openWebsiteBtn = Button(root, text="Open website", width=15, command=openWebsiteThread)
openWebsiteBtn.grid(row=4, column=0, sticky=W, pady=4, padx=260)
openWebsiteBtn.config(state=DISABLED)
serverPortEntry.config(state=DISABLED)
serverPassEntry.config(state=DISABLED)
serverImgQuEntry.config(state=DISABLED)
startRunBtn.config(state=DISABLED)

saveChangesBtn = Button(root, text="Save changes", width=15, command=saveChangesThread)
saveChangesBtn.grid(row=4, column=0, sticky=W, pady=4, padx=395)
saveChangesBtn.config(state=DISABLED)

serverOutputsBtn = Button(root, text="Open server outputs", width=20, command=openServerOutputsThread)
serverOutputsBtn.grid(row=5, column=0, sticky=W, pady=4, padx=395)

stLbl = tkinter.Label(root, font=customFont2, justify="left", textvariable=stl)
stLbl.place(rely=0.9)

threading.Thread(target=upDatePaths).start()
threading.Thread(target=checkNodeJs).start()

root.protocol("WM_DELETE_WINDOW", onClose)
root.mainloop()