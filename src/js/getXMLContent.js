class CallbackMapper {
    callbackMap;
    paramMap;
    constructor() {
        this.callbackMap = new Map;
        this.paramMap = new Map;
    }

    addCallback(id, callback, callbackParams) {
        this.callbackMap.set(id, callback);
        this.paramMap.set(id, callbackParams);
    }

    call(id, result) {
        if (this.paramMap.has(id)) {
            this.callbackMap.get(id)(result, this.paramMap.get(id));
        } else {
            this.callbackMap.get(id)(result);
        }
        this.callbackMap.delete(id);
        this.paramMap.delete;
    }
}

function createMessage(method, params, id) {
    return {
        method: method,
        params: params,
        id: id
    };
}

var currentID = 1;
function sendRequest(method, params, callback, callbackParams = undefined) {
    id = this.currentID++;
    cbMapper.addCallback(id, callback, callbackParams);
    const request = createMessage(method, params, id);
    console.log("Sending: " + JSON.stringify(request));
    vscode.postMessage(request);
};

function convertToNameFieldID(valueFieldID) {
    return "xmlGridViewNameField-" + valueFieldID;
}

function convertToValueFieldID(nameFieldID) {
    //FIXME:
    //Will replace in string too, not just the prefix
    return nameFieldID.replace("xmlGridViewNameField-", "");
}

function loadContent(e) {
    if (ctxMenuOpen) {
        hideCtxMenu();
        return;
    }
    var name = e.target.id;

    if (name.startsWith("xmlGridViewNameField-")) {
        name = convertToValueFieldID(name);
    }
    sendRequest("getChildren", { "xPath": name, "uri": docString }, showElements, document.getElementById(name));
}

function unloadContent(e) {
    if (ctxMenuOpen) {
        hideCtxMenu();
        return;
    }
    e.target.removeEventListener("click", unloadContent);
    e.target.addEventListener("click", loadContent);
    e.classList = "expandableNameField";
    var name = e.target.id;
    name = convertToValueFieldID(name);
    valueField = document.getElementById(name);
    valueField.innerHTML = "";
    valueField.appendChild(document.createTextNode("click to expand"));
    valueField.addEventListener("click", loadContent);
    valueField.classList = "expandable";
}

function serverReady(result) {
    sendRequest("init", { uri: docString }, result => {
        if (result.status !== "ok") {
            vscode.postMessage(
                createMessage("showNotification",
                    {
                        "text": "Parsing error at [Line: "
                            + (parseInt(result.position.line) + 1) + ", Column: " + (parseInt(result.position.character) + 1) + "]:\n" + result.description,
                        "position": result.position,
                        "uri": docString
                    }
                    //1 added to position values because returned values are zero based but start with one in the editor
                )
            );
        }
    });
}

function showElements(result, domElement) {
    domElement.removeEventListener("click", loadContent);
    domElement.classList = "expanded";
    nameFieldElement = document.getElementById("xmlGridViewNameField-" + domElement.id);
    if (nameFieldElement) {
        nameFieldElement.removeEventListener("click", loadContent);
        nameFieldElement.addEventListener("click", unloadContent);
        nameFieldElement.classList = "expandedNameField";
    }


    target = domElement;
    target.innerHTML = "";

    var tbl = document.createElement("table");
    tbl.className = "xmlGrid";

    if (result.attributes) {
        for (let attribute of result.attributes) {
            var tr = document.createElement("tr");
            var tdName = document.createElement("td");
            tdName.appendChild(document.createTextNode("@" + attribute.name));
            tr.appendChild(tdName);
            var tdValue = document.createElement("td");
            tdValue.appendChild(document.createTextNode(attribute.value));
            tr.appendChild(tdValue);
            tbl.appendChild(tr);
        }
    }
    if (result.elements) {
        for (let element of result.elements) {
            var tr = document.createElement("tr");
            //For complex elements, create the "button" to get more info
            var tdName = document.createElement("td");
            var tdValue = document.createElement("td");
            if (element.hasChildren) {
                if (element.value) {
                    tdName.appendChild(document.createTextNode(element.name + " - " + element.value));
                } else {
                    tdName.appendChild(document.createTextNode(element.name));
                }
                tdName.id = "xmlGridViewNameField-" + element.fullPath;
                tdValue.classList = "expandableNameField";
                tdName.title = "XPath: " + element.fullPath;
                tdName.addEventListener("contextmenu", showCtxMenu, false);
                tdName.addEventListener("click", loadContent);
                tr.appendChild(tdName);
                tdValue.appendChild(document.createTextNode("click to expand"));
                tdValue.id = element.fullPath;
                tdValue.classList = "expandable";
                tdValue.addEventListener("click", loadContent);
                tr.appendChild(tdValue);
            } else {
                tdName.appendChild(document.createTextNode(element.name));
                tdName.id = "xmlGridViewNameField-" + element.fullPath;
                tdName.title = "XPath: " + element.fullPath;
                tdName.addEventListener("contextmenu", showCtxMenu, false);
                tr.appendChild(tdName);
                tdValue.appendChild(document.createTextNode(element.value));
                tr.appendChild(tdValue);
            }
            tbl.appendChild(tr);
        }

    }
    target.appendChild(tbl);
}

function main() {
    cbMapper.addCallback(0, serverReady);

    //For debugging, the breakpoints in the webview developer panel only work when its open,
    //so we need to wait until we can open it and then start manually
    document.getElementById("/").addEventListener("click", loadContent);
    document.body.addEventListener("click", hideCtxMenu, false);
    document.body.addEventListener("contextmenu", hideCtxMenu, false);

    window.addEventListener('message', event => {
        const message = event.data;
        console.log("Received: " + JSON.stringify(message));
        cbMapper.call(message.id, message.result);
    });
}

function showCtxMenu(event) {
    ctxMenuOpen = true;
    event.preventDefault();
    event.stopPropagation();
    var ctxMenu = document.getElementById("ctxMenu");
    ctxMenu.style.display = "block";
    ctxMenu.style.left = (event.pageX - 10) + "px";
    ctxMenu.style.top = (event.pageY - 10) + "px";
    document.getElementById("goto").addEventListener("click", () => {
        goToTextPosition(event.target.id);
    });
}

function goToTextPosition(targetID) {
    if (targetID.startsWith("xmlGridViewNameField-")) {
        targetID = convertToValueFieldID(targetID);
    }
    vscode.postMessage(createMessage("goto", { "xPath": targetID, "uri": docString }));
}

function hideCtxMenu() {
    ctxMenuOpen = false;
    var ctxMenu = document.getElementById("ctxMenu");
    ctxMenu.style.display = "";
    ctxMenu.style.left = "";
    ctxMenu.style.top = "";
}

var ctxMenuOpen = false;
docString = document.getElementById("/").getAttribute("docString");
vscode = acquireVsCodeApi();
var cbMapper = new CallbackMapper();
main();