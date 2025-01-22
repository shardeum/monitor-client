
async function getVersionNumbers() {
    const versionResponse = await requestWithToken(`${monitorServerUrl}/version`)

    console.log("test string:", versionResponse.data)
    clientVersion = versionResponse.data.clientPackageVersion
    serverVersion = versionResponse.data.serverPackageVersion

    const clientVersionEle = document.getElementById("client-version")
    if (clientVersionEle){
        clientVersionEle.textContent = clientVersion
    }

    const serverVersionEle = document.getElementById("server-version")
    if (serverVersionEle){
        serverVersionEle.textContent = serverVersion
    }
}

getVersionNumbers()
