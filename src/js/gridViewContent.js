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
        this.paramMap.delete(id);
    }
}

function createMessage(method, params, id) {
    return {
        method: method,
        params: params,
        id: id
    };
}

//Handle messages TO Vscode
var currentID = 1;
function sendRequest(method, params, callback, callbackParams = undefined) {
    id = this.currentID++;
    cbMapper.addCallback(id, callback, callbackParams);
    const request = createMessage(method, params, id);
    console.log("Sending: " + JSON.stringify(request));
    vscode.postMessage(request);
}

//Handle messages from VSCode
function receiveRequest(event) {
    const message = event.data;
    console.log("Received: " + JSON.stringify(message));
    cbMapper.call(message.id, message.result);
}

//Webview mouse clicks
function clickHandler(event) {
    //TODO debounce
    //FIXME go to parent element until not found or correct one
    if (event.target.classList.contains("expandable")) {
        expand(event.target);
    } else if (event.target.classList.contains("expanded")) {
        collapse(event.target);
    } else if (event.target.classList.contains("ctxMenu")) {
        if(!ctxMenuOpen) {
            showCtxMenu(event);
        } else {
            hideCtxMenu(event);
        }
    }
}

function expand(target) {
    sendRequest("getChildren", { "xPath": target.id, "uri": docString }, (result, target) => {
        target.classList = "expanded";
        target.appendChild(createTable(result));
    }, target);
}

function createTable(result) {
    var tbl = document.createElement("table");

    if(result.attributes) {
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

    if(result.elements) {
        for (let element of result.elements) {
            var tr = document.createElement("tr");
            tr.id = element.fullPath;
            tr.title = element.fullPath;
            var tdName = document.createElement("td");
            var tdValue = document.createElement("td");
            if(!element.hasChildren) {
                tdName.appendChild(document.createTextNode(element.name));
                tr.appendChild(tdName);
                tdValue.appendChild(document.createTextNode(element.value));
                tr.appendChild(tdValue);
            } else {
                //Value may now contain the "ARXML Shortname"
                //FIXME: Include the Shortname serverside
                if(element.value) {
                    tdName.appendChild(document.createTextNode(element.name + " - " - element.value));
                } else {
                    tdName.appendChild(document.createTextNode(element.name));
                }
                tr.appendChild(tdName);
                tdValue.appendChild(document.createTextNode("click to expand"));
                tr.appendChild(tdValue);
                tr.classList = "expandable";
            }

            tbl.appendChild(tr);
        }
    }
    return tbl;
}

function collapse(target) {
    target.classList = "expandable";
    target.innterHTML = "";
}

function main() {
    cbMapper.addCallback(0, serverReady);

    window.addEventListener("message", receiveRequest);
    document.addEventListener("click", clickHandler);
}

function goToTextPosition(targetID) {
    if (targetID.startsWith("nameField-")) {
        targetID.replace("nameField-", "");
    }
    vscode.postMessage(createMessage("goto", { "xPath": targetID, "uri": docString }));
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

function hideCtxMenu(event) {
    ctxMenuOpen = false;
    event.stopPropagation();
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