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

function loadContent(e)
{
    sendRequest("getChildren", {"xPath": e.target.id}, showElements, e.target);
}

function serverReady(result)
{
    sendRequest("init", null, ()=>{} );
}

function showElements(result, domElement)
{
    domElement.removeEventListener("click", loadContent);
    target = domElement;
    target.innerHTML = "";

    var tbl = document.createElement("table");
    tbl.id = "xml-grid";

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
            var tdName = document.createElement("td");
            tdName.appendChild(document.createTextNode(element.name));
            tr.appendChild(tdName);
            var tdValue = document.createElement("td");
            //For complex elements, create the "button" to get more info
            if (element.hasChildren) {
                tdValue.appendChild(document.createTextNode("click to expand"));
                //fullPath gets sent by the xml server when children exist
                tdValue.id = element.fullPath;
                tdValue.addEventListener("click", loadContent);
                tr.appendChild(tdValue);
            } else {
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