class CallbackMapper
{
    callbackMap;
    paramMap;
    constructor()
    {
        this.callbackMap = new Map;
        this.paramMap = new Map;
    }
    
    addCallback(id, callback, callbackParams)
    {
        this.callbackMap.set(id, callback);
        this.paramMap.set(id, callbackParams);
    }
    
    call(id, result)
    {
        if (this.paramMap.has(id)) {
            this.callbackMap.get(id)(result, this.paramMap.get(id));
        } else {
            this.callbackMap.get(id)(result);
        }
        this.callbackMap.delete(id);
    }
}

function createMessage(method, params, id)
{
    return {
        method: method,
        params: params,
        id: id
    };
}

var currentID = 1;
function sendRequest(method, params, callback, callbackParams = undefined)
{
    id = this.currentID++;
    cbMapper.addCallback(id, callback, callbackParams);
    const request = createMessage(method, params, id);
    console.log("Sending: " + JSON.stringify(request));
    vscode.postMessage(request);
};

function convertToNameFieldID(valueFieldID)
{
    return "xmlGridViewNameField-" + valueFieldID;
}

function convertToValueFieldID(nameFieldID)
{
    //FIXME:
    //Will replace in string too, not just the prefix
    return nameFieldID.replace("xmlGridViewNameField-", "");
}

function loadContent(e)
{
    var name = e.target.id;
    if (name.startsWith("xmlGridViewNameField-")) {
        name = convertToValueFieldID(name);

    }
    sendRequest("getChildren", {"xPath": name}, showElements, document.getElementById(name));
}

function unloadContent(e)
{
    e.target.removeEventListener("click", unloadContent);
    e.target.addEventListener("click", loadContent);
    var name = e.target.id;
    name = convertToValueFieldID(name);
    valueField = document.getElementById(name);
    valueField.innerHTML = "";
    valueField.appendChild(document.createTextNode("click to expand"));
    valueField.addEventListener("click", loadContent);
}

function serverReady(result)
{
    sendRequest("init", null, ()=>{} );
}

function showElements(result, domElement)
{
    domElement.removeEventListener("click", loadContent);
    nameFieldElement = document.getElementById("xmlGridViewNameField-" + domElement.id);
    if (nameFieldElement) {
        nameFieldElement.removeEventListener("click", loadContent);
        nameFieldElement.addEventListener("click", unloadContent);
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
        for(let element of result.elements)
        {
            var tr = document.createElement("tr");
            //For complex elements, create the "button" to get more info
            var tdName = document.createElement("td");
            var tdValue = document.createElement("td");
            if (element.hasChildren) {
                if(element.value) {
                    tdName.appendChild(document.createTextNode(element.name + " - " + element.value));
                } else {
                    tdName.appendChild(document.createTextNode(element.name));
                }
                tdName.id = "xmlGridViewNameField-" + element.fullPath;
                tdName.addEventListener("click", loadContent);
                tr.appendChild(tdName);
                tdValue.appendChild(document.createTextNode("click to expand"));
                tdValue.id = element.fullPath;
                tdValue.addEventListener("click", loadContent);
                tr.appendChild(tdValue);
            } else {
                tdName.appendChild(document.createTextNode(element.name));
                tr.appendChild(tdName);
                tdValue.appendChild(document.createTextNode(element.value));
                tr.appendChild(tdValue);
            }
            tbl.appendChild(tr);
        }

    }
    target.appendChild(tbl);
}

function main()
{
    cbMapper.addCallback(0, serverReady);
    
    //For debugging, the breakpoints in the webview developer panel only work when its open,
    //so we need to wait until we can open it and then start manually
    document.getElementById("/").addEventListener("click", loadContent);

    window.addEventListener('message', event => {
        const message = event.data;
        console.log("Received: " + JSON.stringify(message));
        cbMapper.call(message.id, message.result);
    });
}

vscode = acquireVsCodeApi();
var cbMapper = new CallbackMapper();
main();