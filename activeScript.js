/**
 * Script to modify user's active page
 * Author: Jesse Xu
 * Credit to Ted Pavlic for his implementation of search engine highlight
 */

/*** CONSTANTS ***/
let ELEMENT_NODE_TYPE = 1;
let TEXT_NODE_TYPE = 3;
let UNEXPANDABLE = /(script|style|svg|audio|canvas|figure|video|select|input|textarea)/i;
let HIGHLIGHT_TAG = 'highlight-tag';
let HIGHLIGHT_CLASS = 'highlighted';
let SELECTED_CLASS = 'selected';
let DEFAULT_MAX_RESULTS = 500;
let DEFAULT_HIGHLIGHT_COLOR = '#87d3ff';
let DEFAULT_SELECTED_COLOR = '#ff9900';
let DEFAULT_TEXT_COLOR = '#000000';
let DEFAULT_CASE_INSENSITIVE = false;

let originalBodyText;
let searchInfo;
let highlighted = "to_highlight";
let saveSelection, restoreSelection;
let currentlySelected;
let selectedText;
let inputTag;
let inputStart;
let inputEnd;
let selectInputField = false;

/*** LIBRARY FUNCTIONS ***/
Element.prototype.documentOffsetTop = function()
{
    return this.offsetTop + (this.offsetParent ? this.offsetParent.documentOffsetTop() : 0);
};
Element.prototype.visible = function() {
    return (!window.getComputedStyle(this) || window.getComputedStyle(this)
            .getPropertyValue('display') === '' ||
        window.getComputedStyle(this)
            .getPropertyValue('display') !== 'none')
}

function stripVowelAccentAndLowerCase(str)
{
    let rExps=[ /[\xC0-\xC2]/g, /[\xE0-\xE2]/g,
        /[\xC8-\xCA]/g, /[\xE8-\xEB]/g,
        /[\xCC-\xCE]/g, /[\xEC-\xEE]/g,
        /[\xD2-\xD4]/g, /[\xF2-\xF4]/g,
        /[\xD9-\xDB]/g, /[\xF9-\xFB]/g ];

    let repChar=['A','a','E','e','I','i','O','o','U','u'];

    for(let i=0; i<rExps.length; ++i)
        str=str.replace(rExps[i],repChar[i]);

    return str.toLowerCase();
}

//Get what the user has selected on the screen
function getSelected()
{
    let selection="";
    let selTag="";

    if (window.getSelection)
    {
        selection = window.getSelection();
    }
    else if (document.getSelection)
    {
        selection=document.getSelection();
        selTag=document.activeElement.nodeName;
    }
    else if (document.selection)
    {
        selection=document.selection.createRange();
        selTag=document.activeElement.nodeName;
    }

    // if(document.activeElement && document.activeElement.nodeName.toUpperCase() === "INPUT")
    // {
    //     selection="";
    // }
    return selection;
}


//User performs a selection action
function mouseup()
{
    currentlySelected = getSelected();
    selectedText = currentlySelected.toString()
        .trim();
    selectedText = stripVowelAccentAndLowerCase(selectedText);

    // remove all existing highlighting
    removeHighlight();

    // remove all markers
    removeMarkers();


    if (selectedText.length > 0)
    {
        doSave();
        highlightSearchTerms(selectedText, false, false, false);

    }

    // alert(selectedText);
}

//If user selects a phrase, option to search as is or split up into individual words
function highlightSearchTerms(searchText, treatAsPhrase, warnOnFailure, isSearch)
{
    let searchArray;
    if (!treatAsPhrase)
    {
        searchArray = [searchText];
    }
    else
    {
        searchArray = searchText;
    }


    if (!document.body || typeof(document.body.innerHTML) === "undefined")
    {
        if (warnOnFailure)
        {
            alert("Text is unavailable");
        }
        return false;
    }

    for (let i = 0; i < searchArray.length; i++)
    {
        search(searchArray[i],true, isSearch);

    }
    return true;
}

function createSelection(field, start, end)
{
    if( field.createTextRange )
    {
        let selRange = field.createTextRange();
        selRange.collapse(true);
        selRange.moveStart('character', start);
        selRange.moveEnd('character', end);
        selRange.select();
    }
    else if( field.setSelectionRange )
    {
        field.setSelectionRange(start, end);
    }
    else if( field.selectionStart )
    {
        field.selectionStart = start;
        field.selectionEnd = end;
    }
    field.focus();
}

if (window.getSelection && document.createRange)
{
    saveSelection = function(containerEl)
    {
        let range = window.getSelection().getRangeAt(0);
        range.setEnd(range.startContainer, range.startOffset+selectedText.length);
        if (range.startOffset===range.endOffset || document.activeElement.tagName.toLowerCase() === "input")
        {
            inputTag = document.activeElement.id;
            let ta = document.getElementById(inputTag);
            let taText = ta.value;
            inputStart = taText.indexOf(selectedText);
            inputEnd = inputStart + selectedText.length;
            selectInputField = true;
        }
        let preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(containerEl);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        let start = preSelectionRange.toString().length;
        return {start: start,
            end: start + range.toString()
                .length}
    };
    restoreSelection = function(containerEl, savedSel)
    {
        let charIndex = 0,
            range = document.createRange();
        range.setStart(containerEl, 0);
        range.collapse(true);
        let nodeStack = [containerEl],
            node, foundStart = false,
            stop = false;
        while (!stop && (node = nodeStack.pop()))
        {
            if (node.nodeType === 3)
            {
                let nextCharIndex = charIndex + node.length;
                if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex)
                {
                    range.setStart(node, savedSel.start - charIndex);
                    foundStart = true;
                }
                // if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex)
                if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex)
                {
                    range.setEnd(node, savedSel.end - charIndex);
                    stop = true;
                }
                charIndex = nextCharIndex;
            }
            else
            {
                let i = node.childNodes.length;
                while (i--)
                {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        restoreInputSelection();
    }
    restoreInputSelection = function(tag, start, end)
    {
        let input = document.getElementById(tag);
        input.focus();
        input.setSelectionRange(start,end);
        selectInputField = false;
    }
}
else if (document.selection && document.body.createTextRange)
{
    saveSelection = function(containerEl)
    {
        let selectedTextRange = document.selection.createRange();
        let preSelectionTextRange = document.body.createTextRange();
        preSelectionTextRange.moveToElementText(containerEl);
        preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
        let start = preSelectionTextRange.text.length;
        return{
            start: start,
            end: start + selectedTextRange.text.length}
    };
    restoreSelection = function(containerEl, savedSel)
    {
        let textRange = document.body.createTextRange();
        textRange.moveToElementText(containerEl);
        textRange.collapse(true);
        textRange.moveEnd("character", savedSel.end);
        textRange.moveStart("character", savedSel.start);
        textRange.select();

    };
}

let savedElement;
let savedSelection;
function doSave()
{
    savedElement = document.getElementsByTagName("body")[0];
    savedSelection = saveSelection(savedElement);
}
function doRestore()
{
    if (savedElement && savedSelection)
    {
        if (!selectInputField)
        {
            restoreSelection(savedElement, savedSelection);
        }
        else
        {
            // restoreInputSelection(inputTag, inputStart, inputEnd);
            createSelection(inputTag,inputStart,inputEnd);
        }
    }
}
$('body')
    .mouseup(function(e)
    {
        mouseup();
    });

window.onload = function()
{
    originalBodyText = document.getElementsByTagName("body")[0];
};

/* Initialize search information for this tab */
function initSearchInfo(pattern)
{
    var pattern = typeof pattern !== 'undefined' ? pattern : '';
    searchInfo =
        {
        regexString: pattern,
        selectedIndex: 0,
        highlightedNodes: [],
        length: 0
    }
}
/* Send message with search information for this tab */
function returnSearchInfo(cause)
{
    chrome.runtime.sendMessage
    ({
        'message': 'returnSearchInfo',
        'regexString': searchInfo.regexString,
        'currentSelection': searchInfo.selectedIndex,
        'numResults': searchInfo.length,
        'cause': cause
    });
}
/* Check if the given node is a text node */
function isTextNode(node)
{
    return node && node.nodeType === TEXT_NODE_TYPE;
}
/* Check if the given node is an expandable node that will yield text nodes */
function isExpandable(node)
{
    return node && node.nodeType === ELEMENT_NODE_TYPE && node.childNodes &&
        !UNEXPANDABLE.test(node.tagName) && node.visible();
}

/* Highlight all text that matches regex */
function highlight(regex, highlightColor, textColor, maxResults)
{
    let markers =[];
    function highlightRecursive(node)
    {
        if (searchInfo.length >= maxResults)
        {
            return;
        }
        if (isTextNode(node))
        {
            let index = node.data.search(regex);
            if (index >= 0 && node.data.length > 0)
            {
                let matchedText = node.data.match(regex)[0];
                let matchedTextNode = node.splitText(index);
                matchedTextNode.splitText(matchedText.length);
                let spanNode = document.createElement(HIGHLIGHT_TAG);
                spanNode.className = HIGHLIGHT_CLASS;
                spanNode.style.backgroundColor = highlightColor;
                spanNode.style.color = textColor;
                spanNode.appendChild(matchedTextNode.cloneNode(true));
                matchedTextNode.parentNode.replaceChild(spanNode, matchedTextNode);

                markers.push(spanNode);

                searchInfo.highlightedNodes.push(spanNode);
                searchInfo.length += 1;
                return 1;
            }
        } else if (isExpandable(node))
        {
            let children = node.childNodes;
            for (let i = 0; i < children.length; ++i)
            {
                let child = children[i];
                i += highlightRecursive(child);
            }
        }
        return 0;
    }

    highlightRecursive(document.getElementsByTagName('body')[0]);

    // Set scrollmarkers
    initializeMarkers(highlightColor);

    // Restore focus to selected text
    doRestore();

}
/* Remove all highlights from page */
function removeHighlight()
{
    while (node = document.body.querySelector(HIGHLIGHT_TAG + '.' + HIGHLIGHT_CLASS))
    {
        node.outerHTML = node.innerHTML;
    }
    while (node = document.body.querySelector(HIGHLIGHT_TAG + '.' + SELECTED_CLASS)) {
        node.outerHTML = node.innerHTML;
    }
}

/**
 * Navigation methods
 */

/* Scroll page to given element */
function scrollToElement(element)
{
    element.scrollIntoView();
    let top = element.documentOffsetTop() - (window.innerHeight / 2);
    window.scrollTo(0, Math.max(top, window.pageYOffset - (window.innerHeight / 2)));
}

/* Select first regex match on page */
function selectFirstNode(selectedColor)
{
    let length = searchInfo.length;
    if (length > 0)
    {
        searchInfo.highlightedNodes[0].className = SELECTED_CLASS;
        searchInfo.highlightedNodes[0].style.backgroundColor = selectedColor;
        scrollToElement(searchInfo.highlightedNodes[0]);
    }
}

/* Helper for selecting a regex matched element */
function selectNode(highlightedColor, selectedColor, getNext)
{
    let length = searchInfo.length;
    if (length > 0)
    {
        searchInfo.highlightedNodes[searchInfo.selectedIndex].className = HIGHLIGHT_CLASS;
        searchInfo.highlightedNodes[searchInfo.selectedIndex].style.backgroundColor = highlightedColor;
        if (getNext)
        {
            if (searchInfo.selectedIndex === length - 1)
            {
                searchInfo.selectedIndex = 0;
            }
            else {
                searchInfo.selectedIndex += 1;
            }
        }
        else
            {
            if (searchInfo.selectedIndex === 0)
            {
                searchInfo.selectedIndex = length - 1;
            }
            else
                {
                searchInfo.selectedIndex -= 1;
            }
        }
        searchInfo.highlightedNodes[searchInfo.selectedIndex].className = SELECTED_CLASS;
        searchInfo.highlightedNodes[searchInfo.selectedIndex].style.backgroundColor = selectedColor;
        returnSearchInfo('selectNode');
        scrollToElement(searchInfo.highlightedNodes[searchInfo.selectedIndex]);
    }
}
/* Forward cycle through regex matched elements */
function selectNextNode(highlightedColor, selectedColor)
{
    selectNode(highlightedColor, selectedColor, true);
}
/* Backward cycle through regex matched elements */
function selectPrevNode(highlightedColor, selectedColor)
{
    selectNode(highlightedColor, selectedColor, false);
}
/* Validate that a given pattern string is a valid regex */
function validateRegex(pattern)
{
    try
    {
        let regex = new RegExp(pattern);
        return regex;
    } catch (e)
    {
        return false;
    }
}

/* Find and highlight regex matches in web page from a given regex string or pattern */
function search(regexString, configurationChanged, isSearch)
{
    let regex = validateRegex(regexString);
    if (regex && regexString !== '' && (configurationChanged || regexString !== searchInfo.regexString))
    { // new valid regex string
        removeHighlight();
        chrome.storage.local.get
        ({
                'highlightColor': DEFAULT_HIGHLIGHT_COLOR,
                'selectedColor': DEFAULT_SELECTED_COLOR,
                'textColor': DEFAULT_TEXT_COLOR,
                'maxResults': DEFAULT_MAX_RESULTS,
                'caseInsensitive': DEFAULT_CASE_INSENSITIVE
            },
            function(result)
            {
                initSearchInfo(regexString);
                // if (result.caseInsensitive) {
                    regex = new RegExp(regexString, 'i');
                // }
                if (isSearch)
                {
                    highlight(regex, result.selectedColor, result.textColor, result.maxResults);
                }
                else
                {
                    highlight(regex, result.highlightColor, result.textColor, result.maxResults);
                }
                returnSearchInfo('search');
            }
        );
    }
    else if (regex && regexString !== '' && regexString === searchInfo.regexString)
    { // elements are already highlighted
        chrome.storage.local.get
        ({
                'highlightColor': DEFAULT_HIGHLIGHT_COLOR,
                'selectedColor': DEFAULT_SELECTED_COLOR
            },
            function(result)
            {

                selectNextNode(result.highlightColor, result.selectedColor);
            }
        );
    }
    else
        { // blank string or invalid regex
        removeHighlight();
        initSearchInfo(regexString);
        returnSearchInfo('search');
    }
}
/*** FUNCTIONS ***/
/*** LISTENERS ***/
/* Received search message, find regex matches */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    if ('search' === request.message)
    {
        search(request.regexString, request.configurationChanged);
    }
});
/* Received selectNextNode message, select next regex match */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    if ('selectNextNode' === request.message)
    {
        chrome.storage.local.get
        ({
                'highlightColor': DEFAULT_HIGHLIGHT_COLOR,
                'selectedColor': DEFAULT_SELECTED_COLOR
            },
            function(result)
            {
                selectNextNode(result.highlightColor, result.selectedColor);
            }
        );
    }
});
/* Received selectPrevNode message, select previous regex match */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    if ('selectPrevNode' === request.message)
    {
        chrome.storage.local.get
        ({
                'highlightColor': DEFAULT_HIGHLIGHT_COLOR,
                'selectedColor': DEFAULT_SELECTED_COLOR
            },
            function(result)
            {
                selectPrevNode(result.highlightColor, result.selectedColor);
            }
        );
    }
});
/* Received getSearchInfo message, return search information for this tab */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
    if ('getSearchInfo' === request.message)
    {
        sendResponse
        ({
            message: "I'm alive!"
        });
        returnSearchInfo('getSearchInfo');
    }
});

/*** LISTENERS ***/
/*** INIT ***/
initSearchInfo();
/*** INIT ***/

// setTimeout(function() {
//     checkPage();
// }, 1000);
//
// let checkPage = function()
// {
//     if(window.getSelection() && document.createRange())
//     {
//         alert(window.getSelection());
//         let range = window.getSelection().getRangeAt(0);
//         alert("start: " + range.startOffset + " end: " + range.endOffset);
//     }
// };

