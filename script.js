// script.js
document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const documentListElement = document.getElementById('documentList');
    const btnNewDocument = document.getElementById('btnNewDocument');
    const btnExportHTML = document.getElementById('btnExportHTML');
    const searchDocumentsInput = document.getElementById('searchDocuments');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const saveStatusElement = document.getElementById('saveStatus');

    const initialPlaceholderHTML = `<p>Beginne hier mit der Eingabe...</p>`;
    const STORAGE_KEY_DOCS = 'simpleDocs';
    const STORAGE_KEY_ACTIVE_DOC_ID = 'simpleDocsActiveId';

    let documents = [];
    let activeDocumentId = null;
    let saveStatusTimeout;

    // --- Loading Indicator Functions ---
    function showLoadingIndicator() {
        loadingIndicator.classList.add('visible');
    }

    function hideLoadingIndicator() {
        loadingIndicator.classList.remove('visible');
    }

    // --- Save Status Functions ---
    function showSaveStatus(message = "Gespeichert!", duration = 2000) {
        saveStatusElement.textContent = message;
        saveStatusElement.classList.add('visible');
        clearTimeout(saveStatusTimeout);
        saveStatusTimeout = setTimeout(() => {
            saveStatusElement.classList.remove('visible');
        }, duration);
    }

    // --- Local Storage Functions ---
    function getDocumentsFromStorage() {
        const docs = localStorage.getItem(STORAGE_KEY_DOCS);
        return docs ? JSON.parse(docs) : [];
    }

    function saveDocumentsToStorage() {
        localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(documents));
    }

    function getActiveDocIdFromStorage() {
        return localStorage.getItem(STORAGE_KEY_ACTIVE_DOC_ID);
    }

    function saveActiveDocIdToStorage(docId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_DOC_ID, docId);
    }

    // --- Document Management ---
    function generateId() {
        return Date.now().toString();
    }

    function createNewDocument(title = "Neues Dokument", content = initialPlaceholderHTML) {
        showLoadingIndicator();
        const newDoc = {
            id: generateId(),
            title: title,
            content: content
        };
        documents.push(newDoc);
        saveDocumentsToStorage();
        hideLoadingIndicator();
        return newDoc;
    }

    function deleteDocument(docId) {
        showLoadingIndicator();
        documents = documents.filter(doc => doc.id !== docId);
        saveDocumentsToStorage();
        if (activeDocumentId === docId) {
            activeDocumentId = null;
            if (documents.length > 0) {
                loadDocument(documents[0].id);
            } else {
                const newDoc = createNewDocument();
                loadDocument(newDoc.id);
            }
        }
        renderDocumentList(searchDocumentsInput.value); // Pass current search term
        hideLoadingIndicator();
    }

    function updateDocumentTitle(docId, newTitle) {
        const doc = documents.find(d => d.id === docId);
        if (doc && newTitle.trim() !== "") {
            doc.title = newTitle.trim();
            saveDocumentsToStorage();
            renderDocumentList(searchDocumentsInput.value); // Pass current search term
            showSaveStatus("Titel gespeichert!");
        }
    }

    function updateDocumentContent(docId, newContent) {
        const doc = documents.find(d => d.id === docId);
        if (doc) {
            doc.content = newContent;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newContent;
            const h1 = tempDiv.querySelector('h1');
            let titleUpdatedByContent = false;
            if (h1 && h1.textContent.trim()) {
                if (doc.title !== h1.textContent.trim()) {
                    doc.title = h1.textContent.trim();
                    titleUpdatedByContent = true;
                }
            } else if (doc.title === "Neues Dokument" && newContent !== initialPlaceholderHTML && newContent.trim() !== '<p><br></p>' && newContent.trim() !== '') {
                const textContent = tempDiv.textContent.trim();
                if (textContent) {
                    const newAutoTitle = textContent.substring(0, 30) + (textContent.length > 30 ? '...' : '');
                    if (doc.title !== newAutoTitle) {
                        doc.title = newAutoTitle;
                        titleUpdatedByContent = true;
                    }
                }
            }
            saveDocumentsToStorage();
            if (titleUpdatedByContent) {
                renderDocumentList(searchDocumentsInput.value); // Update title in the list
            }
            showSaveStatus(); // Show "Gespeichert!"
        }
    }

    function loadDocument(docId) {
        showLoadingIndicator();
        const doc = documents.find(d => d.id === docId);
        if (doc) {
            activeDocumentId = doc.id;
            editor.innerHTML = doc.content;
            saveActiveDocIdToStorage(docId);
            renderDocumentList(searchDocumentsInput.value); // To highlight active document & maintain search
            handleFocusAndPlaceholder();
        }
        setTimeout(hideLoadingIndicator, 50); 
    }

    // --- UI Rendering ---
    function renderDocumentList(searchTerm = "") {
        documentListElement.innerHTML = ''; 
        
        const filteredDocuments = documents.filter(doc => 
            doc.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredDocuments.length === 0) {
            documentListElement.innerHTML = `<p style="text-align:center; color: #666; font-size: 13px;">${searchTerm ? 'Keine passenden Dokumente.' : 'Keine Dokumente.'}</p>`;
            return;
        }
        filteredDocuments.forEach(doc => {
            const listItem = document.createElement('li');
            listItem.dataset.docId = doc.id;
            listItem.classList.toggle('active', doc.id === activeDocumentId);

            const titleSpan = document.createElement('span');
            titleSpan.className = 'doc-title';
            titleSpan.textContent = doc.title || "Unbenanntes Dokument";
            
            let clickTimeout = null; // To manage single vs. double click

            titleSpan.addEventListener('click', (e) => {
                if (listItem.classList.contains('editing-title')) {
                    // If already in editing mode (e.g., input field is active), do nothing on click.
                    return;
                }
                clearTimeout(clickTimeout); // Clear any pending click action
                clickTimeout = setTimeout(() => {
                    // Ensure not in editing mode before loading (could be set by a quick dblclick)
                    if (!listItem.classList.contains('editing-title')) {
                        loadDocument(doc.id);
                    }
                }, 250); // 250ms delay to wait for a potential double-click
            });

            titleSpan.addEventListener('dblclick', () => {
                clearTimeout(clickTimeout); // Cancel the pending single click (loadDocument)

                if (listItem.classList.contains('editing-title')) return;

                listItem.classList.add('editing-title');
                titleSpan.style.display = 'none';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'doc-title-input';
                input.value = doc.title;
                
                const saveOrCancel = () => {
                    listItem.classList.remove('editing-title');
                    titleSpan.style.display = '';
                    if (input.parentNode) {
                        input.remove();
                    }
                    // updateDocumentTitle will call renderDocumentList, so no need to do it here explicitly
                };

                input.addEventListener('blur', () => {
                    updateDocumentTitle(doc.id, input.value);
                    saveOrCancel(); // Cleans up the input field
                });

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault(); 
                        updateDocumentTitle(doc.id, input.value);
                        saveOrCancel(); // Cleans up the input field
                    } else if (e.key === 'Escape') {
                        saveOrCancel(); // Just cleans up, doesn't save
                        renderDocumentList(searchDocumentsInput.value); // Re-render to show original title if escape
                    }
                });
                
                // deleteBtn is defined later in this loop iteration, but accessible via closure
                listItem.insertBefore(input, listItem.querySelector('.delete-doc-btn')); 
                input.focus();
                input.select();
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-doc-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.setAttribute('aria-label', 'Dokument löschen');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Möchten Sie "${doc.title || 'dieses Dokument'}" wirklich löschen?`)) {
                    deleteDocument(doc.id);
                }
            });

            listItem.appendChild(titleSpan);
            listItem.appendChild(deleteBtn);
            documentListElement.appendChild(listItem);
        });
    }

    // --- Editor Functionality ---
    const format = (command, value = null) => {
        try {
            document.execCommand(command, false, value);
        } catch (e) {
            console.error("Fehler bei execCommand:", e);
        }
        editor.focus();
    };

    // --- Placeholder and Focus Handling ---
    function handleFirstFocus() {
        if (editor.innerHTML.trim() === initialPlaceholderHTML) {
            editor.innerHTML = '<p><br></p>';
            const range = document.createRange();
            const sel = window.getSelection();
            if (sel && editor.firstChild) {
                try {
                    range.setStart(editor.firstChild, 0);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                } catch (e) {
                    editor.focus();
                }
            }
        }
        editor.removeEventListener('focus', handleFirstFocus);
    }

    function handleFocusAndPlaceholder() {
        if (editor.innerHTML.trim() === initialPlaceholderHTML) {
            editor.addEventListener('focus', handleFirstFocus);
        } else {
            editor.removeEventListener('focus', handleFirstFocus);
        }
    }

    editor.addEventListener('blur', () => {
        if (activeDocumentId) {
            updateDocumentContent(activeDocumentId, editor.innerHTML);
        }
        const editorContent = editor.innerHTML.trim();
        if (editorContent === '' || editorContent === '<p><br></p>' || editorContent === '<p></p>') {
            editor.innerHTML = initialPlaceholderHTML;
            handleFocusAndPlaceholder();
        }
    });
    
    let saveTimeout;
    editor.addEventListener('input', () => {
        if (activeDocumentId) {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                updateDocumentContent(activeDocumentId, editor.innerHTML);
            }, 500);
        }
        if (editor.innerHTML.trim() !== initialPlaceholderHTML && editor.innerHTML.trim() !== '<p><br></p>') {
            editor.removeEventListener('focus', handleFirstFocus);
        }
    });

    // --- Message Box (Custom Prompt for Image URL) ---
    const customPromptOverlay = document.getElementById('customPromptOverlay');
    const customPromptMessage = document.getElementById('customPromptMessage');
    const customPromptInput = document.getElementById('customPromptInput');
    const customPromptFileInput = document.getElementById('customPromptFileInput'); // Added
    const customPromptConfirm = document.getElementById('customPromptConfirm');
    const customPromptCancel = document.getElementById('customPromptCancel');
    let currentPromptResolve = null;

    function showCustomPrompt(message, defaultValue = "https://placehold.co/600x400/EEE/31343C?text=Platzhalterbild") {
        customPromptMessage.textContent = message;
        customPromptInput.value = defaultValue;
        customPromptFileInput.value = ''; // Clear file input
        customPromptOverlay.classList.add('visible');
        customPromptInput.focus();
        customPromptInput.select();
        return new Promise((resolve) => {
            currentPromptResolve = resolve;
        });
    }

    function hideCustomPrompt() {
        customPromptOverlay.classList.remove('visible');
        customPromptFileInput.value = ''; // Clear file input on hide as well
        if (currentPromptResolve) {
            currentPromptResolve = null;
        }
        editor.focus();
    }

    customPromptConfirm.addEventListener('click', () => {
        if (currentPromptResolve) {
            const file = customPromptFileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    currentPromptResolve({ type: 'file', data: e.target.result });
                    hideCustomPrompt();
                };
                reader.onerror = () => {
                    currentPromptResolve(null); // Indicate error or cancellation
                    hideCustomPrompt();
                    alert("Fehler beim Lesen der Datei.");
                };
                reader.readAsDataURL(file);
            } else {
                currentPromptResolve({ type: 'url', data: customPromptInput.value });
                hideCustomPrompt();
            }
        }
    });

    customPromptCancel.addEventListener('click', () => {
        if (currentPromptResolve) currentPromptResolve(null);
        hideCustomPrompt();
    });

    customPromptInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') customPromptConfirm.click();
        else if (event.key === 'Escape') customPromptCancel.click();
    });
    
    customPromptFileInput.addEventListener('change', () => {
        // If a file is selected, clear the URL input as they are mutually exclusive for this action
        if (customPromptFileInput.files.length > 0) {
            customPromptInput.value = '';
        }
    });

    // --- Toolbar Button Event Listeners ---
    document.getElementById('btnHeading1').addEventListener('click', () => format('formatBlock', '<h1>'));
    document.getElementById('btnHeading2').addEventListener('click', () => format('formatBlock', '<h2>'));
    document.getElementById('btnParagraph').addEventListener('click', () => format('formatBlock', '<p>'));
    document.getElementById('btnBold').addEventListener('click', () => format('bold'));
    document.getElementById('btnItalic').addEventListener('click', () => format('italic'));
    document.getElementById('btnUnderline').addEventListener('click', () => format('underline'));

    document.getElementById('btnInsertImage').addEventListener('click', async () => {
        const result = await showCustomPrompt("Gib die URL des Bildes ein oder wähle eine Datei aus:", "https://placehold.co/600x400/EEE/31343C?text=Mein+Bild");
        
        if (result && result.data) {
            const imageUrl = result.data; // This will be either a URL string or a base64 data URL
            const placeholderText = "Beginne hier mit der Eingabe...";
            if (editor.innerHTML.trim() === initialPlaceholderHTML || editor.innerHTML.trim() === '' || editor.innerHTML.trim() === '<p><br></p>') {
                editor.innerHTML = ''; // Clear placeholder if editor is empty or has only placeholder
            }
            const imgHTML = `<img src="${imageUrl}" alt="Eingefügtes Bild" style="max-width: 100%; height: auto;" onerror="this.onerror=null; this.src='https://placehold.co/600x400/EEE/31343C?text=Bild+nicht+ladbar'; this.alt='Bild konnte nicht geladen werden';">`;
            format('insertHTML', imgHTML);
            if (activeDocumentId) updateDocumentContent(activeDocumentId, editor.innerHTML);
        }
    });

    btnNewDocument.addEventListener('click', () => {
        showLoadingIndicator();
        const newDoc = createNewDocument();
        loadDocument(newDoc.id);
        editor.focus();
        if (editor.innerHTML.trim() === initialPlaceholderHTML) {
            editor.innerHTML = '<p><br></p>';
            const range = document.createRange();
            const sel = window.getSelection();
            if (sel && editor.firstChild) {
                try {
                    range.setStart(editor.firstChild, 0);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                } catch (e) { /* ignore */ }
            }
        }
        hideLoadingIndicator();
    });

    btnExportHTML.addEventListener('click', () => {
        if (!activeDocumentId) {
            alert("Bitte wählen Sie ein Dokument zum Exportieren aus.");
            return;
        }
        const currentDoc = documents.find(doc => doc.id === activeDocumentId);
        if (currentDoc) {
            const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>${currentDoc.title || 'Exportiertes Dokument'}</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: auto; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
${editor.innerHTML}
</body>
</html>`;
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = (currentDoc.title || 'Dokument').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        }
    });
    
    editor.addEventListener('keydown', (event) => {
        // Enter key behavior (existing logic)
        if (event.key === 'Enter') {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let parentNode = range.commonAncestorContainer.parentNode;
                if (range.commonAncestorContainer === editor) {
                    parentNode = editor.lastChild;
                } else if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE && range.commonAncestorContainer.parentNode === editor) {
                    // This case is less likely with the current setup but good to be aware of.
                }

                if (parentNode && parentNode !== editor && (parentNode.nodeName === 'H1' || parentNode.nodeName === 'H2')) {
                    let isAtEnd = false;
                    if (range.endOffset === parentNode.textContent.length) {
                        isAtEnd = true;
                    } else if (parentNode.childNodes.length > 0 && range.endContainer === parentNode.lastChild && range.endOffset === parentNode.lastChild.textContent.length) {
                        isAtEnd = true;
                    }

                    if (isAtEnd) {
                        event.preventDefault();
                        format('insertParagraph'); 
                    }
                }
            }
        } // This was the missing closing brace

        // Keyboard shortcuts
        if (event.ctrlKey || event.metaKey) { // metaKey for macOS
            let preventDefault = true;
            switch (event.key.toLowerCase()) {
                case 'b':
                    format('bold');
                    break;
                case 'i':
                    format('italic');
                    break;
                case 'u':
                    format('underline');
                    break;
                case '1':
                    format('formatBlock', '<h1>');
                    break;
                case '2':
                    format('formatBlock', '<h2>');
                    break;
                case '0': // Ctrl+0 for Paragraph (as P might be used for Print)
                    format('formatBlock', '<p>');
                    break;
                default:
                    preventDefault = false;
            }
            if (preventDefault) {
                event.preventDefault();
            }
        }
    });

    // --- Search Functionality ---
    searchDocumentsInput.addEventListener('input', (e) => {
        renderDocumentList(e.target.value);
    });

    // --- Initialization ---
    function initializeApp() {
        showLoadingIndicator();
        documents = getDocumentsFromStorage();
        activeDocumentId = getActiveDocIdFromStorage();

        if (documents.length === 0) {
            const firstDoc = createNewDocument("Erste Notiz", `<p>Willkommen! Dies ist deine erste Notiz.</p><h1>Überschrift Beispiel</h1><p>Füge hier deinen Text ein.</p>`);
            activeDocumentId = firstDoc.id;
        } else if (!activeDocumentId || !documents.find(doc => doc.id === activeDocumentId)) {
            activeDocumentId = documents.length > 0 ? documents[0].id : null;
        }
        
        if (activeDocumentId) {
            loadDocument(activeDocumentId);
        } else {
             renderDocumentList(); // Render empty state if no active/existing doc
             handleFocusAndPlaceholder();
        }
        hideLoadingIndicator();
    }

    initializeApp();
});
