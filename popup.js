/**
 * Script for popup.html
 */

/*** CONSTANTS ***/
const DEFAULT_HIGHLIGHT_SEARCH_TERMS = true;
const DEFAULT_CASE_SENSITIVE = false;
const MAX_HISTORY_LENGTH = 30;
const DEFAULT_HIGHLIGHT_COLOR = '#87d3ff';
const DEFAULT_SELECTED_COLOR = '#ff9900';
const INPUT_MAX_WIDTH_PX = 240;
/*** CONSTANTS ***/

/*** VARIABLES ***/
let sentInput = false;
let processingKey = false;
let searchHistory = null;
let maxHistoryLength = MAX_HISTORY_LENGTH;
/*** VARIABLES ***/

// Send message to content script of tab to select next result
function selectNext() {
    chrome.tabs.query({
            'active': true,
            'currentWindow': true
        },
        function(tabs) {
            if ('undefined' !== typeof tabs[0].id && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    'message': 'selectNextNode'
                });
            }
        });
}

// Send message to content script of tab to select previous result
function selectPrev() {
    chrome.tabs.query({
            'active': true,
            'currentWindow': true
        },
        function(tabs) {
            if ('undefined' !== typeof tabs[0].id && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    'message': 'selectPrevNode'
                });
            }
        });
}

/* Send message to pass input string to content script of tab to find and highlight regex matches */
function passInputToContentScript() {
    passInputToContentScript(false);
}
function passInputToContentScript(configurationChanged) {
    if (!processingKey) {
        let regexString = document.getElementById('selectedWord')
            .value;
        // if (!isValidRegex(regexString)) {
        //     document.getElementById('inputRegex')
        //         .style.backgroundColor = ERROR_COLOR;
        // } else {
        //     document.getElementById('inputRegex')
        //         .style.backgroundColor = WHITE_COLOR;
        // }
        chrome.tabs.query({
                'active': true,
                'currentWindow': true
            },
            function(tabs) {
                if ('undefined' !== typeof tabs[0].id && tabs[0].id)
                {
                    processingKey = true;
                    chrome.tabs.sendMessage(tabs[0].id, {
                        'message': 'search',
                        'regexString': regexString,
                        'configurationChanged': configurationChanged,
                        'getNext': true
                    });
                    sentInput = true;
                }
            }
        );
    }
}

// Event Listeners
document.getElementById('right arrow')
    .addEventListener('click', function()
    {
        selectNext();
    });


document.getElementById('left arrow')
    .addEventListener('click', function()
    {
        selectPrev();
    });

document.getElementById("selectedWord")
    .addEventListener("keyup", function()
    {
        // if ($("#selectedWord").value !== undefined)
        // {
        //     if($("#selectedWord").value.length()>4)
        //     {
        //         setTimeout(function() {}, 750);
        //     }
        // }
        passInputToContentScript();

    });

// Case Sensitive checkbox
let caseCheck=document.getElementById("case-check");
caseCheck.addEventListener("change", function()
    {
        if(this.checked)
        {
            sentInput=false;
            chrome.storage.local.set
            ({
                caseSensitive: true
            });
            caseCheck.checked = true;
        }
        else
        {
            sentInput=false;
            chrome.storage.local.set
            ({
                caseSensitive: false
            });
            caseCheck.checked = false;
        }
    });

// Search Terms checkbox
let searchCheck=document.getElementById("search-check");
searchCheck.addEventListener("change", function()
{
    if(this.checked)
    {
        sentInput=false;
        chrome.storage.local.set
        ({
            highlightSearchTerms: true
        });
        search.checked = true;
    }
    else
    {
        sentInput=false;
        chrome.storage.local.set
        ({
            highlightSearchTerms: false
        });
        search.checked = false;
    }
});


// Received returnSearchInfo message, populate popup UI
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if ('returnSearchInfo' === request.message) {
        processingKey = false;
        if (request.numResults > 0) {
            document.getElementById('num-results')
                .innerHTML = String(request.currentSelection + 1) + ' / ' + String(request.numResults);
        }
        // else
        //     {
        //     document.getElementById('num-results')
        //         .innerHTML = String(request.currentSelection) + ' / ' + String(request.numResults);
        // }
        if (!sentInput) {
            document.getElementById('selectedWord')
                .value = request.regexString;
        }
        if (request.regexString !== document.getElementById('selectedWord')
            .value) {
            // document.getElementById("selectedWord").value=request.regexString;
            passInputToContentScript();
        }
    }
});

// Automatically select highlighted terms in input field
let input = document.getElementById('selectedWord');
input.focus();
input.select();

// Power Button
let poweredOn = true;
function pressPower()
{
    if (poweredOn)
    {
        document.getElementById("power-button").src = "img/searchlight_128_gray.png";
        chrome.storage.local.set
        ({
            poweredOn: false
        });
        poweredOn = false;
    }
    else
    {
        document.getElementById("power-button").src = "img/searchlight_128.png";
        chrome.storage.local.set
        ({
            poweredOn: true
        });
        poweredOn = true;
    }
}
document.getElementById("power-button").addEventListener("click",pressPower);

document.getElementById("num-results").addEventListener("DOMSubtreeModified", function()
{
    let numResultsWidth = $("#num-results").width();
    let inputWidth = INPUT_MAX_WIDTH_PX - numResultsWidth;
    document.getElementById("selectedWord").style.width=inputWidth + "px";
});


// Expansion
let expanded= false;
$(document).ready(function()
{
    $("#settingsIcon").click(function ()
    {
        if (!expanded)
        {
            document.getElementById("settingsIcon").src = "img/settings_blue.png";
            expanded=true;
        }
        else
        {
            document.getElementById("settingsIcon").src = "img/settings.png";
            expanded=false
        }
        $("#settings").slideToggle(500, function (){});
    });
});


//INIT
chrome.storage.local.get({
        'caseSensitive': DEFAULT_CASE_SENSITIVE,
        "highlightSearchTerms" : DEFAULT_HIGHLIGHT_SEARCH_TERMS,
        "highlightColor" : DEFAULT_HIGHLIGHT_COLOR,
        "selectedColor" : DEFAULT_SELECTED_COLOR,
        "poweredOn" : true
    },
    function(result) {
        if (result.caseSensitive)
        {
            document.getElementById('case-check').checked = true;
        }
        else
        {
            document.getElementById('case-check').checked = false;
        }
        if (result.highlightSearchTerms)
        {
            document.getElementById("search-check").checked = true;
        }
        else
        {
            document.getElementById("search-check").checked = false;
        }

        document.getElementById("highlight-color").value=result.highlightColor;
        document.getElementById("search-color").value=result.selectedColor;

        if (result.poweredOn)
        {
            document.getElementById("power-button").src = "img/searchlight_128.png";
        }
        else
        {
            document.getElementById("power-button").src = "img/searchlight_128_gray.png";
        }

        // Note: this is an awful solution, but it works so...
        selectNext();
        selectPrev();


        // if (result.maxHistoryLength) {
        //     maxHistoryLength = result.maxHistoryLength;
        // }
        // if (result.searchHistory) {
        //     searchHistory = result.searchHistory.slice(0);
        // } else {
        //     searchHistory = [];
        // }
        // setHistoryVisibility(result.isSearchHistoryVisible);
        // updateHistoryDiv();

        // Color Picker
        $("#highlight-color").spectrum({
            // color: "#87d3ff",
            showInput: true,
            className: "full-spectrum",
            showInitial: true,
            showPaletteOnly: true,
            togglePaletteOnly: true,
            togglePaletteMoreText: 'more',
            togglePaletteLessText: 'less',
            // showSelectionPalette: true,
            // maxSelectionSize: 4,
            showButtons: false,
            preferredFormat: "hex",
            hideAfterPaletteSelect: true,
            // localStorageKey: "spectrum.demo",
            move: function (color) {

            },
            show: function () {

            },
            beforeShow: function () {

            },
            hide: function () {

            },
            change: function(color)
            {
                chrome.storage.local.set
                ({
                    highlightColor: color.toHexString()
                });
                $("highlight-color").spectrum("set", color.toHexString());
            },
            palette:[
                ["#ff191e","#ff9900","#ffff33", "#32ff00","#87d3ff"],
                ["#ff938b","#ffbc58","#fffba7","#C7FF99","#BEF0FF"],
            ]
            // palette: [
            //     ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
            //         "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
            //     ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
            //         "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"],
            //     // ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)",
            //     //     "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)",
            //     //     "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)",
            //     //     "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)",
            //     //     "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)",
            //     //     "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
            //     //     "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
            //     //     "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
            //     //     "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)",
            //     //     "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
            // ]
        });

        $("#search-color").spectrum({
            // color: "#ff9900",
            showInput: true,
            className: "full-spectrum",
            showInitial: true,
            showPaletteOnly: true,
            togglePaletteOnly: true,
            togglePaletteMoreText: 'more',
            togglePaletteLessText: 'less',
            // showSelectionPalette: true,
            showButtons: false,
            // maxSelectionSize: 4,
            preferredFormat: "hex",
            hideAfterPaletteSelect: true,
            // localStorageKey: "spectrum.demo",
            move: function (color) {

            },
            show: function () {

            },
            beforeShow: function () {

            },
            hide: function () {

            },
            change: function(color)
            {
                chrome.storage.local.set
                ({
                    selectedColor: color.toHexString()
                });
                $("search-color").spectrum("set", color.toHexString());
            },
            palette:[
                ["#ff191e","#ff9900","#ffff33", "#32ff00","#87d3ff"],
                ["#ff938b","#ffbc58","#FFF981","#C7FF99","#BEF0FF"],
            ]
        });

    }
);




