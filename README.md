# XML Grid View #

This extension provides a alternative representation of XML files.

## Prerequesites ##

For bigger files (>50MB) VSCode disables extensions. To get around this, the extension [Large file support for extensions](https://marketplace.visualstudio.com/items?itemName=mbehr1.vsc-lfs) is needed.

---------------

## How to use ##

When opening the file, choose the XML Grid View as the editor.
- Right Click the open file and choose **reopen editor with**
- Right Click the file in the file explorer and choose **open with**

---------------

## Features ##

- **Grid View** for XML Files. Expand and collapse elements as needed.
- **Go to Position in Text Editor**: Right click any element
- **Performant even for big files**: Content is streamed in as needed, so the editor stays performant

---------------

## Useful Commands and Shortcuts ##

- **Right-Click** to open a context menu for additional features

---------------

## Settings ##

- **Autosar Mode** include the SHORT-NAME of elements in its name, providing clearer array representation for .arxml files

---------------

## Common issues ##

### Extension does not work on big files ###

For files bigger than around 50mb, Visual Studio Code disables all extensions automatically.
The current workaround for this is to use the VSCode extension
[Large file support for extensions](https://marketplace.visualstudio.com/items?itemName=mbehr1.vsc-lfs).
Install it and use to command (Ctrl+Shift+P) **open large file...**

### Editor resets on reopening ###

State saving is currently work in progress

### No editing possibilities ###

This is currently a readonly extension

## Backend/Developing yourself ##

The extension uses the [XML_GridViewServer](https://github.com/JonasRock/XML_GridViewServer) as a backend. The binaries are bundled with the extension for Linux and Windows, so no need to install manually. To bundle the extension yourself, include the server binary as "XML_GridViewServer_Linux" or "XML_GridViewServer_Windows.exe" depending on your OS. You can also include both binaries.