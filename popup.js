/**
 * Script for popup.html
 */
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
function expand()
{
    if (expanded)
    {

    }
}

document.getElementById("power-button").addEventListener("click",pressPower);

// Automatically select highlighted terms in input field
var input = document.getElementById('selectedWord');
input.focus();
input.select();