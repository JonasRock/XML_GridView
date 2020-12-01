vscode = acquireVsCodeApi();
document.getElementById("loadContent").addEventListener("click", loadContent);

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.method) {
        case 'content':
            var _visualizer = new visualizer($("#output"));
            _visualizer.visualize(message.params);
    }
});

function loadContent()
{
    vscode.postMessage(createMessage("init", null));
}

function createMessage(method, params)
{
    return {
        method: method,
        params: params
    };
}