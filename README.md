# Local Note App

A simple note-taking application built with HTML, CSS, and vanilla JavaScript. This application allows you to create, edit, and manage your notes locally in your browser. It utilizes Tauri for potential desktop application bundling, though the core functionality is web-based.

## Features

- **Rich Text Editing**: Format notes with headings, paragraphs, bold, italic, and underline.
- **Document Management**: Create, rename, and delete documents.
- **Image Support**: Insert images via URL or upload.
- **Local Storage**: All your documents are saved in the browser's local storage, ensuring your data persists between sessions.
- **Search Functionality**: Quickly find documents using the search bar.
- **HTML Export**: Export your documents as HTML files.
- **Responsive Design**: Adapts to various screen sizes.

## Screenshot

![LocalNoteApp Screenshot](screenshot.png)

## How It Works

The application is a single-page application (SPA) that runs entirely in the browser.
- **Frontend**: Built with vanilla HTML, CSS, and JavaScript.
    - `index.html`: The main structure of the application.
    - `style.css`: Styles for the application, providing a clean and modern user interface.
    - `script.js`: Handles all the application logic, including document management, editor functionality, local storage interaction, and UI updates.
- **Data Storage**: Uses the browser's `localStorage` API to store and retrieve documents.
- **Editor**: A `contenteditable` div is used as the rich text editor, with JavaScript handling formatting commands.

## Getting Started

1.  Clone this repository or download the source code.
2.  Open the `index.html` file in your web browser.

No build steps are required to run the web version.

## Recommended IDE Setup (for Tauri development)

If you plan to develop or build this as a Tauri desktop application:

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

Refer to the Tauri documentation for more information on building and developing Tauri applications.
