vscode = acquireVsCodeApi();
document.getElementById("loadContent").addEventListener("click", loadContent);

window.addEventListener('message', event => {
    const message = event.data;
    console.log(message);
    switch (message.method) {
        case 'content':
            var _visualizer = new visualizer($("#output"));
            _visualizer.visualize(message.params);
    }
});

function loadContent()
{
    vscode.postMessage(createMessage("init", null, 1));
}

function createMessage(method, params, id = undefined)
{
    if(id) {
        return {
            method: method,
            params: params,
            id: id
        };
    }
    else {
        return {
            method: method,
            params: params,
        };
    }
}