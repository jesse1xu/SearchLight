/**
 * Script to highlight search engine terms on page
 * Author: Jesse Xu
 */

// Todo: searchterms function only works on some webpages. Work out algorithm for highlighting only key terms
// Doesn't work on some webpages because webpage loads content over highlighting

let checkIfSearchPage = function()
{
    let header = document.title;
    if (header.indexOf("Google Search")>-1 || header.indexOf("Bing")>-1 || header.indexOf("Yahoo Search")>-1)
    {
        let searchTerms = header.match(/(.*) - .*/);
        let terms = getUncommon(searchTerms[1]);
        let checkNext = true;
        $('.r, .b_algo, .title').click(function()
        {
            storeSearchInfo(terms, checkNext);
            alert (terms);
        });
    }
}

function getUncommon(sentence) {
    var wordArr = sentence.match(/\S+/g),
        commonObj = {},
        uncommonArr = [],
        word, i;

    let common = getStopWords();
    for ( i = 0; i < common.length; i++ ) {
        commonObj[ common[i].trim() ] = true;
    }

    for ( i = 0; i < wordArr.length; i++ ) {
        word = wordArr[i].trim().toLowerCase();
        if ( !commonObj[word] ) {
            uncommonArr.push(word);
        }
    }

    return uncommonArr;
}

function getStopWords() {
    return ["the","of","and","a","to","in","is","you","that","it","he","was","for","on","are","as","with","his","they","I","at","be","this","have","from","or","one","had","by","word","but","not","what","all","were","we","when","your","can","said","there","use","an","each","which","she","do","how","their","if","will","up","other","about","out","many","then","them","these","so","some","her","would","make","like","him","into","time","has","look","two","more","write","go","see","number","no","way","could","people","my","than","first","water","been","call","who","oil","its","now","find","long","down","day","did","get","come","made","may","part","a", "able", "about", "across", "after", "all", "almost", "also", "am", "among", "an", "and", "any", "are", "as", "at", "be", "because", "been", "but", "by", "can", "cannot", "could", "dear", "did", "do", "does", "either", "else", "ever", "every", "for", "from", "get", "got", "had", "has", "have", "he", "her", "hers", "him", "his", "how", "however", "i", "if", "in", "into", "is", "it", "its", "just", "least", "let", "like", "likely", "may", "me", "might", "most", "must", "my", "neither", "no", "nor", "not", "of", "off", "often", "on", "only", "or", "other", "our", "own", "rather", "said", "say", "says", "she", "should", "since", "so", "some", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "tis", "to", "too", "twas", "us", "wants", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "yet", "you", "your", "ain't", "aren't", "can't", "could've", "couldn't", "didn't", "doesn't", "don't", "hasn't", "he'd", "he'll", "he's", "how'd", "how'll", "how's", "i'd", "i'll", "i'm", "i've", "isn't", "it's", "might've", "mightn't", "must've", "mustn't", "shan't", "she'd", "she'll", "she's", "should've", "shouldn't", "that'll", "that's", "there's", "they'd", "they'll", "they're", "they've", "wasn't", "we'd", "we'll", "we're", "weren't", "what'd", "what's", "when'd", "when'll", "when's", "where'd", "where'll", "where's", "who'd", "who'll", "who's", "why'd", "why'll", "why's", "won't", "would've", "wouldn't", "you'd", "you'll", "you're", "you've"];
}

function storeSearchInfo(terms, checkNext)
{
    chrome.storage.local.set({
        "terms": terms,
        "isPageFromSearch" : checkNext
    }, function(){});
}

let checkifPageToHighlight = function()
{
    let checkPage;
    let termsToCheck = [];
    chrome.storage.local.get(["terms", "isPageFromSearch"], function(result){
            checkPage = result.isPageFromSearch;
            termsToCheck = result.terms;

            if (checkPage)
            {
                highlightSearchTerms(termsToCheck, true, false, true);

                // reset if search page
                chrome.storage.local.set(
                    { "terms": [],
                        "isPageFromSearch" : false
                    });
            }
        });


}


$(document).ready(function() {checkIfSearchPage()});
// $(window).load(function() {checkifPageToHighlight()});

// $('body')
//     .mouseup(function(e)
//     {
//         checkifPageToHighlight();
//     });

var delayInMilliseconds = 750; //.75 second

setTimeout(function() {
    checkifPageToHighlight();
}, delayInMilliseconds);