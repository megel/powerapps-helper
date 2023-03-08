//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    console.log('Initial Script', "");

    showProgress("Loading...");

    // @ts-ignore
    const vscode = acquireVsCodeApi();

    // State
    //const oldState = vscode.getState() || { solution: null };    
    //let solution = oldState.solution;

    const btnSolution = document.getElementById('btnSolution');
    if (btnSolution !== null) {
        btnSolution.addEventListener("click", (ev) => {
            onSolutionClicked("sol1");
        });
      }

    // updateColorList(colors);
    const slider = document.getElementById('zoomSlider');
        
    if (slider !== null) {
      slider.addEventListener("change", (ev) => {
        
        var slider = document.getElementById('zoomSlider');
        if (slider !== null) {
            // @ts-ignore
            zoomVal(slider.value);
        }
      });
    }

    console.log('Register Event', "");
    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        console.log('Initial Event', event);
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'progress':
                {
                    showProgress(message.data || "");
                    break;
                }
        }
    });

    /** 
     * @param {string} solutionId
     */
    function onSolutionClicked(solutionId) {
        vscode.postMessage({ command: 'solutionSelected', value: solutionId });
    }

    /** 
     * @param {string} message
     */
    function showProgress(message = "") {
        console.log('Show Progress', message);
        const info = document.getElementById('info');
        if (info !==null) {
            info.innerText = message;
            info.style.visibility = (message ?? "").length ===0 ? "hidden" : "visible";
        }
    }
    
    function setZoom(zoom, el) {			
        var transformOrigin = [0,0];
        el = el;// || instance.getContainer();
        var p = ["webkit", "moz", "ms", "o"],
            s = "scale(" + zoom + ")",
            oString = (transformOrigin[0] * 100) + "% " + (transformOrigin[1] * 100) + "%";
    
        for (var i = 0; i < p.length; i++) {
            el.style[p[i] + "Transform"] = s;
            el.style[p[i] + "TransformOrigin"] = oString;
        }
    
        el.style["transform"] = s;
        el.style["transformOrigin"] = oString;
            
    }
    
    function zoomVal(a){
        var zoomScale = Number(a)/10;
        var elements  = document.getElementsByClassName('svg-container');

        for (var i=0; i<elements.length; i++) {
            setZoom(zoomScale, elements[i]);    
        }
    }
}());










