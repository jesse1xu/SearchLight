/**
 * Script for popup.html
 */

// Automatically select highlighted terms in input field
let input = document.getElementById('selectedWord');
input.focus();
input.select();


let poweredOn = true;
function pressPower()
{
    if (poweredOn)
    {
        document.getElementById("power-button").src = "img/searchlight_128_gray.png";
        poweredOn=false;
    }
    else
    {
        document.getElementById("power-button").src = "img/searchlight_128.png";
        poweredOn=true;
    }
}

let expanded= false;
$(document).ready(function()
{
    $("#settingsIcon").click(function ()
    {
        alert("bet");
        // $header = $(this);
        // //getting the next element
        // $content = $header.next();
        // //open up the content needed - toggle the slide- if visible, slide up, if not slidedown.
        // $content.slideToggle(500, function () {
        //     //execute this after slideToggle is done
        //     //change text of header based on visibility of content div
        //     $header.text(function () {
        //         //change text based on condition
        //         return $content.is(":visible") ? "Collapse" : "Expand";
        //     });
        // });
    });
});

//TODO: toggling display not working
let expanded = false;
function expand()
{
    if(!expanded)
    {
        document.getElementById("settings").display = "block";
        expanded=true;
    }
    else
    {
        document.getElementById("settings").display = "none";
        expanded=false;
    }

}



document.getElementById("power-button").addEventListener("click",pressPower);
document.getElementById("settingsIcon").addEventListener("click",expand);

