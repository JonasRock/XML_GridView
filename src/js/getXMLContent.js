class CallbackMapper
{
    callbackMap;
    constructor()
    {
        this.callbackMap = new Map;
    }
    
    addCallback(id, callback)
    {
        this.callbackMap.set(id, callback);
    }
    
    call(id, result)
    {
        var retVal = (this.callbackMap.get(id))(result);
        this.callbackMap.delete(id);
        return retVal;
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
function sendRequest(method, params, callback)
{
    id = this.currentID++;
    cbMapper.addCallback(id, callback);
    const request = createMessage(method, params, id);
    console.log("Sending: " + JSON.stringify(request));
    vscode.postMessage(request);
};

function loadContent()
{
    var xPath = document.getElementById("textInput").value;
    sendRequest("getChildren", {"xPath": xPath}, showElements);
}

function serverReady(result)
{
    sendRequest("init", null, ()=>{} );
}

function showElements(result)
{
    target = document.getElementById("output");
    target.innerHTML = "";
    if(result.attributes && result.attributes.length)
    {
        //Attribute
        var text = document.createTextNode("Attributes:");
        target.appendChild(text);

        var tbl = document.createElement("table");
        tbl.style.width = "50%";
        tbl.style.border = "1px solid black";

        var header = document.createElement("tr");
        var name = document.createElement("th");
        name.appendChild(document.createTextNode("Name"));
        header.appendChild(name);
        var value = document.createElement("th");
        value.appendChild(document.createTextNode("Value"));
        header.appendChild(value);
        tbl.appendChild(header);

        for(let attribute of result.attributes)
        {
            var tr = document.createElement("tr");
            var tdName = document.createElement("td");
            tdName.appendChild(document.createTextNode(attribute.name));
            tr.appendChild(tdName);
            var tdValue = document.createElement("td");
            tdValue.appendChild(document.createTextNode(attribute.value));
            tr.appendChild(tdValue);
            tbl.appendChild(tr);
        }

        target.appendChild(tbl);
    }

    if(result.elements && result.elements.length)
    {
        //Elements
        var text = document.createTextNode("Elements:");
        target.appendChild(text);

        var tbl = document.createElement("table");
        tbl.style.width = "50%";
        tbl.style.border = "1px solid black";

        var header = document.createElement("tr");
        var name = document.createElement("th");
        name.appendChild(document.createTextNode("Name"));
        header.appendChild(name);
        var value = document.createElement("th");
        value.appendChild(document.createTextNode("Value"));
        header.appendChild(value);
        var hasChildren = document.createElement("th");
        hasChildren.appendChild(document.createTextNode("hasChildren"));
        header.appendChild(hasChildren);
        tbl.appendChild(header);

        for(let element of result.elements)
        {
            var tr = document.createElement("tr");
            var tdName = document.createElement("td");
            tdName.appendChild(document.createTextNode(element.name));
            tr.appendChild(tdName);
            var tdValue = document.createElement("td");
            tdValue.appendChild(document.createTextNode(element.value));
            tr.appendChild(tdValue);
            var tdHasChildren = document.createElement("td");
            tdHasChildren.appendChild(document.createTextNode(element.hasChildren));
            tr.appendChild(tdHasChildren);
            tbl.appendChild(tr);
        }

        target.appendChild(tbl);
    }
}

vscode = acquireVsCodeApi();
var cbMapper = new CallbackMapper();
cbMapper.addCallback(0, serverReady);
document.getElementById("loadContent").addEventListener("click", loadContent);
window.addEventListener('message', event => {
    const message = event.data;
    console.log("Received: " + JSON.stringify(message));
    cbMapper.call(message.id, message.result);
});